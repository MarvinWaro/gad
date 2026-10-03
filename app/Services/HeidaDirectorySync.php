<?php

namespace App\Services;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

/**
 * Copies HEIDA's regions and HEIs into the directory (survey_regions →
 * survey_clusters → survey_heis), which registration, the surveys, website
 * feedback and every filter read. Pages never call HEIDA themselves: this runs
 * once a night (`surveys:sync-heis`), so signing up survives a HEIDA outage
 * and HEIDA is not flooded. Rules and reasons: docs/heida-sync.md.
 *
 * Rows are only created, updated or deactivated, never deleted: accounts,
 * responses and posts point at them.
 *
 * @phpstan-import-type HeidaPlace from HeidaClient
 * @phpstan-import-type HeidaHei from HeidaClient
 *
 * @phpstan-type SyncResult array{
 *     regions_created: list<string>, clusters_created: list<string>,
 *     created: int, updated: int, reactivated: int, deactivated: int,
 *     skipped: int, total: int, calls: int
 * }
 */
class HeidaDirectorySync
{
    /** HEIDA's institution types run by the government; the rest are private, except "OT" (other). */
    private const PUBLIC_TYPES = ['CSCU-MAIN', 'CSCU-SAT', 'CSI', 'LGCU'];

    private const PRIVATE_TYPES = ['PSS', 'PSN', 'PNS', 'PNN', 'PSF', 'PNF', 'PNSNPC'];

    /** @var array<string, SurveyCluster> by "{region id}|{code}" */
    private array $clustersByCode = [];

    /** @var array<string, SurveyCluster> by "{region id}|{normalised name}" */
    private array $clustersByName = [];

    /** @var array<string, int> HEI id by "{cluster id}|{lower-case name}", for the unique index */
    private array $names = [];

    public function __construct(
        private readonly HeidaClient $heida,
        private readonly ActivityRecorder $activity,
    ) {}

    /**
     * Fetch everything first, then write it in one transaction, so a failed
     * fetch changes nothing. A dry run makes the same changes and rolls them
     * back, to show what a real run would do.
     *
     * @return SyncResult
     */
    public function sync(bool $dryRun = false): array
    {
        $lock = Cache::lock('heida:sync', 600);
        if (! $lock->get()) {
            throw new RuntimeException('Another HEI sync is running. Try again in a few minutes.');
        }

        try {
            $directory = $this->heida->directory();

            DB::beginTransaction();
            try {
                $result = $this->apply($directory['regions'], $directory['heis']);
            } catch (Throwable $exception) {
                DB::rollBack();

                throw $exception;
            }
            $dryRun ? DB::rollBack() : DB::commit();
        } finally {
            $lock->release();
        }

        $result['calls'] = $directory['calls'];

        if (! $dryRun) {
            $this->activity->record(
                ActivityAction::Synced,
                ActivityModule::Heis,
                properties: Arr::except($result, ['regions_created', 'clusters_created']) + [
                    'regions_created' => count($result['regions_created']),
                    'clusters_created' => count($result['clusters_created']),
                ],
                label: __('HEIs from HEIDA'),
            );
        }

        return $result;
    }

    /**
     * @param  list<HeidaPlace>  $heidaRegions
     * @param  list<HeidaHei>  $heidaHeis
     * @return SyncResult
     */
    private function apply(array $heidaRegions, array $heidaHeis): array
    {
        $result = [
            'regions_created' => [], 'clusters_created' => [],
            'created' => 0, 'updated' => 0, 'reactivated' => 0, 'deactivated' => 0,
            'skipped' => 0, 'total' => count($heidaHeis), 'calls' => 0,
        ];
        $now = now();
        $regions = $this->syncRegions($heidaRegions, $result);
        $this->indexClusters();

        $heis = SurveyHei::query()->with('cluster:id,survey_region_id')->get();
        $byUii = $heis->filter(fn (SurveyHei $hei): bool => $hei->uii !== null)
            ->keyBy(fn (SurveyHei $hei): string => Str::lower((string) $hei->uii));
        // Hand-entered institutions, adopted by name so they are not duplicated.
        $unnumbered = $heis->filter(fn (SurveyHei $hei): bool => $hei->uii === null)
            ->keyBy(fn (SurveyHei $hei): string => $hei->cluster->survey_region_id.'|'.Str::lower($hei->name));
        $this->names = $heis->mapWithKeys(fn (SurveyHei $hei): array => [
            $hei->survey_cluster_id.'|'.Str::lower($hei->name) => $hei->id,
        ])->all();
        $seen = [];

        // HEIs with a province first, so one without can then be placed
        // beside its region's others (SurveyCluster::defaultIdFor).
        $heidaHeis = [
            ...array_filter($heidaHeis, fn (array $row): bool => $row['province'] !== null),
            ...array_filter($heidaHeis, fn (array $row): bool => $row['province'] === null),
        ];

        foreach ($heidaHeis as $row) {
            if ($row['code'] === '' || $row['name'] === '') {
                $result['skipped']++;

                continue;
            }

            $heidaRegion = $row['region'] === null ? null : $regions->get($row['region']['code']);
            $hei = $byUii->get(Str::lower($row['code']))
                ?? ($heidaRegion === null ? null : $unnumbered->pull($heidaRegion->id.'|'.Str::lower($row['name'])));
            // An HEI already on the list keeps its region: a regional office
            // may cover schools HEIDA files elsewhere by location.
            $regionId = $hei?->cluster->survey_region_id ?? $heidaRegion?->id;

            // Nowhere to file it, or a code HEIDA already sent once.
            if ($regionId === null || ($hei !== null && isset($seen[$hei->id]))) {
                $result['skipped']++;

                continue;
            }

            $clusterId = $this->clusterFor($regionId, $row['province'], $hei, $result);
            $active = $row['status'] === 'active';
            $ownership = $this->ownership($row['hei_type']);

            if ($hei === null) {
                $hei = SurveyHei::query()->create([
                    'survey_cluster_id' => $clusterId,
                    'uii' => $row['code'],
                    'name' => $this->claimName($row['name'], $clusterId, null),
                    'ownership' => $ownership,
                    'is_active' => $active,
                ]);
                $this->names[$clusterId.'|'.Str::lower($hei->name)] = $hei->id;
                $byUii->put(Str::lower($row['code']), $hei);
                $result['created']++;
                $seen[$hei->id] = true;

                continue;
            }

            $wasActive = $hei->is_active;
            unset($this->names[$hei->survey_cluster_id.'|'.Str::lower($hei->name)]);
            $hei->forceFill([
                'survey_cluster_id' => $clusterId,
                'uii' => $row['code'],
                'name' => $this->claimName($row['name'], $clusterId, $hei->id),
                'ownership' => $ownership ?? $hei->ownership,
                'is_active' => $active,
            ]);
            $this->names[$clusterId.'|'.Str::lower($hei->name)] = $hei->id;

            $changed = $hei->isDirty(['survey_cluster_id', 'uii', 'name', 'ownership']);
            $hei->save();
            $seen[$hei->id] = true;

            if (! $wasActive && $active) {
                $result['reactivated']++;
            } elseif ($wasActive && ! $active) {
                $result['deactivated']++;
            } elseif ($changed) {
                $result['updated']++;
            }
        }

        foreach (array_chunk(array_keys($seen), 500) as $ids) {
            SurveyHei::query()->whereKey($ids)->toBase()->update(['portal_synced_at' => $now]);
        }

        // An HEI an earlier sync brought in that HEIDA no longer lists leaves
        // the pickers. Seeded and hand-entered ones HEIDA lacks are left be.
        $dropped = $heis
            ->filter(fn (SurveyHei $hei): bool => $hei->portal_synced_at !== null && $hei->is_active && ! isset($seen[$hei->id]))
            ->modelKeys();
        foreach (array_chunk($dropped, 500) as $ids) {
            $result['deactivated'] += SurveyHei::query()->whereKey($ids)->update(['is_active' => false]);
        }

        return $result;
    }

    /**
     * Match HEIDA's regions to ours by PSGC code. A region we lack, such as
     * BARMM, which has no CHED regional office, is added under HEIDA's name;
     * our office names are never changed.
     *
     * @param  list<HeidaPlace>  $heidaRegions
     * @param  SyncResult  $result
     * @return Collection<string, SurveyRegion>
     */
    private function syncRegions(array $heidaRegions, array &$result): Collection
    {
        $regions = SurveyRegion::query()->whereNotNull('code')->get()->keyBy('code');

        foreach ($heidaRegions as $heidaRegion) {
            if ($regions->has($heidaRegion['code'])) {
                continue;
            }

            $region = SurveyRegion::query()->whereNull('code')->where('name', $heidaRegion['name'])->first();
            if ($region !== null) {
                $region->update(['code' => $heidaRegion['code']]);
            } else {
                $region = SurveyRegion::query()->create([
                    'code' => $heidaRegion['code'],
                    'name' => $heidaRegion['name'],
                    'is_active' => true,
                ]);
                $result['regions_created'][] = $region->name;
            }
            $regions->put($heidaRegion['code'], $region);
        }

        return $regions;
    }

    private function indexClusters(): void
    {
        $this->clustersByCode = [];
        $this->clustersByName = [];

        foreach (SurveyCluster::query()->get() as $cluster) {
            $this->remember($cluster);
        }
    }

    /**
     * The cluster for an HEI: its province within the region it is filed
     * under, even when that is not HEIDA's region (the Cotabato City schools
     * stay with Regional Office XII under "Maguindanao del Norte"). Matched by
     * code, then by name, adopting the code; otherwise added. Names are never
     * changed, so an office may rename its clusters.
     *
     * With no province from HEIDA, an HEI keeps the cluster it is in, and a
     * new one goes beside its region's others when they share one cluster,
     * else to the holding cluster.
     *
     * @param  HeidaPlace|null  $place
     * @param  SyncResult  $result
     */
    private function clusterFor(int $regionId, ?array $place, ?SurveyHei $hei, array &$result): int
    {
        if ($place === null) {
            return $hei->survey_cluster_id
                ?? SurveyCluster::defaultIdFor($regionId)
                ?? SurveyCluster::holdingFor($regionId)->id;
        }

        $cluster = $this->clustersByCode[$regionId.'|'.$place['code']]
            ?? $this->clustersByName[$regionId.'|'.$this->normalize($place['name'])]
            ?? null;

        if ($cluster === null) {
            $cluster = SurveyCluster::query()->create([
                'survey_region_id' => $regionId,
                'code' => $place['code'],
                'name' => $place['name'],
                'is_active' => true,
            ]);
            $result['clusters_created'][] = $cluster->name;
        } elseif ($cluster->code === null) {
            $cluster->update(['code' => $place['code']]);
        }
        $this->remember($cluster);

        return $cluster->id;
    }

    private function remember(SurveyCluster $cluster): void
    {
        if ($cluster->code !== null) {
            $this->clustersByCode[$cluster->survey_region_id.'|'.$cluster->code] = $cluster;
        }
        $this->clustersByName[$cluster->survey_region_id.'|'.$this->normalize($cluster->name)] = $cluster;
    }

    /**
     * Keep the [survey_cluster_id, name] unique index satisfiable when two
     * institutions share a name inside one cluster.
     */
    private function claimName(string $name, int $clusterId, ?int $heiId): string
    {
        $candidate = $name;
        $suffix = 2;

        while (($holder = $this->names[$clusterId.'|'.Str::lower($candidate)] ?? null) !== null && $holder !== $heiId) {
            $candidate = "{$name} ({$suffix})";
            $suffix++;
        }

        return $candidate;
    }

    private function ownership(?string $heiType): ?string
    {
        return match (true) {
            in_array($heiType, self::PUBLIC_TYPES, true) => 'public',
            in_array($heiType, self::PRIVATE_TYPES, true) => 'private',
            default => null,
        };
    }

    /** "Province of Cotabato" and "Cotabato" are the same place. */
    private function normalize(string $value): string
    {
        $value = Str::of($value)->lower()->replaceMatches('/[^a-z0-9 ]+/', ' ')->squish()->toString();

        return (string) preg_replace('/^(province|city) of /', '', $value);
    }
}
