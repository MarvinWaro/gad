<?php

namespace App\Services;

use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Folds the portal's HEI list into the survey directory.
 *
 * The directory is not replaced by the portal: survey_responses.survey_hei_id
 * points at these rows with restrictOnDelete, so rows are only ever created,
 * updated, or deactivated — never removed.
 */
class PortalHeiSync
{
    /**
     * Portal province spellings that mean an existing cluster. Compared after
     * normalising case, punctuation, and the "province of" / "city of" prefix.
     *
     * @var array<string, string>
     */
    private const CLUSTER_ALIASES = [
        'cotabato' => 'Province of Cotabato',
        'north cotabato' => 'Province of Cotabato',
        'cotabato north' => 'Province of Cotabato',
        'south cotabato' => 'South Cotabato',
        'sarangani' => 'Sarangani',
        'saranggani' => 'Sarangani',
        'sultan kudarat' => 'Sultan Kudarat',
    ];

    private const UNASSIGNED_CLUSTER = SurveyCluster::UNASSIGNED;

    public function __construct(private readonly PortalService $portal) {}

    /**
     * @return array{
     *     created: int, updated: int, reactivated: int, deactivated: int,
     *     clusters_created: array<int, string>, skipped: int,
     *     total: int, last_fetched_at: ?string, stale: bool, error: ?string
     * }
     */
    public function sync(bool $force = true): array
    {
        $snapshot = $this->portal->heiSnapshot($force);

        // Never let a failed fetch mass-deactivate a working directory.
        if ($snapshot['stale']) {
            throw new RuntimeException($snapshot['error'] ?? 'The CHED portal could not be reached.');
        }

        $region = SurveyRegion::query()->firstOrCreate(
            ['name' => 'Regional Office XII'],
            ['is_active' => true],
        );

        $result = [
            'created' => 0, 'updated' => 0, 'reactivated' => 0, 'deactivated' => 0,
            'clusters_created' => [], 'skipped' => 0, 'total' => count($snapshot['data']),
        ];

        DB::transaction(function () use ($snapshot, $region, &$result): void {
            $clusters = SurveyCluster::query()
                ->where('survey_region_id', $region->id)
                ->get()
                ->keyBy(fn (SurveyCluster $cluster): string => $this->normalize($cluster->name));
            $seen = [];
            $now = now();

            foreach ($snapshot['data'] as $row) {
                $code = trim((string) ($row['instCode'] ?? ''));
                $name = trim((string) ($row['instName'] ?? ''));
                if ($code === '' || $name === '') {
                    $result['skipped']++;

                    continue;
                }

                $cluster = $this->resolveCluster($row['province'] ?? null, $region, $clusters, $result);
                $ownership = SurveyHei::normalizeOwnership($row['instOwnership'] ?? null);
                // Match on UII first; fall back to a hand-entered row of the
                // same name so an operator's entry is adopted, not duplicated.
                $hei = SurveyHei::query()->where('uii', $code)->first()
                    ?? SurveyHei::query()->whereNull('uii')
                        ->where('survey_cluster_id', $cluster->id)
                        ->where('name', $name)
                        ->first();

                if ($hei === null) {
                    // A name collision inside the target cluster would break the
                    // [survey_cluster_id, name] unique index.
                    $hei = SurveyHei::query()->create([
                        'survey_cluster_id' => $cluster->id,
                        'uii' => $code,
                        'name' => $this->uniqueName($name, $cluster->id, null),
                        'ownership' => $ownership,
                        'is_active' => true,
                        'portal_synced_at' => $now,
                    ]);
                    $result['created']++;
                    $seen[] = $hei->id;

                    continue;
                }

                $wasInactive = ! $hei->is_active;
                $changed = $hei->name !== $name
                    || $hei->survey_cluster_id !== $cluster->id
                    || $hei->uii !== $code
                    || $hei->ownership !== $ownership;

                $hei->forceFill([
                    'survey_cluster_id' => $cluster->id,
                    'uii' => $code,
                    'name' => $this->uniqueName($name, $cluster->id, $hei->id),
                    'ownership' => $ownership ?? $hei->ownership,
                    'is_active' => true,
                    'portal_synced_at' => $now,
                ])->save();

                $seen[] = $hei->id;
                if ($wasInactive) {
                    $result['reactivated']++;
                } elseif ($changed) {
                    $result['updated']++;
                }
            }

            // Anything the portal no longer lists is hidden, not deleted.
            $result['deactivated'] = SurveyHei::query()
                ->whereNotIn('id', $seen === [] ? [0] : $seen)
                ->where('is_active', true)
                ->update(['is_active' => false]);
        });

        return $result + [
            'last_fetched_at' => $snapshot['last_fetched_at'],
            'stale' => false,
            'error' => null,
        ];
    }

    /**
     * @param  Collection<string, SurveyCluster>  $clusters
     * @param  array<string, mixed>  $result
     */
    private function resolveCluster(
        ?string $province,
        SurveyRegion $region,
        Collection $clusters,
        array &$result,
    ): SurveyCluster {
        $label = trim((string) $province);
        $key = $this->normalize($label);

        if ($key !== '' && isset(self::CLUSTER_ALIASES[$key])) {
            $label = self::CLUSTER_ALIASES[$key];
            $key = $this->normalize($label);
        }
        if ($key === '') {
            $label = self::UNASSIGNED_CLUSTER;
            $key = $this->normalize($label);
        }
        if ($clusters->has($key)) {
            return $clusters->get($key);
        }

        $cluster = SurveyCluster::query()->firstOrCreate(
            ['survey_region_id' => $region->id, 'name' => $label],
            ['is_active' => true],
        );
        $clusters->put($key, $cluster);
        $result['clusters_created'][] = $label;

        return $cluster;
    }

    /**
     * Keep the [survey_cluster_id, name] unique index satisfiable when two
     * portal institutions share a name inside one province.
     */
    private function uniqueName(string $name, int $clusterId, ?int $ignoreId): string
    {
        $candidate = $name;
        $suffix = 2;

        while (
            SurveyHei::query()
                ->where('survey_cluster_id', $clusterId)
                ->where('name', $candidate)
                ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $candidate = "{$name} ({$suffix})";
            $suffix++;
        }

        return $candidate;
    }

    private function normalize(string $value): string
    {
        $value = Str::of($value)->lower()->replaceMatches('/[^a-z0-9 ]+/', ' ')->squish()->toString();

        return (string) preg_replace('/^(province|city) of /', '', $value);
    }
}
