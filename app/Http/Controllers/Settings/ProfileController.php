<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Http\Resources\RegionOfficeResource;
use App\Services\ActivityRecorder;
use App\Support\InstitutionName;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response|RedirectResponse
    {
        // My Profile used to live here; old links still find it.
        if ($request->query('view') === 'my-profile') {
            return to_route('my-profile');
        }

        $user = $request->user();
        $hei = $user->hei?->loadMissing('cluster.region');

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            // Shown read-only: only an administrator can move an account to
            // another institution. CHED staff have none.
            'institution' => $hei ? InstitutionName::display($hei->name) : null,
            // The regional office to contact about the institution.
            'office' => $hei?->cluster?->region
                ? RegionOfficeResource::make($hei->cluster->region)->resolve($request)
                : null,
            // Contact details left out of registration, added here.
            'details' => $user->only(['mobile_number', 'sex']),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, ActivityRecorder $activity): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        $changes = $activity->changesOf($request->user(), ['email_verified_at']);
        if ($changes !== []) {
            $activity->record(ActivityAction::Updated, ActivityModule::Account, $request->user(), $changes);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request, ActivityRecorder $activity): RedirectResponse
    {
        $user = $request->user();
        $activity->record(ActivityAction::Deleted, ActivityModule::Account, $user);

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
