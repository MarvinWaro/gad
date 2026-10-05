<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * An account still on a temporary password (User::giveTemporaryPassword)
 * goes nowhere but the page that replaces it, or out. The page it asked for
 * opens once the password is chosen.
 */
class EnsurePasswordIsChanged
{
    /** The routes open to it meanwhile. */
    private const OPEN = ['password.change', 'password.change.update', 'logout'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user instanceof User || ! $user->must_change_password || $request->routeIs(self::OPEN)) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            abort(403, __('Choose your own password to continue.'));
        }

        if ($request->isMethod('GET')) {
            redirect()->setIntendedUrl($request->fullUrl());
        }

        return to_route('password.change');
    }
}
