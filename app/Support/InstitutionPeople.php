<?php

namespace App\Support;

use App\Http\Resources\InstitutionPersonResource;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * "People at your institution" beside the HEI home's feed, like Facebook's
 * Contacts: the viewer's colleagues on PHLGADIS, the institution's GAD Focal
 * Persons (whoever may submit its monitoring report) first, so a student or
 * staff member knows whom to ask. Two small queries, whatever the size of
 * the institution.
 */
class InstitutionPeople
{
    /** How many colleagues the card lists. */
    public const LIMIT = 6;

    /**
     * Active accounts at the viewer's institution, the viewer left out of
     * the list but counted in the total.
     *
     * @return array{people: array<int, array<string, mixed>>, total: int}
     */
    public static function for(User $viewer): array
    {
        if ($viewer->survey_hei_id === null) {
            return ['people' => [], 'total' => 0];
        }

        $institution = User::query()->active()->where('survey_hei_id', $viewer->survey_hei_id);
        $people = (clone $institution)
            ->whereKeyNot($viewer->getKey())
            ->withExists(['roles as is_focal' => fn (Builder $query) => $query
                ->whereHas('permissions', fn (Builder $query) => $query->where('slug', 'monitoring.submit'))])
            ->orderByDesc('is_focal')
            ->orderBy('name')
            ->limit(self::LIMIT)
            ->get(['id', 'name', 'avatar_path']);

        return [
            'people' => InstitutionPersonResource::collection($people)->resolve(),
            'total' => $institution->count(),
        ];
    }
}
