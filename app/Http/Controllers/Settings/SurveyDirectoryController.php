<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\SurveyResponse;
use App\Services\PortalHeiSync;
use App\Services\PortalService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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

    public function index(Request $request): Response
    {
        return Inertia::render('settings/survey-directories', [
            'regions' => SurveyRegion::query()->withCount('clusters')->orderBy('name')->get(),
            'clusters' => SurveyCluster::query()->with('region:id,name')->withCount('heis')->orderBy('name')->get(),
            'respondentGroups' => SurveyRespondentGroup::query()->ordered()->get(),
            'heis' => SurveyHei::query()->with('cluster:id,name,survey_region_id', 'cluster.region:id,name')
                ->orderBy('name')
                ->get(['id', 'survey_cluster_id', 'uii', 'name', 'ownership', 'is_active', 'portal_synced_at']),
            'permissions' => [
                'create' => $request->user()->can('survey-directories.create'),
                'update' => $request->user()->can('survey-directories.update'),
                'delete' => $request->user()->can('survey-directories.delete'),
            ],
            'portal' => [
                'configured' => app(PortalService::class)->isConfigured(),
                'last_synced_at' => SurveyHei::query()->max('portal_synced_at')
                    ? Carbon::parse(SurveyHei::query()->max('portal_synced_at'))->toIso8601String()
                    : null,
                'synced_count' => SurveyHei::query()->whereNotNull('portal_synced_at')->where('is_active', true)->count(),
            ],
        ]);
    }

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

    public function store(Request $request, string $type): RedirectResponse
    {
        $model = $this->modelFor($type);
        if ($type === 'respondent-groups') {
            return $this->storeRespondentGroup($request);
        }
        $parent = $type === 'clusters' ? 'survey_region_id' : ($type === 'heis' ? 'survey_cluster_id' : null);
        $table = $model->getTable();
        $rules = ['name' => ['required', 'string', 'max:180', Rule::unique($table)->where(fn ($query) => $parent ? $query->where($parent, $request->input($parent)) : $query)]];
        if ($parent !== null) {
            $rules[$parent] = ['required', 'integer', Rule::exists($parent === 'survey_region_id' ? 'survey_regions' : 'survey_clusters', 'id')];
        }
        $rules += $this->heiRules($type);
        $validated = $request->validate($rules, [], self::ATTRIBUTE_NAMES);
        $model->newQuery()->create([...$validated, 'is_active' => true]);

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
    private function storeRespondentGroup(Request $request): RedirectResponse
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

        SurveyRespondentGroup::query()->create([
            'value' => $candidate,
            'label' => $validated['label'],
            'requires_text' => (bool) ($validated['requires_text'] ?? false),
            'is_active' => true,
            'sort_order' => (int) SurveyRespondentGroup::query()->max('sort_order') + 1,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name added.', ['name' => $validated['label']]),
        ]);

        return back();
    }

    public function update(Request $request, string $type, int $id): RedirectResponse
    {
        $record = $this->modelFor($type)->newQuery()->findOrFail($id);
        if ($type === 'respondent-groups') {
            $record->update($request->validate([
                'label' => ['required', 'string', 'max:120', Rule::unique('survey_respondent_groups', 'label')->ignore($record->getKey())],
                'requires_text' => ['required', 'boolean'],
                'is_active' => ['required', 'boolean'],
                'sort_order' => ['sometimes', 'integer', 'min:0', 'max:999'],
            ], [], ['label' => 'name']));

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __(':name updated.', ['name' => $record->label]),
            ]);

            return back();
        }
        $rules = [
            'name' => ['required', 'string', 'max:180'],
            'is_active' => ['required', 'boolean'],
        ];
        if ($type === 'heis') {
            $rules['survey_cluster_id'] = ['required', 'integer', Rule::exists('survey_clusters', 'id')];
            $rules['name'][] = Rule::unique('survey_heis')
                ->where(fn ($query) => $query->where('survey_cluster_id', $request->input('survey_cluster_id')))
                ->ignore($record->getKey());
        }
        $rules += $this->heiRules($type, $record->getKey());
        $record->update($request->validate($rules, [], self::ATTRIBUTE_NAMES));

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name updated.', ['name' => $record->name]),
        ]);

        return back();
    }

    /**
     * Fields that only exist on HEIs. The UII is CHED's institution key, so it
     * is unique across the whole directory rather than per cluster.
     *
     * @return array<string, array<int, mixed>>
     */
    private function heiRules(string $type, ?int $ignoreId = null): array
    {
        if ($type !== 'heis') {
            return [];
        }

        return [
            'uii' => [
                'nullable', 'string', 'max:40', 'regex:/^[A-Za-z0-9-]+$/',
                Rule::unique('survey_heis', 'uii')->ignore($ignoreId),
            ],
            'ownership' => ['nullable', Rule::in(SurveyHei::OWNERSHIPS)],
        ];
    }

    public function destroy(string $type, int $id): RedirectResponse
    {
        $record = $this->modelFor($type)->newQuery()->findOrFail($id);
        if ($record instanceof SurveyRespondentGroup
            && SurveyResponse::query()->where('respondent_group', $record->value)->exists()) {
            return back()->withErrors(['directory' => 'Responses were collected under this group. Deactivate it instead.']);
        }
        try {
            $record->delete();
        } catch (\Throwable) {
            return back()->withErrors(['directory' => 'This directory record is in use. Deactivate it instead.']);
        }

        return back();
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
