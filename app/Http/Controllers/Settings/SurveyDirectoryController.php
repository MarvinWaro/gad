<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\HeiFilterRequest;
use App\Models\Post;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\PortalHeiSync;
use App\Support\CountPhrase;
use App\Support\InstitutionName;
use App\Support\PlaceFilters;
use App\Support\RespondentFollowUps;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SurveyDirectoryController extends Controller
{
    /** Field names as they are labelled in the UI, so errors read naturally. */
    private const ATTRIBUTE_NAMES = [
        'uii' => 'UII',
        'survey_cluster_id' => 'cluster',
        'survey_region_id' => 'region',
    ];

    public function regions(Request $request): Response
    {
        return Inertia::render('settings/regions', [
            'regions' => SurveyRegion::query()->withCount('clusters')->orderBy('name')->get(),
            'permissions' => $this->permissions($request),
        ]);
    }

    public function clusters(Request $request): Response
    {
        return Inertia::render('settings/clusters', [
            'regions' => SurveyRegion::query()->orderBy('name')->get(['id', 'name']),
            'clusters' => SurveyCluster::query()->with('region:id,name')->withCount('heis')->orderBy('name')->get(),
            'permissions' => $this->permissions($request),
        ]);
    }

    public function heis(HeiFilterRequest $request): Response
    {
        $filters = $request->validated();
        $search = trim((string) ($filters['search'] ?? ''));
        $regionId = isset($filters['region']) ? (int) $filters['region'] : null;

        return Inertia::render('settings/heis', [
            'regions' => SurveyRegion::query()->orderBy('name')->get(['id', 'name']),
            'clusters' => SurveyCluster::query()->with('region:id,name')->orderBy('name')->get(),
            // The directory runs to thousands of institutions nationally, so
            // it is filtered and paged rather than rendered whole.
            'heis' => SurveyHei::query()->with('cluster:id,name,survey_region_id', 'cluster.region:id,name')
                ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('uii', 'like', "%{$search}%")))
                ->when($regionId, fn ($query) => $query->whereHas('cluster', fn ($query) => $query->where('survey_region_id', $regionId)))
                ->when($filters['cluster'] ?? null, fn ($query, $cluster) => $query->where('survey_cluster_id', $cluster))
                ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('is_active', $status === 'active'))
                ->when($filters['ownership'] ?? null, fn ($query, $ownership) => $ownership === 'none'
                    ? $query->whereNull('ownership')
                    : $query->where('ownership', $ownership))
                ->orderBy('name')
                ->paginate(10, ['id', 'survey_cluster_id', 'uii', 'name', 'ownership', 'is_active', 'portal_synced_at'])
                ->withQueryString(),
            'filters' => [
                'search' => $search,
                'region' => (string) ($filters['region'] ?? ''),
                'cluster' => (string) ($filters['cluster'] ?? ''),
                'status' => (string) ($filters['status'] ?? ''),
                'ownership' => (string) ($filters['ownership'] ?? ''),
            ],
            // Offered only when the region's institutions sit in two or more
            // clusters; until then (all "Unassigned", say) a region goes
            // straight to its institutions.
            'clusterOptions' => $regionId === null ? [] : PlaceFilters::clusterChoices($regionId),
            // Only there does the HEI form ask for a cluster; elsewhere a new
            // institution waits in its region's holding cluster.
            'clusterRegions' => PlaceFilters::regionsWithClusterChoices(),
            'permissions' => $this->permissions($request),
        ]);
    }

    /** @return array<string, bool> */
    private function permissions(Request $request): array
    {
        return [
            'create' => $request->user()->can('survey-directories.create'),
            'update' => $request->user()->can('survey-directories.update'),
            'delete' => $request->user()->can('survey-directories.delete'),
        ];
    }

    public function respondentGroups(Request $request): Response
    {
        return Inertia::render('settings/respondent-groups', [
            'respondentGroups' => SurveyRespondentGroup::query()
                ->ordered()
                ->with('followUpQuestions.activeOptions')
                ->get()
                ->map(fn (SurveyRespondentGroup $group): array => [
                    'id' => $group->id,
                    'value' => $group->value,
                    'label' => $group->label,
                    'requires_text' => $group->requires_text,
                    'is_active' => $group->is_active,
                    'sort_order' => $group->sort_order,
                    'follow_ups' => $group->followUps(),
                ]),
            'permissions' => [
                'create' => $request->user()->can('survey-directories.create'),
                'update' => $request->user()->can('survey-directories.update'),
                'delete' => $request->user()->can('survey-directories.delete'),
            ],
        ]);
    }

    /**
     * Pull the HEI list from the CHED portal. No page links to this yet — the
     * panel is withdrawn until the portal's API base URL is confirmed — but the
     * endpoint and `php artisan surveys:sync-heis` both still work.
     */
    public function sync(PortalHeiSync $sync): RedirectResponse
    {
        try {
            $result = $sync->sync();
        } catch (\Throwable $exception) {
            return back()->withErrors(['portal' => $exception->getMessage()]);
        }

        $summary = collect([
            $result['created'] ? "{$result['created']} added" : null,
            $result['updated'] ? "{$result['updated']} updated" : null,
            $result['reactivated'] ? "{$result['reactivated']} restored" : null,
            $result['deactivated'] ? "{$result['deactivated']} deactivated" : null,
        ])->filter()->implode(', ');

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Synced :total institutions from the CHED portal:notes.', [
                'total' => $result['total'],
                'notes' => $summary === '' ? ' (no changes)' : " ({$summary})",
            ]),
        ]);

        if ($result['clusters_created'] !== []) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('New clusters created from portal provinces: :names', [
                    'names' => implode(', ', $result['clusters_created']),
                ]),
            ]);
        }

        return back();
    }

    public function store(Request $request, string $type, ActivityRecorder $activity): RedirectResponse
    {
        $model = $this->modelFor($type);
        if ($type === 'respondent-groups') {
            return $this->storeRespondentGroup($request, $activity);
        }
        if ($type === 'heis') {
            return $this->saveHei($request, null, $activity);
        }
        $parent = $type === 'clusters' ? 'survey_region_id' : null;
        $table = $model->getTable();
        $rules = ['name' => ['required', 'string', 'max:180', Rule::unique($table)->where(fn ($query) => $parent ? $query->where($parent, $request->input($parent)) : $query)]];
        if ($parent !== null) {
            $rules[$parent] = ['required', 'integer', Rule::exists('survey_regions', 'id')];
        }
        $validated = $request->validate($rules, [], self::ATTRIBUTE_NAMES);
        $record = $model->newQuery()->create([...$validated, 'is_active' => true]);
        $activity->recordSave($this->moduleFor($type), $record);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name added.', ['name' => $validated['name']]),
        ]);

        return back();
    }

    /**
     * A group's `value` is what every collected response stores, so it is set
     * once when the group is created and never edited afterwards. The label is
     * free to change without touching the answers already gathered.
     */
    private function storeRespondentGroup(Request $request, ActivityRecorder $activity): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:120', Rule::unique('survey_respondent_groups', 'label')],
            'requires_text' => ['sometimes', 'boolean'],
        ], [], ['label' => 'name']);

        $value = Str::slug($validated['label']) ?: 'group';
        $candidate = $value;
        $suffix = 2;
        while (SurveyRespondentGroup::query()->where('value', $candidate)->exists()) {
            $candidate = $value.'-'.$suffix;
            $suffix++;
        }

        $group = SurveyRespondentGroup::query()->create([
            'value' => $candidate,
            'label' => $validated['label'],
            'requires_text' => (bool) ($validated['requires_text'] ?? false),
            'is_active' => true,
            'sort_order' => (int) SurveyRespondentGroup::query()->max('sort_order') + 1,
        ]);
        $activity->recordSave(ActivityModule::RespondentGroups, $group);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name added.', ['name' => $validated['label']]),
        ]);

        return back();
    }

    /**
     * Save the questions a respondent group asks right after it is picked.
     * Each question keeps its answer key and each choice its value, so the
     * answers already collected keep their meaning.
     */
    public function updateFollowUps(Request $request, SurveyRespondentGroup $group, ActivityRecorder $activity): RedirectResponse
    {
        $validated = $request->validate(
            RespondentFollowUps::definitionRules(),
            [],
            RespondentFollowUps::definitionAttributes(),
        );

        RespondentFollowUps::sync($group, $validated['follow_ups']);
        $activity->record(ActivityAction::Updated, ActivityModule::RespondentGroups, $group, properties: [
            'follow_up_questions' => count($validated['follow_ups']),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Follow-up questions for :name saved.', ['name' => $group->label]),
        ]);

        return back();
    }

    public function update(Request $request, string $type, int $id, ActivityRecorder $activity): RedirectResponse
    {
        $record = $this->modelFor($type)->newQuery()->findOrFail($id);
        if ($type === 'respondent-groups') {
            $record->update($request->validate([
                'label' => ['required', 'string', 'max:120', Rule::unique('survey_respondent_groups', 'label')->ignore($record->getKey())],
                'requires_text' => ['required', 'boolean'],
                'is_active' => ['required', 'boolean'],
                'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
            ], [], ['label' => 'name']));
            $activity->recordSave(ActivityModule::RespondentGroups, $record);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __(':name updated.', ['name' => $record->getAttribute('label')]),
            ]);

            return back();
        }
        if ($record instanceof SurveyHei) {
            return $this->saveHei($request, $record, $activity);
        }
        $record->update($request->validate([
            'name' => ['required', 'string', 'max:180'],
            'is_active' => ['required', 'boolean'],
        ], [], self::ATTRIBUTE_NAMES));
        $activity->recordSave($this->moduleFor($type), $record);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name updated.', ['name' => $record->getAttribute('name')]),
        ]);

        return back();
    }

    /**
     * Add or edit an institution. It is placed by its region; the cluster is
     * optional. Until a region's institutions are grouped (clusters only when
     * used), they wait in the region's holding cluster, which is never shown
     * as a place. A cluster given on its own still places the institution in
     * that cluster's region. The UII is CHED's institution key, so it is
     * unique across the whole directory rather than per cluster.
     */
    private function saveHei(Request $request, ?SurveyHei $hei, ActivityRecorder $activity): RedirectResponse
    {
        $cluster = Rule::exists('survey_clusters', 'id');
        if ($request->filled('survey_region_id')) {
            $cluster = $cluster->where('survey_region_id', $request->integer('survey_region_id'));
        }
        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:180',
                Rule::unique('survey_heis')
                    ->where(fn ($query) => $query->where('survey_cluster_id', $this->heiClusterId($request)))
                    ->ignore($hei?->getKey()),
            ],
            'survey_region_id' => ['required_without:survey_cluster_id', 'nullable', 'integer', Rule::exists('survey_regions', 'id')],
            'survey_cluster_id' => ['nullable', 'integer', $cluster],
            'uii' => [
                'nullable', 'string', 'max:40', 'regex:/^[A-Za-z0-9-]+$/',
                Rule::unique('survey_heis', 'uii')->ignore($hei?->getKey()),
            ],
            'ownership' => ['nullable', Rule::in(SurveyHei::OWNERSHIPS)],
            'is_active' => [$hei === null ? 'exclude' : 'required', 'boolean'],
        ], [], self::ATTRIBUTE_NAMES);
        $attributes = [
            ...Arr::except($validated, ['survey_region_id']),
            'survey_cluster_id' => $validated['survey_cluster_id']
                ?? SurveyCluster::defaultIdFor((int) $validated['survey_region_id'])
                ?? SurveyCluster::holdingFor((int) $validated['survey_region_id'])->id,
        ];

        if ($hei === null) {
            $hei = SurveyHei::query()->create([...$attributes, 'is_active' => true]);
        } else {
            $hei->update($attributes);
        }
        $activity->recordSave(ActivityModule::Heis, $hei);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __($hei->wasRecentlyCreated ? ':name added.' : ':name updated.', ['name' => $hei->name]),
        ]);

        return back();
    }

    /**
     * The cluster a submitted institution would sit in, for the per-cluster
     * name check: the chosen one, or where one without a cluster goes.
     */
    private function heiClusterId(Request $request): ?int
    {
        return $request->filled('survey_cluster_id')
            ? $request->integer('survey_cluster_id')
            : SurveyCluster::defaultIdFor($request->integer('survey_region_id'));
    }

    public function destroy(string $type, int $id, ActivityRecorder $activity): RedirectResponse
    {
        $record = $this->modelFor($type)->newQuery()->findOrFail($id);
        if ($record instanceof SurveyRespondentGroup
            && SurveyResponse::query()->where('respondent_group', $record->value)->exists()) {
            return $this->refuse(__('Responses were collected under this group. Deactivate it instead.'));
        }

        // Deleting an institution would unlink its accounts and make its posts
        // look like CHED's, so one with any records can only be deactivated.
        if ($record instanceof SurveyHei) {
            $records = [
                'survey response' => SurveyResponse::query()->where('survey_hei_id', $record->id)->count(),
                'user account' => User::query()->where('survey_hei_id', $record->id)->count(),
                'post' => Post::query()->where('survey_hei_id', $record->id)->count(),
            ];

            if (array_sum($records) > 0) {
                return $this->refuse(__(':name has :records. Deactivate it instead.', [
                    'name' => InstitutionName::display($record->name),
                    'records' => CountPhrase::of($records),
                ]));
            }
        }

        $name = $record instanceof SurveyRespondentGroup ? $record->label : $record->getAttribute('name');

        try {
            $record->delete();
        } catch (\Throwable) {
            return $this->refuse(__('This directory record is in use. Deactivate it instead.'));
        }
        $activity->record(ActivityAction::Deleted, $this->moduleFor($type), $record);

        Inertia::flash('toast', [
            'type' => 'deleted',
            'message' => __(':name deleted.', ['name' => $record instanceof SurveyHei ? InstitutionName::display($name) : $name]),
        ]);

        return back();
    }

    private function moduleFor(string $type): ActivityModule
    {
        return match ($type) {
            'regions' => ActivityModule::Regions,
            'clusters' => ActivityModule::Clusters,
            'heis' => ActivityModule::Heis,
            default => ActivityModule::RespondentGroups,
        };
    }

    private function modelFor(string $type): Model
    {
        return match ($type) {
            'regions' => new SurveyRegion,
            'clusters' => new SurveyCluster,
            'heis' => new SurveyHei,
            'respondent-groups' => new SurveyRespondentGroup,
            default => abort(404),
        };
    }
}
