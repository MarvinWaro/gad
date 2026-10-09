<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Badges\ManageBadge;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AwardBadgeRequest;
use App\Http\Requests\Settings\BadgeSearchRequest;
use App\Http\Requests\Settings\BadgeStatusRequest;
use App\Http\Requests\Settings\SaveBadgeRequest;
use App\Http\Resources\BadgeAwardResource;
use App\Http\Resources\BadgeResource;
use App\Http\Resources\QuestBadgeHolderResource;
use App\Models\Badge;
use App\Models\BadgeAward;
use App\Models\User;
use App\Support\InstitutionName;
use App\Support\PageRange;
use App\Support\PlaceFilters;
use App\Support\QuestBadgeHolders;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Settings → Badges: the badges people earn by sharing GAD work, the GAD
 * Quest levels, and the custom ones an office awards by hand
 * (docs/badges.md). The rules live in ManageBadge and AwardEarnedBadges.
 */
class BadgeController extends Controller
{
    /** People offered when awarding a badge. */
    public const PEOPLE = 20;

    public function index(BadgeSearchRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $search = $request->search();

        $badges = PageRange::within(Badge::query()
            // National badges for every office; a region's own for its office.
            ->when(! $user->national_access, fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->whereNull('survey_region_id')
                ->orWhere('survey_region_id', $user->survey_region_id)))
            ->when($search !== '', fn (Builder $query) => $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'))
            ->with('region:id,name')
            ->withCount('awards as holders_count')
            ->inListOrder()
            ->paginate(20)
            ->withQueryString());
        QuestBadgeHolders::countInto($badges->getCollection());

        return Inertia::render('settings/badges', [
            'badges' => BadgeResource::collection($badges),
            'filters' => ['search' => $search],
            'regions' => PlaceFilters::options($user, [])['regions'],
            'nationalAccess' => (bool) $user->national_access,
            'hasOffice' => $user->hasOffice(),
            'permissions' => ['create' => $user->can('create', Badge::class)],
        ]);
    }

    public function store(SaveBadgeRequest $request, ManageBadge $manager): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $badge = $manager->create($user, $request->regionId(), $request->badge(), $request->picture());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name created.', ['name' => $badge->name])]);

        return $this->backToList('settings.badges.index');
    }

    /** Who holds the badge, newest first; an office sees its own region's holders of a national badge. */
    public function show(BadgeSearchRequest $request, Badge $badge): Response
    {
        /** @var User $user */
        $user = $request->user();
        $search = $request->search();
        $badge->load('region:id,name')->loadCount('awards as holders_count');
        QuestBadgeHolders::countInto(new Collection([$badge]));

        return Inertia::render('settings/badge', [
            'badge' => BadgeResource::make($badge)->resolve($request),
            'holders' => $badge->quest_level !== null
                ? QuestBadgeHolderResource::collection(QuestBadgeHolders::page($badge->quest_level, $user, $search))
                : BadgeAwardResource::collection(PageRange::within($this->awardHolders($badge, $user, $search))),
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * A badge's awards, newest first: an office sees its own region's
     * holders of a national badge.
     *
     * @return LengthAwarePaginator<int, BadgeAward>
     */
    private function awardHolders(Badge $badge, User $user, string $search): LengthAwarePaginator
    {
        return $badge->awards()
            ->when(! $user->national_access, fn (Builder $query) => $query->whereHas(
                'user',
                fn (Builder $query) => $query->placedIn($user->survey_region_id),
            ))
            ->when($search !== '', fn (Builder $query) => $query->whereHas(
                'user',
                fn (Builder $query) => $query->where('name', 'like', '%'.addcslashes($search, '%_\\').'%'),
            ))
            ->with(['user:id,name,avatar_path,survey_hei_id,survey_region_id', 'user.hei:id,name', 'user.officeRegion:id,name', 'awarder:id,name'])
            ->latest('awarded_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString();
    }

    public function update(SaveBadgeRequest $request, Badge $badge, ManageBadge $manager): RedirectResponse
    {
        $manager->update($badge, $request->regionId(), $request->badge(), $request->picture(), $request->boolean('remove_image'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name saved.', ['name' => $badge->name])]);

        return $this->backToList('settings.badges.index');
    }

    public function status(BadgeStatusRequest $request, Badge $badge, ManageBadge $manager): RedirectResponse
    {
        $manager->setActive($badge, $request->boolean('is_active'));

        Inertia::flash('toast', ['type' => 'success', 'message' => $badge->is_active
            ? __(':name is on.', ['name' => $badge->name])
            : __(':name is off. Nobody receives it now; those who hold it keep it.', ['name' => $badge->name])]);

        return $this->backToList('settings.badges.index');
    }

    public function destroy(Badge $badge, ManageBadge $manager): RedirectResponse
    {
        $manager->delete($badge);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':name deleted.', ['name' => $badge->name])]);

        return $this->backToList('settings.badges.index');
    }

    /**
     * People who may be awarded the badge, by name or institution: active
     * accounts of its region (or of the office's, for a national badge) who
     * do not hold it yet.
     */
    public function people(Request $request, Badge $badge): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $search = trim((string) $request->query('q', ''));
        $like = '%'.addcslashes($search, '%_\\').'%';
        $regionId = $badge->survey_region_id ?? ($user->national_access ? null : $user->survey_region_id);

        $people = User::query()
            ->select(['id', 'name', 'avatar_path', 'survey_hei_id', 'survey_region_id'])
            ->with(['hei:id,name', 'officeRegion:id,name'])
            ->where('status', UserStatus::Active)
            ->when($regionId !== null, fn (Builder $query) => $query->placedIn($regionId))
            ->whereDoesntHave('badgeAwards', fn (Builder $query) => $query->where('badge_id', $badge->id))
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->where('name', 'like', $like)
                ->orWhereHas('hei', fn (Builder $query) => $query->where('name', 'like', $like))))
            ->orderBy('name')
            ->limit(self::PEOPLE)
            ->get();

        return response()->json($people->map(fn (User $person): array => [
            'id' => $person->id,
            'name' => $person->name,
            'avatar' => $person->avatar,
            'place' => match (true) {
                $person->hei !== null => InstitutionName::display($person->hei->name),
                $person->officeRegion !== null => $person->officeRegion->name,
                default => __('CHED Central Office'),
            },
        ])->values());
    }

    public function award(AwardBadgeRequest $request, Badge $badge, ManageBadge $manager): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $recipient = $request->recipient();
        $manager->award($badge, $user, $recipient, $request->note());

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':badge awarded to :name.', ['badge' => $badge->name, 'name' => $recipient->name])]);

        return back();
    }

    public function revoke(Badge $badge, BadgeAward $award, ManageBadge $manager): RedirectResponse
    {
        $manager->revoke($award);

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __(':badge taken back from :name.', ['badge' => $badge->name, 'name' => $award->user->name])]);

        return back();
    }
}
