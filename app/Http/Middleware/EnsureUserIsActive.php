<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sign out accounts that are pending approval or were deactivated. Login
 * already rejects them; this covers passkeys, remember-me cookies, and
 * sessions that were open when an administrator deactivated the account.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User || $user->isActive()) {
            return $next($request);
        }

        $message = $user->status->loginMessage();

        Auth::guard(config('fortify.guard'))->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if ($request->expectsJson()) {
            abort(403, $message);
        }

        return redirect()->route('login')->withErrors(['email' => $message]);
    }
}
