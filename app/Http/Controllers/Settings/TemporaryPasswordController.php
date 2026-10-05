<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TemporaryPasswordUpdateRequest;
use App\Models\User;
use App\Services\ActivityRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Where an account on a temporary password chooses its own, before anything
 * else opens (EnsurePasswordIsChanged).
 */
class TemporaryPasswordController extends Controller
{
    public function edit(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->must_change_password) {
            return to_route('dashboard');
        }

        return Inertia::render('auth/change-password', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]);
    }

    public function update(TemporaryPasswordUpdateRequest $request, ActivityRecorder $activity): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->forceFill([
            'password' => $request->validated('password'),
            'must_change_password' => false,
        ])->save();
        $activity->record(ActivityAction::PasswordChanged, ActivityModule::Account);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Your password is set.')]);

        return redirect()->intended(route('dashboard'));
    }
}
