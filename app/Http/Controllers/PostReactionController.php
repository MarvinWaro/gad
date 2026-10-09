<?php

namespace App\Http\Controllers;

use App\Actions\Community\ReactToPost;
use App\Http\Requests\ListPostReactionsRequest;
use App\Http\Requests\ReactToPostRequest;
use App\Http\Resources\PostReactorResource;
use App\Models\Post;
use App\Models\User;
use App\Support\CommunityFeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Reactions answer with JSON so the feed can update one card in place instead
 * of reloading every page the reader has scrolled through.
 */
class PostReactionController extends Controller
{
    /** People listed per page of a post's reactions. */
    private const PER_PAGE = 20;

    /** Everyone who reacted, newest first, or only those who chose one reaction. */
    public function index(ListPostReactionsRequest $request, Post $post): AnonymousResourceCollection
    {
        return PostReactorResource::collection(
            $post->reactions()
                ->when($request->reaction(), fn ($query, $type) => $query->where('type', $type))
                ->with(['user:id,name,survey_hei_id,survey_region_id,avatar_path', 'user.hei:id,name', 'user.officeRegion:id,name'])
                ->orderByDesc('id')
                ->cursorPaginate(self::PER_PAGE),
        );
    }

    public function update(ReactToPostRequest $request, Post $post, ReactToPost $react): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $react->set($user, $post, $request->reaction());

        return response()->json(CommunityFeed::reactionsOf($post, $user));
    }

    public function destroy(Request $request, Post $post, ReactToPost $react): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $react->remove($user, $post);

        return response()->json(CommunityFeed::reactionsOf($post, $user));
    }
}
