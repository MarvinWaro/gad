<?php

namespace App\Http\Responses;

use App\Enums\UserStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

/**
 * Fortify signs a new user in straight after registration. Registrations
 * usually wait for administrator approval, so end that session and send the
 * user back to the login screen with an explanation instead. A region open
 * for on-the-spot registration lets its accounts straight in.
 */
class RegisterResponse implements RegisterResponseContract
{
    /**
     * @param  Request  $request
     */
    public function toResponse($request): JsonResponse|RedirectResponse
    {
        if ($request->user()?->status === UserStatus::Active) {
            $message = __('Welcome to PHLGADIS.');

            if ($request->wantsJson()) {
                return new JsonResponse(['message' => $message], 201);
            }

            Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

            return redirect()->intended(route('dashboard'));
        }

        Auth::guard(config('fortify.guard'))->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $message = __('Registration received. You can log in once the administrator approves your account.');

        return $request->wantsJson()
            ? new JsonResponse(['message' => $message], 201)
            : redirect()->route('login')->with('status', $message);
    }
}
