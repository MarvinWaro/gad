<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\ProfilePage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in person's own profile: what everyone sees on it (ProfilePage),
 * plus their own activity log and the badges they can still earn. Posts and
 * activity arrive just after the page, loading more as the reader scrolls.
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
            ...ProfilePage::props($request, $user),
            // What they did themselves; anyone may read their own.
            'activity' => Inertia::scroll(fn () => ActivityLogResource::collection(
                ActivityLog::query()
                    ->where('user_id', $user->id)
                    ->with(['user:id,avatar_path', 'subject', 'region:id,name', 'hei:id,name'])
                    ->latest('created_at')
                    ->latest('id')
                    ->simplePaginate(self::ACTIVITY_PER_PAGE, pageName: 'activity_page'),
            ))->defer(),
        ]);
    }
}
