<?php

namespace App\Actions\Monitoring;

use App\Enums\ChecklistType;
use App\Models\ChecklistResponse;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * Record which items of a GAD checklist the HEI checked for an academic
 * year. The HEI has one answer per checklist and year; submitting again
 * replaces it.
 */
class SubmitChecklist
{
    /** @param  list<string>  $items  keys from the checklist's items */
    public function handle(User $user, ChecklistType $type, string $academicYear, array $items): ChecklistResponse
    {
        Gate::forUser($user)->authorize('submit', ChecklistResponse::class);

        return DB::transaction(function () use ($user, $type, $academicYear, $items): ChecklistResponse {
            // Serialize submissions from colleagues at the same HEI.
            $hei = $user->hei()->with('cluster')->lockForUpdate()->firstOrFail();
            $response = ChecklistResponse::query()->firstOrNew([
                'survey_hei_id' => $hei->id,
                'type' => $type,
                'academic_year' => $academicYear,
            ]);

            if (! $response->exists) {
                $response->survey_cluster_id = $hei->survey_cluster_id;
                $response->survey_region_id = $hei->cluster->survey_region_id;
            }

            $response->fill(['submitted_by' => $user->id, 'submitted_at' => now()])->save();
            $response->answers()->delete();
            $response->answers()->createMany(array_map(
                fn (string $key): array => ['item_key' => $key],
                array_values(array_intersect(array_keys($type->items()), $items)),
            ));

            return $response;
        });
    }
}
