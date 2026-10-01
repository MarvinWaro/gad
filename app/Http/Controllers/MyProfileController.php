<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\CommunityFeed;
use App\Support\InstitutionName;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in person's own profile: their Gender Mainstreaming posts and
 * their own activity log. Both arrive just after the page, loading more as
 * the reader scrolls.
 */
class MyProfileController extends Controller
{
    /** Activity entries per page. */
    public const ACTIVITY_PER_PAGE = 15;

    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('profile/show', [
            'institution' => $user->hei ? InstitutionName::display($user->hei->name) : null,
            'posts' => Inertia::scroll(fn () => CommunityFeed::page($user, author: $user))->defer(),
            // What they did themselves; anyone may read their own.
            'activity' => Inertia::scroll(fn () => ActivityLogResource::collection(
                ActivityLog::query()
                    ->where('user_id', $user->id)
                    ->with(['user:id,avatar_path', 'subject', 'region:id,name', 'cluster:id,name', 'hei:id,name'])
                    ->latest('created_at')
                    ->latest('id')
                    ->simplePaginate(self::ACTIVITY_PER_PAGE, pageName: 'activity_page'),
            ))->defer(),
        ]);
    }
}
