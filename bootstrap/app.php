<?php

use App\Http\Controllers\PublicUploadController;
use App\Http\Middleware\EnsurePasswordIsChanged;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ThrottleAccountForms;
use App\Http\Middleware\ThrottleEachRoute;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',   // add this
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // Outside the web group: images need no session or cookies.
        then: function (): void {
            Route::get('files/{path}', PublicUploadController::class)
                ->where('path', '.+')
                ->middleware('throttle:600,1')
                ->name('public-uploads.show');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // The host's load balancer ends HTTPS and forwards plain HTTP; trust
        // its forwarded headers so links, assets and redirects stay https.
        $middleware->trustProxies(at: '*');

        // Each `throttle:N,M` route keeps its own count (ThrottleEachRoute).
        $middleware->alias(['throttle' => ThrottleEachRoute::class]);

        // A monitoring draft is saved exactly as typed: each field is only
        // written if it still matches what the person started from, so trimming
        // or nulling the text would turn every save into a conflict.
        $isDraftSave = fn (Request $request): bool => $request->is('monitoring/*/draft');
        $middleware->trimStrings(except: [$isDraftSave]);
        $middleware->convertEmptyStringsToNull(except: [$isDraftSave]);

        $middleware->web(append: [
            EnsureUserIsActive::class,
            EnsurePasswordIsChanged::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            // The first 20 preloads only: the HTML carries every one, and a
            // header naming all of them outgrows the server's header buffer.
            AddLinkHeadersForPreloadedAssets::using(20),
            ThrottleAccountForms::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
