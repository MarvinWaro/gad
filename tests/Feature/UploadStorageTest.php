<?php

/** The upload disks as config/filesystems.php builds them under these settings. */
function uploadDisks(array $env): array
{
    $before = [$_SERVER, $_ENV];
    foreach ($env as $key => $value) {
        $_SERVER[$key] = $_ENV[$key] = $value;
    }

    try {
        return (require config_path('filesystems.php'))['disks'];
    } finally {
        [$_SERVER, $_ENV] = $before;
    }
}

test('uploads stay on this machine unless Spaces is chosen', function () {
    $disks = uploadDisks(['FILESYSTEM_UPLOADS' => 'local']);

    expect($disks['public']['driver'])->toBe('local')
        ->and($disks['monitoring']['driver'])->toBe('local');
});

test('on Spaces, photos are public and monitoring files private, each under the environment folder', function () {
    $disks = uploadDisks([
        'FILESYSTEM_UPLOADS' => 'spaces',
        'SPACES_BUCKET' => 'gad-bucket',
        'SPACES_URL' => 'https://gad-bucket.sgp1.digitaloceanspaces.com',
        'APP_ENV' => 'production',
    ]);

    expect($disks['public'])->toMatchArray([
        'driver' => 's3',
        'bucket' => 'gad-bucket',
        'endpoint' => 'https://sgp1.digitaloceanspaces.com',
        'root' => 'production/public',
        'visibility' => 'public',
        'url' => 'https://gad-bucket.sgp1.digitaloceanspaces.com',
    ])->and($disks['monitoring'])->toMatchArray([
        'driver' => 's3',
        'root' => 'production/monitoring-files',
        'visibility' => 'private',
        'throw' => true,
        // An unreachable bucket gives up in seconds, not minutes.
        'http' => ['connect_timeout' => 5],
    ]);

    expect(uploadDisks(['FILESYSTEM_UPLOADS' => 'spaces', 'SPACES_ROOT' => 'staging/'])['public']['root'])->toBe('staging/public');
});
