<?php

namespace App\Services;

use App\Enums\ActivityAction;
use App\Enums\NotificationKind;
use App\Enums\UserStatus;
use App\Jobs\NotifyAllAccounts;
use App\Models\ActivityLog;
use App\Models\ChecklistResponse;
use App\Models\MonitoringReport;
use App\Models\Notification;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\SiteFeedback;
use App\Models\SurveyResponse;
use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Throwable;

/**
 * Tells people about what concerns them. The one place that decides who
 * hears about what, and the only writer of `notifications`.
 *
 * Call it after the change and its activity log entry, with the entry the
 * recorder returned. Nobody is told about their own actions, and accounts
 * that cannot sign in are told nothing. A notice that cannot be written is
 * reported, never thrown, so it can never undo the change it tells of.
 */
class Notifier
{
    /** Notices written per insert. */
    private const CHUNK = 500;

    /**
     * A comment: the person a reply answers, and the post's author.
     */
    public function postCommented(Post $post, PostComment $comment, ?ActivityLog $entry): void
    {
        $answered = $comment->reply_to_user_id;

        if ($answered !== null) {
            $this->send(NotificationKind::CommentReplied, $entry, [$answered]);
        }

        if ($post->user_id !== $answered) {
            $this->send(NotificationKind::PostCommented, $entry, [$post->user_id]);
        }
    }

    /**
     * A reaction: the author hears of the first one. A changed reaction moves
     * their notice to the new one, without making it unread again.
     */
    public function postReacted(Post $post, User $member, ?ActivityLog $entry, bool $first): void
    {
        if ($first) {
            $this->send(NotificationKind::PostReacted, $entry, [$post->user_id]);

            return;
        }

        if ($entry !== null) {
            $this->guarded(fn () => $this->reactionNotices($post, $member)->update(['activity_log_id' => $entry->id]));
        }
    }

    /** A reaction taken back takes its notice with it. */
    public function reactionWithdrawn(Post $post, User $member): void
    {
        $this->guarded(fn () => $this->reactionNotices($post, $member)->delete());
    }

    public function postShared(Post $original, ?ActivityLog $entry): void
    {
        $this->send(NotificationKind::PostShared, $entry, [$original->user_id]);
    }

    public function postTagged(Post $post, ?ActivityLog $entry): void
    {
        $this->send(NotificationKind::PostTagged, $entry, $post->tags()->pluck('users.id')->all());
    }

    /** A post removed by a moderator; removing your own tells no one. */
    public function postRemoved(Post $post, ?ActivityLog $entry): void
    {
        $this->send(NotificationKind::PostRemoved, $entry, [$post->user_id]);
    }

    /** A comment removed by a moderator; removing your own tells no one. */
    public function commentRemoved(PostComment $comment, ?ActivityLog $entry): void
    {
        $this->send(NotificationKind::CommentRemoved, $entry, [$comment->user_id]);
    }

    /** An HEI sent its signed report: CHED reviewers whose office covers it. */
    public function reportSubmitted(MonitoringReport $report, ?ActivityLog $entry): void
    {
        $this->send(NotificationKind::ReportSubmitted, $entry, User::query()
            ->withPermission('monitoring.review')
            ->reaching($report->survey_region_id));
    }

    /** CHED marked a report reviewed or returned it: the HEI's focal persons. */
    public function reportReviewed(MonitoringReport $report, ?ActivityLog $entry): void
    {
        $kind = $entry?->action === ActivityAction::Returned ? NotificationKind::ReportReturned : NotificationKind::ReportReviewed;

        $this->send($kind, $entry, User::query()
            ->withPermission('monitoring.submit')
            ->where('survey_hei_id', $report->survey_hei_id));
    }

    /** An HEI answered a GAD survey: CHED reviewers whose office covers it. */
    public function gadSurveySubmitted(ChecklistResponse $response, ?ActivityLog $entry): void
    {
        $this->send(NotificationKind::GadSurveySubmitted, $entry, User::query()
            ->withPermission('monitoring.review')
            ->reaching($response->survey_region_id));
    }

    /** A registration waiting for approval: user managers whose office covers its HEI. */
    public function accountRegistered(User $account, ?ActivityLog $entry): void
    {
        if ($account->status !== UserStatus::Pending) {
            return;
        }

        $this->send(NotificationKind::AccountPending, $entry, User::query()
            ->withPermission('users.update')
            ->reaching($entry?->survey_region_id));
    }

    public function accountApproved(User $account, ?ActivityLog $entry): void
    {
        $this->send(NotificationKind::AccountApproved, $entry, [$account->id]);
    }

    /** A new GAD event: everyone, in the background. */
    public function eventCreated(?ActivityLog $entry): void
    {
        if ($entry !== null) {
            $this->guarded(fn () => NotifyAllAccounts::dispatch(NotificationKind::EventCreated, $entry->id)->afterCommit());
        }
    }

    /**
     * Tell every active account but the actor, for NotifyAllAccounts. Unlike
     * the rest it throws, so the queue can try again; a retry never tells
     * anyone twice.
     */
    public function everyone(NotificationKind $kind, ActivityLog $entry): void
    {
        User::query()
            ->active()
            ->when($entry->user_id !== null, fn (Builder $query) => $query->whereKeyNot($entry->user_id))
            ->select('id')
            ->chunkById(self::CHUNK * 2, fn ($users) => $this->insert($kind, $entry, $users->pluck('id')->all()));
    }

    /**
     * An anonymous survey answer: staff who read survey responses, for the
     * answer's region (all of them when it names none). It counts up an
     * unread notice about the same survey, or starts one. Nothing about the
     * respondent is kept, only how many answered.
     */
    public function surveyResponseReceived(SurveyResponse $response): void
    {
        $this->guarded(function () use ($response): void {
            $survey = $response->version()->firstOrFail()->survey()->firstOrFail();
            $recipients = User::query()
                ->active()
                ->withPermission('survey-responses.view')
                ->when($response->survey_region_id !== null, fn (Builder $query) => $query->reaching($response->survey_region_id))
                ->pluck('id');
            $open = Notification::query()
                ->where('kind', NotificationKind::SurveyResponses)
                ->where('subject_type', $survey->getMorphClass())
                ->where('subject_id', (string) $survey->getKey())
                ->whereNull('read_at')
                ->whereIn('user_id', $recipients)
                ->pluck('id', 'user_id');
            $now = now();

            if ($open->isNotEmpty()) {
                Notification::query()->whereKey($open->values())->incrementEach(['count' => 1], ['notified_at' => $now]);
            }

            foreach ($recipients->diff($open->keys())->chunk(self::CHUNK) as $chunk) {
                Notification::query()->insert($chunk->map(fn (int $userId): array => [
                    'id' => self::newId(),
                    'user_id' => $userId,
                    'kind' => NotificationKind::SurveyResponses->value,
                    'subject_type' => $survey->getMorphClass(),
                    'subject_id' => (string) $survey->getKey(),
                    'count' => 1,
                    'notified_at' => $now,
                    'created_at' => $now,
                ])->values()->all());
            }
        });
    }

    /**
     * Website feedback: staff who read feedback, for the region it names (all
     * of them when it names none). Like survey answers, it counts up an
     * unread notice or starts one, and says nothing about the sender.
     */
    public function siteFeedbackReceived(SiteFeedback $feedback): void
    {
        $this->guarded(function () use ($feedback): void {
            $recipients = User::query()
                ->active()
                ->withPermission('feedback.view')
                ->when($feedback->survey_region_id !== null, fn (Builder $query) => $query->reaching($feedback->survey_region_id))
                ->pluck('id');
            $open = Notification::query()
                ->where('kind', NotificationKind::SiteFeedback)
                ->whereNull('read_at')
                ->whereIn('user_id', $recipients)
                ->pluck('id', 'user_id');
            $now = now();

            if ($open->isNotEmpty()) {
                Notification::query()->whereKey($open->values())->incrementEach(['count' => 1], ['notified_at' => $now]);
            }

            foreach ($recipients->diff($open->keys())->chunk(self::CHUNK) as $chunk) {
                Notification::query()->insert($chunk->map(fn (int $userId): array => [
                    'id' => self::newId(),
                    'user_id' => $userId,
                    'kind' => NotificationKind::SiteFeedback->value,
                    'count' => 1,
                    'notified_at' => $now,
                    'created_at' => $now,
                ])->values()->all());
            }
        });
    }

    /**
     * Tell the recipients still able to sign in, other than whoever acted.
     * Without an entry (the change went through but could not be logged)
     * there is nothing to point at, so no one is told.
     *
     * @param  Builder<User>|array<int, int|null>  $recipients
     */
    private function send(NotificationKind $kind, ?ActivityLog $entry, Builder|array $recipients): void
    {
        if ($entry === null) {
            return;
        }

        $this->guarded(function () use ($kind, $entry, $recipients): void {
            $query = $recipients instanceof Builder ? $recipients : User::query()->whereKey(array_filter($recipients));

            $this->insert($kind, $entry, $query
                ->active()
                ->when($entry->user_id !== null, fn (Builder $query) => $query->whereKeyNot($entry->user_id))
                ->pluck('id')
                ->all());
        });
    }

    /** @param  array<int, int>  $userIds */
    private function insert(NotificationKind $kind, ActivityLog $entry, array $userIds): void
    {
        $now = now();

        foreach (array_chunk($userIds, self::CHUNK) as $chunk) {
            Notification::query()->insertOrIgnore(array_map(fn (int $userId): array => [
                'id' => self::newId(),
                'user_id' => $userId,
                'kind' => $kind->value,
                'activity_log_id' => $entry->id,
                'count' => 1,
                'notified_at' => $now,
                'created_at' => $now,
            ], $chunk));
        }
    }

    /**
     * The author's notice of one member's reaction to their post.
     *
     * @return Builder<Notification>
     */
    private function reactionNotices(Post $post, User $member): Builder
    {
        return Notification::query()
            ->where('kind', NotificationKind::PostReacted)
            ->where('user_id', $post->user_id)
            ->whereHas('activity', fn (Builder $query) => $query
                ->where('user_id', $member->id)
                ->where('subject_type', $post->getMorphClass())
                ->where('subject_id', $post->id));
    }

    /** Lowercase, as HasUlids makes them. */
    private static function newId(): string
    {
        return strtolower((string) Str::ulid());
    }

    private function guarded(Closure $write): void
    {
        try {
            $write();
        } catch (Throwable $exception) {
            // The change itself went through; a missing notice must not undo it.
            report($exception);
        }
    }
}
