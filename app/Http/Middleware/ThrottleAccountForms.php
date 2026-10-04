<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Limits the account forms Fortify registers without a limiter: signing
 * up and resetting a password (the `account-forms` limiter, per visitor and
 * per network, as the public forms are). Fortify's own login, two-factor,
 * passkey and verification limits stay as they are.
 */
class ThrottleAccountForms
{
    private const ROUTES = ['register.store', 'password.email', 'password.update'];

    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array($request->route()?->getName(), self::ROUTES, true)) {
            return $next($request);
        }

        return app(ThrottleEachRoute::class)->handle($request, $next, 'account-forms');
    }
}
