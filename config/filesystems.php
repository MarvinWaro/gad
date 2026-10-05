<?php

/*
| Uploads (photos, carousel slides, badges and signed monitoring files) stay
| on this machine unless FILESYSTEM_UPLOADS=spaces sends them to a
| DigitalOcean Spaces bucket. App Platform empties its own disk on every
| deploy, so production keeps them in Spaces. Each environment writes under
| its own folder (SPACES_ROOT, the environment's name by default), so local
| tests never mix with live files.
*/
$spaces = env('FILESYSTEM_UPLOADS', 'local') === 'spaces';
$bucket = [
    'driver' => 's3',
    'key' => env('SPACES_KEY'),
    'secret' => env('SPACES_SECRET'),
    'region' => env('SPACES_REGION', 'sgp1'),
    'bucket' => env('SPACES_BUCKET'),
    'endpoint' => env('SPACES_ENDPOINT', 'https://sgp1.digitaloceanspaces.com'),
    'use_path_style_endpoint' => false,
];
$folder = trim((string) env('SPACES_ROOT', env('APP_ENV', 'production')), '/');

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        // Private either way: files are only handed out by MonitoringController.
        'monitoring' => $spaces ? [
            ...$bucket,
            'root' => $folder.'/monitoring-files',
            'throw' => true,
            'visibility' => 'private',
        ] : [
            'driver' => 'local',
            'root' => storage_path('app/private/monitoring-files'),
            'throw' => true,
            'visibility' => 'private',
        ],

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => $spaces ? [
            ...$bucket,
            'root' => $folder.'/public',
            // The bucket's origin, or its CDN endpoint once that is on.
            'url' => env('SPACES_URL'),
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ] : [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => rtrim((string) env('APP_URL', 'http://localhost'), '/').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
