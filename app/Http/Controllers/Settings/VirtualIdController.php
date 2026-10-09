<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Resources\VirtualIdResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Your Virtual ID, which staff scan to check you in at GAD events. */
class VirtualIdController extends Controller
{
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $user->loadMissing(['hei:id,name', 'officeRegion:id,name']);

        return Inertia::render('settings/virtual-id', [
            'card' => VirtualIdResource::make($user)->resolve($request),
        ]);
    }

    /** Your own profile photo, from this site, for the card to draw and save. */
    public function photo(Request $request): StreamedResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_if($user->avatar_path === null, 404);

        return Storage::disk('public')->response($user->avatar_path, null, [
            'Cache-Control' => 'private, max-age=86400',
        ]);
    }
}
