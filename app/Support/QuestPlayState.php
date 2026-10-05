<?php

namespace App\Support;

use App\Enums\QuestLevel;
use App\Enums\QuestStatus;
use App\Models\Quest;
use App\Models\QuestAnswer;
use App\Models\QuestAttempt;
use App\Models\QuestChoice;
use App\Models\QuestQuestion;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * What a player sees of a quest: the one place the player's shape is made.
 * A question's correct choice and explanation are only ever sent once the
 * player has answered it, so the answers cannot be read ahead in the page.
 */
class QuestPlayState
{
    /**
     * Quests a player can see: open ones of their region, and closed ones
     * they played.
     *
     * @return Builder<Quest>
     */
    public static function visibleTo(User $user): Builder
    {
        return Quest::query()
            ->forRegion($user->regionId())
            ->where(fn (Builder $query) => $query->whereNull('created_by')->orWhere('created_by', '!=', $user->id))
            ->where(fn (Builder $query) => $query
                ->where('status', QuestStatus::Open)
                ->orWhere(fn (Builder $query) => $query
                    ->where('status', QuestStatus::Closed)
                    ->whereHas('attempts', fn (Builder $query) => $query->where('user_id', $user->id))));
    }

    /**
     * The player's quests as cards, open ones first.
     *
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public static function page(User $user, int $perPage = 12): LengthAwarePaginator
    {
        $badges = QuestBadges::load();

        return self::withPlayer(self::visibleTo($user), $user)
            ->orderByRaw('case when status = ? then 0 else 1 end', [QuestStatus::Open->value])
            ->orderByDesc('published_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Quest $quest): array => self::card($quest, $badges));
    }

    /**
     * The newest open quest for the HEI home's card, or null when none is
     * open.
     *
     * @return array<string, mixed>|null
     */
    public static function spotlight(User $user): ?array
    {
        if (! $user->playsQuests()) {
            return null;
        }

        $quest = self::withPlayer(self::visibleTo($user)->where('status', QuestStatus::Open), $user)
            ->orderByDesc('published_at')
            ->first();

        return $quest !== null ? self::card($quest, QuestBadges::load()) : null;
    }

    /**
     * A quest in a list: where the player stands with it. Load it through
     * withPlayer().
     *
     * @return array<string, mixed>
     */
    public static function card(Quest $quest, QuestBadges $badges): array
    {
        /** @var Collection<int, QuestAttempt> $attempts */
        $attempts = $quest->attempts;
        $total = (int) $quest->getAttribute('questions_count');

        return [
            'id' => $quest->id,
            'title' => $quest->title,
            'description' => $quest->description,
            'status' => $quest->status->value,
            'organizer' => $quest->organizer(),
            'questions' => $total,
            'allow_retakes' => $quest->allow_retakes,
            'progress' => match (true) {
                $attempts->contains(fn (QuestAttempt $attempt): bool => ! $attempt->isFinished()) => 'in_progress',
                $attempts->isNotEmpty() => 'finished',
                default => 'new',
            },
            'best' => self::best($attempts, $total, $quest, $badges),
        ];
    }

    /**
     * The play page: the quest, the attempt in view (the one under way, else
     * the latest finished) and what the player may do next.
     *
     * @return array<string, mixed>
     */
    public static function for(Quest $quest, User $user): array
    {
        $quest->loadMissing('region:id,name');
        $questions = $quest->questions()->with('choices')->get();
        $attempts = $quest->attempts()->where('user_id', $user->id)->withScore()->latest('started_at')->latest('id')->get();
        $current = $attempts->first(fn (QuestAttempt $attempt): bool => ! $attempt->isFinished()) ?? $attempts->first();
        $open = $quest->status === QuestStatus::Open;
        $unfinished = $current !== null && ! $current->isFinished();

        return [
            'quest' => [
                'id' => $quest->id,
                'title' => $quest->title,
                'description' => $quest->description,
                'status' => $quest->status->value,
                'organizer' => $quest->organizer(),
                'questions' => $questions->count(),
                'allow_retakes' => $quest->allow_retakes,
            ],
            'attempt' => $current !== null ? self::attempt($current, $questions) : null,
            'best' => self::best($attempts, $questions->count(), $quest, QuestBadges::load()),
            'can' => [
                'start' => $open && ! $unfinished && ($attempts->isEmpty() || $quest->allow_retakes),
                'answer' => $open && $unfinished,
            ],
        ];
    }

    /**
     * Loads what card() reads: the player's attempts with their scores, the
     * region and the number of questions.
     *
     * @param  Builder<Quest>  $query
     * @return Builder<Quest>
     */
    private static function withPlayer(Builder $query, User $user): Builder
    {
        return $query
            ->with([
                'region:id,name',
                'attempts' => fn ($query) => $query->where('user_id', $user->id)->withScore(),
            ])
            ->withCount('questions');
    }

    /**
     * The badge of the best finished attempt: its highest score, the earlier
     * one when tied.
     *
     * @param  Collection<int, QuestAttempt>  $attempts
     * @return array<string, mixed>|null
     */
    private static function best(Collection $attempts, int $total, Quest $quest, QuestBadges $badges): ?array
    {
        $best = $attempts
            ->filter(fn (QuestAttempt $attempt): bool => $attempt->isFinished())
            ->sortBy([['score', 'desc'], ['finished_at', 'asc']])
            ->first();

        return $best !== null ? self::badge($quest, (int) $best->score, $total, $best, $badges) : null;
    }

    /**
     * A badge as players and profiles show it, named and pictured as its
     * level's badge is in Settings → Badges.
     *
     * @return array<string, mixed>
     */
    public static function badge(Quest $quest, int $score, int $total, QuestAttempt $attempt, QuestBadges $badges): array
    {
        $level = QuestLevel::fromScore($score, $total);
        $badge = $badges->of($level);

        return [
            'quest_id' => $quest->id,
            'title' => $quest->title,
            'level' => $level->value,
            'level_label' => $badge->name,
            'meaning' => $badge->description,
            'image' => $badge->image,
            'score' => $score,
            'total' => $total,
            'earned_at' => $attempt->finished_at?->toIso8601ZuluString(),
            'organizer' => $quest->organizer(),
        ];
    }

    /**
     * An attempt's questions in its own shuffled order, which stays the same
     * on every visit: questions and choices are sorted by their key in the
     * attempt (`QuestAttempt::keyFor`), so nothing extra is stored. Choices
     * go by their key only, so their ids cannot hint at the author's order.
     *
     * @param  Collection<int, QuestQuestion>  $questions
     * @return array<string, mixed>
     */
    private static function attempt(QuestAttempt $attempt, Collection $questions): array
    {
        $answers = $attempt->answers()->get()->keyBy('quest_question_id');
        $key = $attempt->keyFor(...);

        return [
            'id' => $attempt->id,
            'finished' => $attempt->isFinished(),
            'score' => (int) $attempt->score,
            'level' => $attempt->isFinished() ? QuestLevel::fromScore((int) $attempt->score, $questions->count())->value : null,
            'started_at' => $attempt->started_at->toIso8601ZuluString(),
            'finished_at' => $attempt->finished_at?->toIso8601ZuluString(),
            'questions' => $questions
                ->sortBy(fn (QuestQuestion $question): string => $key($question->id))
                ->map(function (QuestQuestion $question) use ($answers, $key): array {
                    /** @var QuestAnswer|null $answer */
                    $answer = $answers->get($question->id);
                    $correct = $question->choices->first(fn (QuestChoice $choice): bool => $choice->is_correct);

                    return [
                        'id' => $question->id,
                        'prompt' => $question->prompt,
                        'choices' => $question->choices
                            ->map(fn (QuestChoice $choice): array => ['key' => $key($choice->id), 'label' => $choice->label])
                            ->sortBy('key')
                            ->values()
                            ->all(),
                        // Only once answered: the right choice and why.
                        'answer' => $answer !== null ? [
                            'choice' => $key($answer->quest_choice_id),
                            'correct' => $correct !== null ? $key($correct->id) : null,
                            'is_correct' => $answer->quest_choice_id === $correct?->id,
                            'explanation' => $question->explanation,
                        ] : null,
                    ];
                })
                ->values()
                ->all(),
        ];
    }
}
