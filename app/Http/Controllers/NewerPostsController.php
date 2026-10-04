<?php

namespace App\Http\Controllers;

use App\Enums\FeedScope;
use App\Http\Requests\NewerPostsRequest;
use App\Models\User;
use App\Support\CommunityFeed;
use Illuminate\Http\JsonResponse;

/**
 * How many posts arrived after the newest one a reader has, asked when they
 * come back to the feed, so it can offer (or load) them.
 */
class NewerPostsController extends Controller
{
    public function __invoke(NewerPostsRequest $request): JsonResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        return response()->json([
            'count' => CommunityFeed::newerCount($viewer, $request->postedAt(), $request->postId(), FeedScope::of($request)),
        ]);
    }
}
