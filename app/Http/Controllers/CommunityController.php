<?php

namespace App\Http\Controllers;

use App\Enums\FeedScope;
use App\Http\Requests\FeedScopeRequest;
use App\Models\User;
use App\Support\CommunityFeed;
use Inertia\Inertia;
use Inertia\Response;

/** The community feed inside the staff shell, where moderators review posts. */
class CommunityController extends Controller
{
    public function __invoke(FeedScopeRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $scope = FeedScope::of($request);

        return Inertia::render('community/index', [
            'feed' => $scope->value,
            // Loaded just after the page appears, which shows skeletons meanwhile.
            'posts' => Inertia::scroll(fn () => CommunityFeed::page($user, scope: $scope))->defer(),
        ]);
    }
}
