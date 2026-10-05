<?php

namespace App\Support;

use App\Enums\QuestLevel;
use App\Models\Quest;
use App\Models\QuestAttempt;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use stdClass;

/**
 * Who played a quest and how they did, for its staff. Each player counts
 * once, by their best finished attempt. Counted in SQL, filtered by the
 * region and HEI the players played from.
 *
 * @phpstan-type Participant array{user_id: int, name: string, place: string, best: int|null, level: string|null, level_label: string|null, attempts: int, last_played: string|null}
 */
class QuestResults
{
    public const PER_PAGE = 20;

    /**
     * @param  array<string, mixed>  $filters  `region` and `hei`, as PlaceFilters reads them.
     * @return array{summary: array<string, mixed>, participants: LengthAwarePaginator<int, Participant>}
     */
    public static function for(Quest $quest, array $filters): array
    {
        $total = $quest->questions()->count();
        $attempts = QuestAttempt::query()->where('quest_id', $quest->id)->withScore();
        PlaceFilters::apply($attempts, $filters);

        // Each player's best finished score.
        $best = DB::query()
            ->fromSub((clone $attempts)->whereNotNull('finished_at'), 'attempts')
            ->groupBy('user_id')
            ->select('user_id')
            ->selectRaw('max(score) as best');

        $finished = DB::query()
            ->fromSub($best, 'best')
            ->selectRaw('count(*) as completed, coalesce(sum(case when best >= ? then 1 else 0 end), 0) as perfect, avg(best) as average', [$total])
            ->first();

        $bySex = DB::query()
            ->fromSub($best, 'best')
            ->join('users', 'users.id', '=', 'best.user_id')
            ->groupBy('users.sex')
            ->selectRaw('users.sex, count(*) as players')
            ->pluck('players', 'sex');

        $completed = (int) ($finished->completed ?? 0);

        return [
            'summary' => [
                'questions' => $total,
                'players' => (clone $attempts)->distinct()->count('user_id'),
                'completed' => $completed,
                'perfect' => (int) ($finished->perfect ?? 0),
                // The average share of questions answered correctly, 0–100.
                'average' => $completed > 0 && $total > 0 ? (int) round((float) $finished->average / $total * 100) : null,
                'by_sex' => [
                    'female' => (int) ($bySex['female'] ?? 0),
                    'male' => (int) ($bySex['male'] ?? 0),
                    'not_stated' => $completed - (int) ($bySex['female'] ?? 0) - (int) ($bySex['male'] ?? 0),
                ],
            ],
            'participants' => self::participants($attempts, $total),
        ];
    }

    /**
     * One row per player, best first: their best finished score, how many
     * times they played, and where they played from.
     *
     * @param  Builder<QuestAttempt>  $attempts
     * @return LengthAwarePaginator<int, Participant>
     */
    private static function participants(Builder $attempts, int $total): LengthAwarePaginator
    {
        $page = DB::query()
            ->fromSub($attempts, 'attempts')
            ->join('users', 'users.id', '=', 'attempts.user_id')
            ->groupBy('attempts.user_id', 'users.name')
            ->select('attempts.user_id', 'users.name')
            ->selectRaw('max(case when attempts.finished_at is not null then attempts.score end) as best')
            ->selectRaw('count(*) as attempts')
            ->selectRaw('max(attempts.started_at) as last_played')
            ->selectRaw('max(attempts.survey_hei_id) as hei_id')
            ->selectRaw('max(attempts.survey_region_id) as region_id')
            ->orderByRaw('best is null')
            ->orderByDesc('best')
            ->orderBy('users.name')
            ->paginate(self::PER_PAGE, pageName: 'page')
            ->withQueryString();

        $rows = collect($page->items());
        $heis = SurveyHei::query()->whereKey($rows->pluck('hei_id')->filter()->unique())->pluck('name', 'id');
        $regions = SurveyRegion::query()->whereKey($rows->pluck('region_id')->filter()->unique())->pluck('name', 'id');

        return $page->through(function (stdClass $row) use ($heis, $regions, $total): array {
            $best = $row->best !== null ? (int) $row->best : null;
            $level = $best !== null ? QuestLevel::fromScore($best, $total) : null;

            return [
                'user_id' => (int) $row->user_id,
                'name' => (string) $row->name,
                'place' => match (true) {
                    isset($heis[$row->hei_id]) => InstitutionName::display($heis[$row->hei_id]),
                    isset($regions[$row->region_id]) => (string) $regions[$row->region_id],
                    default => 'CHED Central Office',
                },
                'best' => $best,
                'level' => $level?->value,
                'level_label' => $level?->label(),
                'attempts' => (int) $row->attempts,
                'last_played' => self::iso($row->last_played),
            ];
        });
    }

    private static function iso(mixed $value): ?string
    {
        return $value !== null ? CarbonImmutable::parse((string) $value, 'UTC')->toIso8601ZuluString() : null;
    }
}
