<?php

namespace App\Models;

use App\Enums\ActivityModule;
use App\Enums\NotificationKind;
use App\Support\ActivitySubjects;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Something one person is told about. Written only by App\Services\Notifier.
 * What happened, who did it and when live in the activity log entry it
 * points at; anonymous survey answers, which are never logged, point at
 * their survey instead.
 *
 * @property string $id
 * @property int $user_id
 * @property NotificationKind $kind
 * @property string|null $activity_log_id
 * @property string|null $subject_type
 * @property string|null $subject_id
 * @property int $count
 * @property CarbonImmutable $notified_at
 * @property CarbonImmutable|null $read_at
 * @property CarbonImmutable $created_at
 */
class Notification extends Model
{
    use HasUlids;

    public const UPDATED_AT = null;

    protected $guarded = [];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => NotificationKind::class,
            'count' => 'integer',
            'notified_at' => 'immutable_datetime',
            'read_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<ActivityLog, $this> */
    public function activity(): BelongsTo
    {
        return $this->belongsTo(ActivityLog::class, 'activity_log_id');
    }

    /**
     * Its own subject, for notices no one's activity explains.
     *
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /** The record it is about, while it exists. */
    public function about(): ?Model
    {
        return $this->activity_log_id !== null ? $this->activity?->subject : $this->subject;
    }

    /**
     * Where opening it leads, or null when the record is gone or the reader
     * may not open its page.
     */
    public function linkFor(User $viewer): ?string
    {
        if ($this->kind === NotificationKind::AccountApproved) {
            return route('dashboard');
        }

        // Website feedback has no one record to point at: it opens the list.
        if ($this->kind === NotificationKind::SiteFeedback) {
            return $viewer->can('feedback.view') ? route('admin.feedback.index') : null;
        }

        $subject = $this->about();

        // Survey answers open the answers, else the survey's Summary, else
        // (for an HEI's focal persons) their home, which counts their HEI's.
        if ($this->kind === NotificationKind::SurveyResponses) {
            return match (true) {
                ! $subject instanceof Survey => null,
                $viewer->can('survey-responses.view') => route('admin.surveys.responses.index', $subject),
                $viewer->can('surveys.view') => route('admin.surveys.summary', $subject),
                $viewer->isHeiOnly() => route('dashboard'),
                default => null,
            };
        }

        return match (true) {
            $subject === null => null,
            // Badges are told to the person who now holds them: their profile.
            in_array($this->kind, [NotificationKind::BadgeAwarded, NotificationKind::BadgeEarned], true) => route('my-profile', ['tab' => 'badges']),
            // A new follower: who they are.
            $this->kind === NotificationKind::UserFollowed => $this->activity?->user !== null
                ? route('people.show', $this->activity->user)
                : null,
            default => ActivitySubjects::url($subject, $viewer),
        };
    }

    /** @param  Builder<Notification>  $query */
    public function scopeUnread(Builder $query): void
    {
        $query->whereNull('read_at');
    }

    /**
     * The Notifications page's filters: `status` (unread), `kind`, `module`
     * and a search through who acted and what it is about.
     *
     * @param  Builder<Notification>  $query
     * @param  array<string, mixed>  $filters
     */
    public function scopeFilter(Builder $query, array $filters): void
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $module = ActivityModule::tryFrom((string) ($filters['module'] ?? ''));

        $query
            ->when(($filters['status'] ?? null) === 'unread', fn (Builder $query) => $query->whereNull('read_at'))
            ->when($filters['kind'] ?? null, fn (Builder $query, string $kind) => $query->where('kind', $kind))
            ->when($module, fn (Builder $query, ActivityModule $module) => $query->whereIn(
                'kind',
                array_map(fn (NotificationKind $kind): string => $kind->value, NotificationKind::inModule($module)),
            ))
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->whereHas('activity', fn (Builder $query) => $query
                    ->where('actor_name', 'like', "%{$search}%")
                    ->orWhere('subject_label', 'like', "%{$search}%"))
                ->orWhereHasMorph('subject', [Survey::class], fn (Builder $query) => $query->where('title', 'like', "%{$search}%"))));
    }
}
