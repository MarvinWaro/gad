<?php

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
            // wherever it runs. The key is public by design; never the secret.
            'client' => [
                'key' => env('VITE_PUSHER_APP_KEY') ?: env('PUSHER_APP_KEY'),
                'host' => env('VITE_PUSHER_HOST'),
                'port' => (int) env('VITE_PUSHER_PORT', 443),
                'scheme' => env('VITE_PUSHER_SCHEME', 'https'),
                'cluster' => env('VITE_PUSHER_APP_CLUSTER') ?: env('PUSHER_APP_CLUSTER', 'mt1'),
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
