<?php

namespace App\Http\Controllers;

use App\Http\Resources\PersonResource;
use App\Models\User;
use App\Support\ProfilePage;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Someone else's profile, and who follows them and whom they follow. Your
 * own address leads to My Profile, which adds your activity.
 */
class PersonProfileController extends Controller
{
    /** People per page of a follower list. */
    public const PER_PAGE = 20;

    public function show(Request $request, User $person): Response|RedirectResponse
    {
        Gate::authorize('viewProfile', $person);

        if ($request->user()?->is($person)) {
            return to_route('my-profile', $request->only('tab'));
        }

        return Inertia::render('profile/show', ProfilePage::props($request, $person));
    }

    public function followers(Request $request, User $person): JsonResponse
    {
        Gate::authorize('viewProfile', $person);

        return $this->list($request, $person->followers());
    }

    public function following(Request $request, User $person): JsonResponse
    {
        Gate::authorize('viewProfile', $person);

        return $this->list($request, $person->following());
    }

    /**
     * Active accounts only, the latest follow first.
     *
     * @param  BelongsToMany<User, User>  $people
     */
    private function list(Request $request, BelongsToMany $people): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        return PersonResource::collection($people
            ->active()
            ->select(['users.id', 'users.ulid', 'users.name', 'users.avatar_path', 'users.survey_hei_id', 'users.survey_region_id', 'users.status'])
            ->with(['hei:id,name', 'officeRegion:id,name'])
            ->withExists(PersonResource::viewerFlags($viewer))
            ->orderByPivot('created_at', 'desc')
            ->orderBy('users.id')
            ->simplePaginate(self::PER_PAGE))
            ->response();
    }
}
