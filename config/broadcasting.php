<?php

// Coolify hands its variables to the app as written, so a reference such
// as "${PUSHER_HOST}" (as Berth's "Copy as .env" lines have them) arrives
// unexpanded; only a .env file expands it. Such a value counts as unset.
$plain = static function (string $name, mixed $default = null): mixed {
    $value = env($name);

    return is_string($value) && str_contains($value, '${') ? $default : ($value ?? $default);
};

return [

    /*
    |--------------------------------------------------------------------------
    | Default Broadcaster
    |--------------------------------------------------------------------------
    |
    | Live updates go out through a Pusher-protocol server: the Soketi app
    | Berth provisions for PHLGADIS (docs/realtime.md). "log" or "null" turns
    | them off, and pages then check again on their own, as before.
    |
    */

    'default' => env('BROADCAST_CONNECTION', 'null'),

    'connections' => [

        'pusher' => [
            'driver' => 'pusher',
            'key' => env('PUSHER_APP_KEY'),
            'secret' => env('PUSHER_APP_SECRET'),
            'app_id' => env('PUSHER_APP_ID'),
            // How the server publishes: on Coolify, Soketi's internal name
            // over plain http; on a laptop, the public endpoint.
            'options' => [
                'cluster' => env('PUSHER_APP_CLUSTER', 'mt1'),
                'host' => env('PUSHER_HOST') ?: 'api-'.env('PUSHER_APP_CLUSTER', 'mt1').'.pusher.com',
                'port' => env('PUSHER_PORT', 443),
                'scheme' => env('PUSHER_SCHEME', 'https'),
                'encrypted' => true,
                'useTLS' => env('PUSHER_SCHEME', 'https') === 'https',
                // Sent after the response: a slow or missing server holds
                // up nobody, and gives up quickly.
                'timeout' => 3,
            ],
            'client_options' => [
                'connect_timeout' => 2,
                'timeout' => 3,
            ],
            // How browsers listen: the public endpoint. Sent to signed-in
            // pages at run time (HandleInertiaRequests), so one image works
            // wherever it runs. The key is the app's own, public by design;
            // never the secret. Without a public host, live updates are off.
            'client' => [
                'key' => env('PUSHER_APP_KEY'),
                'host' => $plain('VITE_PUSHER_HOST'),
                'port' => (int) $plain('VITE_PUSHER_PORT', 443),
                'scheme' => $plain('VITE_PUSHER_SCHEME', 'https'),
                'cluster' => env('PUSHER_APP_CLUSTER', 'mt1'),
            ],
        ],

        'log' => [
            'driver' => 'log',
        ],

        'null' => [
            'driver' => 'null',
        ],

    ],

];
