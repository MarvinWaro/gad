<?php

namespace App\Http\Controllers;

use App\Http\Requests\LivePostsRequest;
use App\Models\User;
use App\Support\CommunityFeed;
use Illuminate\Http\JsonResponse;

/**
 * Posts a feed shows, fresh, as the reader sees them: asked for when live
 * updates say someone commented, reacted, shared, edited or deleted. A post
 * left out of the answer is gone.
 */
class LivePostsController extends Controller
{
    public function __invoke(LivePostsRequest $request): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        return response()->json(['data' => CommunityFeed::many($viewer, $request->ids())]);
    }
}
