<?php

namespace App\Support;

use App\Models\GadEvent;
use App\Models\SurveyRegion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * The GAD events on the public website (docs/event-registration.md): those
 * staff left public, by region, with the ones on now first. One place for
 * the homepage, the Events page and a future public API.
 */
final class PublicEvents
{
    /** Events a page of the public list holds. */
    public const PER_PAGE = 12;

    /**
     * The regions a visitor can pick, as the public site offers them.
     *
     * @return Collection<int, SurveyRegion>
     */
    public static function regions(): Collection
    {
        return SurveyRegion::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']);
    }

    /** The region asked for, while it is one a visitor can pick; otherwise every region. */
    public static function region(?int $regionId): ?int
    {
        if ($regionId === null || $regionId <= 0) {
            return null;
        }

        return SurveyRegion::query()->whereKey($regionId)->where('is_active', true)->exists() ? $regionId : null;
    }

    /**
     * A page of the list: events on now and coming up, those on now first, or
     * past ones, the latest first.
     *
     * @return LengthAwarePaginator<int, GadEvent>
     */
    public static function page(?int $regionId, bool $past): LengthAwarePaginator
    {
        $now = GadEvent::localNow();

        return self::listed($regionId)
            ->when(
                $past,
                fn (Builder $query) => $query->inStatus('ended', $now)->orderByDesc('starts_at'),
                fn (Builder $query) => $query->notEndedAt($now)->orderBy('starts_at'),
            )
            ->orderBy('id')
            ->paginate(self::PER_PAGE)
            ->withQueryString();
    }

    /**
     * The next few events still on, those on now first: the homepage's
     * strip, which leaves out cancelled ones. The list shows them, marked.
     *
     * @return Collection<int, GadEvent>
     */
    public static function upcoming(?int $regionId, int $limit = 3): Collection
    {
        return self::listed($regionId)
            ->notEndedAt(GadEvent::localNow())
            ->whereNull('cancelled_at')
            ->orderBy('starts_at')
            ->orderBy('id')
            ->limit($limit)
            ->get();
    }

    /** @return Builder<GadEvent> */
    private static function listed(?int $regionId): Builder
    {
        return GadEvent::query()
            ->onPublicSite()
            ->forRegion($regionId)
            ->with('region:id,name');
    }
}
