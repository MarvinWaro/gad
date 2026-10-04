<?php

namespace App\Http\Middleware;

use Illuminate\Routing\Middleware\ThrottleRequests;

/**
 * Laravel's `throttle:N,M`, counted per route. Laravel keys a numeric limit
 * by the signed-in user (or the IP) alone, so every numeric limit shared
 * one counter: answering a GAD Quest and the bell's polling used up the
 * same allowance as starting one. Named limiters are unchanged.
 */
class ThrottleEachRoute extends ThrottleRequests
{
    protected function resolveRequestSignature($request)
    {
        $route = $request->route();
        $name = $route !== null ? ($route->getName() ?? $route->uri()) : $request->path();

        return sha1($name.'|'.parent::resolveRequestSignature($request));
    }
}
