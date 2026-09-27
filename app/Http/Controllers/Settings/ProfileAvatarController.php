<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

/**
 * The account's profile photo. It shows on the person's posts and comments,
 * always beside their school's name, so it need not be the school's logo.
 */
class ProfileAvatarController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:min_width=64,min_height=64'],
        ], [
            'avatar.required' => __('Choose a photo to upload.'),
            'avatar.image' => __('The file must be a photo.'),
            'avatar.mimes' => __('Photos must be JPG, PNG, or WebP.'),
            'avatar.max' => __('The photo must be 2 MB or smaller.'),
            'avatar.dimensions' => __('The photo must be at least 64 by 64 pixels.'),
        ]);

        $previous = $user->avatar_path;
        $user->forceFill(['avatar_path' => $request->file('avatar')->store('avatars', 'public')])->save();

        if ($previous !== null) {
            Storage::disk('public')->delete($previous);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile photo updated.')]);

        return to_route('profile.edit');
    }

    public function destroy(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->avatar_path !== null) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->forceFill(['avatar_path' => null])->save();
        }

        Inertia::flash('toast', ['type' => 'deleted', 'message' => __('Profile photo removed.')]);

        return to_route('profile.edit');
    }
}
