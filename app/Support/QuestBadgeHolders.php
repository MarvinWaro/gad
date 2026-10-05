<?php

namespace App\Support;

use App\Enums\QuestLevel;
use App\Models\Badge;
use App\Models\Quest;
use App\Models\QuestAttempt;
use App\Models\QuestQuestion;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * Who holds each GAD Quest level's badge, for Settings → Badges: everyone
 * whose best finished attempt at a quest reached that level, one badge per
 * quest as on their profile. Counted in SQL (docs/badges.md).
 */
final class QuestBadgeHolders
{
    /**
     * Sets `holders_count` on the GAD Quest levels among the badges: the
     * people holding that level for at least one quest.
     *
     * @param  Collection<int, Badge>  $badges
     */
    public static function countInto(Collection $badges): void
    {
        $levels = $badges->filter(fn (Badge $badge): bool => $badge->quest_level !== null);

        if ($levels->isEmpty()) {
            return;
        }

        $people = DB::query()
            ->fromSub(self::levels(), 'levels')
            ->groupBy('level')
            ->selectRaw('level, count(distinct user_id) as people')
            ->pluck('people', 'level');

        $levels->each(fn (Badge $badge) => $badge->setAttribute(
            'holders_count',
            (int) ($people[$badge->quest_level?->value] ?? 0),
        ));
    }

    /**
     * The people holding a level, most recently earned first, each with the
     * quests they hold it for. A regional office sees its own region's
     * people; a search matches names.
     *
     * @return LengthAwarePaginator<int, array{user: User, quests: list<string>, earned_at: string}>
     */
    public static function page(QuestLevel $level, User $viewer, string $search, int $perPage = 20): LengthAwarePaginator
    {
        $held = DB::query()->fromSub(self::levels(), 'levels')->where('level', $level->value);

        if (! $viewer->national_access || $search !== '') {
            $held->whereIn('user_id', User::query()
                ->when(! $viewer->national_access, fn (EloquentBuilder $query) => $query->placedIn($viewer->survey_region_id))
                ->when($search !== '', fn (EloquentBuilder $query) => $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'))
                ->select('id'));
        }

        $page = (clone $held)
            ->groupBy('user_id')
            ->select('user_id')
            ->selectRaw('max(earned_at) as earned_at')
            ->orderByDesc('earned_at')
            ->orderBy('user_id')
            ->paginate($perPage)
            ->withQueryString();

        $ids = collect($page->items())->pluck('user_id');
        $users = User::query()->whereKey($ids)->with(['hei:id,name', 'officeRegion:id,name'])->get()->keyBy('id');
        $badges = (clone $held)->whereIn('user_id', $ids)->orderByDesc('earned_at')->get(['user_id', 'quest_id']);
        $titles = Quest::query()->whereKey($badges->pluck('quest_id')->unique())->pluck('title', 'id');

        return $page->through(fn (stdClass $row): array => [
            'user' => $users[$row->user_id],
            'quests' => $badges->where('user_id', $row->user_id)
                ->map(fn (stdClass $badge): string => (string) $titles[$badge->quest_id])
                ->values()
                ->all(),
            'earned_at' => CarbonImmutable::parse((string) $row->earned_at, 'UTC')->toIso8601ZuluString(),
        ]);
    }

    /**
     * Each person's level at each quest they finished: from their best
     * score, which they first reached on `earned_at`, as their profile
     * badge counts it (QuestPlayState).
     */
    private static function levels(): Builder
    {
        $scored = QuestAttempt::query()->finished()->withScore();
        $best = DB::query()
            ->fromSub($scored, 'attempts')
            ->groupBy('user_id', 'quest_id')
            ->select('user_id', 'quest_id')
            ->selectRaw('max(score) as best');
        $totals = QuestQuestion::query()
            ->groupBy('quest_id')
            ->select('quest_id')
            ->selectRaw('count(*) as total');

        return DB::query()
            ->fromSub($scored, 'attempts')
            ->joinSub($best, 'best', fn (JoinClause $join) => $join
                ->on('best.user_id', '=', 'attempts.user_id')
                ->on('best.quest_id', '=', 'attempts.quest_id')
                ->on('best.best', '=', 'attempts.score'))
            ->joinSub($totals, 'totals', 'totals.quest_id', '=', 'attempts.quest_id')
            ->groupBy('attempts.user_id', 'attempts.quest_id', 'best.best', 'totals.total')
            ->select('attempts.user_id', 'attempts.quest_id')
            ->selectRaw('min(attempts.finished_at) as earned_at')
            ->selectRaw(QuestLevel::sql('best.best', 'totals.total').' as level');
    }
}
