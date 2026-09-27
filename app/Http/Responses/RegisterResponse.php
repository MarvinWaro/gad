<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Fortify;

/**
 * Fortify signs a new user in straight after registration. Registrations
 * wait for administrator approval, so end that session and send the user
 * back to the login screen with an explanation instead.
 */
class RegisterResponse implements RegisterResponseContract
{
    /**
     * @param  Request  $request
     */
    public function toResponse($request): JsonResponse|RedirectResponse
    {
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
