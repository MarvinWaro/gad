<?php

namespace App\Http\Controllers;

use App\Actions\People\FollowPerson;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * The Follow button. Answers with whether the reader now follows the
 * person and how many followers they have, for the button and the count.
 */
class FollowController extends Controller
{
    public function store(Request $request, User $person, FollowPerson $follows): JsonResponse
    {
        Gate::authorize('follow', $person);

        /** @var User $viewer */
        $viewer = $request->user();

        return response()->json($follows->follow($viewer, $person));
    }

    /** Anyone may stop following, even someone who can no longer sign in. */
    public function destroy(Request $request, User $person, FollowPerson $follows): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        return response()->json($follows->unfollow($viewer, $person));
    }
}
