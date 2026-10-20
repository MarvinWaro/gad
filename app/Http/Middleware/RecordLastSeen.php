<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Notes when each signed-in person was last here, for "Online" and "Last
 * seen" in Settings → Users. It writes after the response has gone, at most
 * once a minute a person, straight to the column: no model events, no
 * updated_at and no activity log entry.
 */
class RecordLastSeen
{
    /** Seconds between two notes for one person. */
    private const EVERY = 60;

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $user = $request->user();

        if (! $user instanceof User || $user->last_seen_at?->gt(now()->subSeconds(self::EVERY))) {
            return;
        }

        User::query()->whereKey($user->getKey())->toBase()->update(['last_seen_at' => now()]);
    }
}
