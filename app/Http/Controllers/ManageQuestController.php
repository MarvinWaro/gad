<?php

namespace App\Http\Controllers;

use App\Actions\Quests\ManageQuest;
use App\Actions\Quests\SaveQuest;
use App\Enums\QuestStatus;
use App\Http\Requests\Quests\QuestListFilterRequest;
use App\Http\Requests\Quests\QuestResultsFilterRequest;
use App\Http\Requests\Quests\QuestRetakesRequest;
use App\Http\Requests\Quests\QuestStatusRequest;
use App\Http\Requests\Quests\SaveQuestRequest;
use App\Http\Resources\QuestResource;
use App\Models\Quest;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\PlaceFilters;
use App\Support\QuestResults;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * GAD Quest for its staff (Administrators and CHED Focals): writing quests
 * for their office's region, opening and closing them, and their results.
 */
class ManageQuestController extends Controller
{
    public function index(QuestListFilterRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        $search = trim((string) ($filters['search'] ?? ''));

        $quests = Quest::query()
            // A regional office runs its own region's quests; the Central
            // Office runs every region's, and those for every region.
            ->when(! $user->national_access, fn (Builder $query) => $query->where('survey_region_id', $user->survey_region_id))
            ->when($user->national_access && ! empty($filters['region']), fn (Builder $query) => $query->where('survey_region_id', $filters['region']))
            ->when($search !== '', fn (Builder $query) => $query->where('title', 'like', "%{$search}%"))
            ->with(['region:id,name', 'creator:id,name'])
            ->withCount([
                'attempts as players_count' => fn (Builder $query) => $query->select(DB::raw('count(distinct user_id)')),
                'attempts as completed_count' => fn (Builder $query) => $query->whereNotNull('finished_at')->select(DB::raw('count(distinct user_id)')),
            ])
            ->latest('updated_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('quests/manage/index', [
            'quests' => QuestResource::collection($quests),
            'filters' => $filters,
            'regions' => PlaceFilters::options($user, $filters)['regions'],
            'hasOffice' => $user->hasOffice(),
            'canPlay' => $user->playsQuests(),
            'permissions' => ['create' => $user->can('create', Quest::class)],
        ]);
    }

    public function create(Request $request): Response
    {
        return $this->form($request, null);
    }

    public function store(SaveQuestRequest $request, SaveQuest $save): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $quest = $save->create($user, $request->regionId(), $request->quest());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quest saved as a draft. Open it when it is ready.')]);

        return to_route('quests.manage.show', $quest);
    }

    public function show(QuestResultsFilterRequest $request, Quest $quest): Response
    {
        /** @var User $user */
        $user = $request->user();
        $filters = $request->validated();
        // A region's quest is only played in that region.
        if ($quest->survey_region_id !== null) {
            $filters['region'] = $quest->survey_region_id;
        }
        $quest->load(['region:id,name', 'creator:id,name', 'questions.choices'])->loadExists('attempts as played');

        return Inertia::render('quests/manage/show', [
            'quest' => QuestResource::make($quest)->resolve($request),
            ...QuestResults::for($quest, $filters),
            'filters' => array_intersect_key($request->validated(), array_flip(['region', 'hei'])),
            ...$this->places($user, $quest, $filters),
            'canPlay' => $user->playsQuests(),
            'permissions' => [
                'update' => $user->can('update', $quest),
                'delete' => $user->can('delete', $quest),
            ],
        ]);
    }

    public function edit(Request $request, Quest $quest): Response
    {
        return $this->form($request, $quest);
    }

    public function update(SaveQuestRequest $request, Quest $quest, SaveQuest $save): RedirectResponse
    {
        $save->update($quest, $request->regionId(), $request->quest());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Quest saved.')]);

        return to_route('quests.manage.show', $quest);
    }

    public function status(QuestStatusRequest $request, Quest $quest, ManageQuest $manager): RedirectResponse
    {
        if ($request->status() === QuestStatus::Open) {
            $manager->open($quest);
            $message = __('Quest open. Its players can play it now.');
        } else {
            $manager->close($quest);
            $message = __('Quest closed. Players keep their badges.');
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    public function retakes(QuestRetakesRequest $request, Quest $quest, ManageQuest $manager): RedirectResponse
    {
        $allowed = $request->boolean('allow_retakes');
        $manager->setRetakes($quest, $allowed);

        Inertia::flash('toast', ['type' => 'success', 'message' => $allowed
            ? __('Retakes on. Players who finished can play again; their best score counts.')
            : __('Retakes off. Each player plays once.')]);

        return back();
    }

    public function destroy(Quest $quest, ManageQuest $manager): RedirectResponse
    {
        $manager->delete($quest);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __('Quest deleted.')]);

        return to_route('quests.manage.index');
    }

    /** The create and edit page; the questions lock once anyone has played. */
    private function form(Request $request, ?Quest $quest): Response
    {
        /** @var User $user */
        $user = $request->user();
        $quest?->load(['region:id,name', 'creator:id,name', 'questions.choices'])->loadExists('attempts as played');

        return Inertia::render('quests/manage/edit', [
            'quest' => $quest !== null ? QuestResource::make($quest)->resolve($request) : null,
            'regions' => PlaceFilters::options($user, [])['regions'],
            'nationalAccess' => (bool) $user->national_access,
            'limits' => [
                'questions' => Quest::QUESTIONS,
                'min_choices' => Quest::MIN_CHOICES,
                'max_choices' => Quest::MAX_CHOICES,
            ],
            'canPlay' => $user->playsQuests(),
        ]);
    }

    /**
     * The results' place filters: a region's quest lists that region's HEIs;
     * a quest for every region lists every region, then its HEIs.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function places(User $user, Quest $quest, array $filters): array
    {
        if ($quest->survey_region_id === null) {
            return PlaceFilters::options($user, $filters);
        }

        return [
            'regions' => SurveyRegion::query()->whereKey($quest->survey_region_id)->get(['id', 'name']),
            'heis' => SurveyHei::query()
                ->whereHas('cluster', fn (Builder $query) => $query->where('survey_region_id', $quest->survey_region_id))
                ->orderBy('name')
                ->get(['id', 'name']),
        ];
    }
}
