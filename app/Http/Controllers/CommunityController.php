<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\CommunityFeed;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/** The community feed inside the staff shell, where moderators review posts. */
class CommunityController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('community/index', [
            'posts' => Inertia::scroll(fn () => CommunityFeed::page($user)),
        ]);
    }
}
