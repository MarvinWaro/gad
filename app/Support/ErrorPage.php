<?php

namespace App\Support;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

/**
 * Laravel's plain error pages in PHLGADIS's own look (pages/error-page.tsx).
 * A real crash keeps its stack trace while APP_DEBUG is on, and JSON callers
 * keep Laravel's JSON.
 */
final class ErrorPage
{
    /** The statuses with a page of their own. */
    public const STATUSES = [403, 404, 419, 429, 500, 503];

    /** What a rate limit or maintenance response tells the browser, kept. */
    private const KEPT_HEADERS = ['Retry-After', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'];

    public static function respond(Response $response, Throwable $exception, Request $request): Response
    {
        $status = $response->getStatusCode();

        if (! in_array($status, self::STATUSES, true)
            || $request->expectsJson()
            || $request->is('api/*')
            || (! $exception instanceof HttpExceptionInterface && config('app.debug'))) {
            return $response;
        }

        // An expired form goes back to what was typed, with a toast.
        if ($status === 419 && $request->header('X-Inertia')) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('This page expired. Please try again.')]);

            return back();
        }

        $retryAfter = $response->headers->get('Retry-After');

        // The operator comes along because a URL that matched no route never
        // reaches the middleware that shares it.
        $page = Inertia::render('error-page', [
            'status' => $status,
            'retryAfter' => is_numeric($retryAfter) ? (int) $retryAfter : null,
            'operator' => config('phlgadis.operator'),
        ])->toResponse($request)->setStatusCode($status);

        foreach (self::KEPT_HEADERS as $header) {
            if ($response->headers->has($header)) {
                $page->headers->set($header, $response->headers->get($header));
            }
        }

        return $page;
    }
}
