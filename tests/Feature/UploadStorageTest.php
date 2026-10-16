<?php

use App\Support\PublicUpload;
use Illuminate\Support\Facades\Storage;

/** config/filesystems.php as it reads under these settings. */
function uploadConfig(array $env): array
{
    $before = [$_SERVER, $_ENV];
    foreach ($env as $key => $value) {
        $_SERVER[$key] = $_ENV[$key] = $value;
    }

    try {
        return require config_path('filesystems.php');
    } finally {
        [$_SERVER, $_ENV] = $before;
    }
}

function uploadDisks(array $env): array
{
    return uploadConfig($env)['disks'];
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
        'SPACES_ENDPOINT' => 'https://sgp1.digitaloceanspaces.com',
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

test('a bucket without its own address (Berth) has the site hand out public uploads', function () {
    $berth = ['FILESYSTEM_UPLOADS' => 'spaces', 'SPACES_PATH_STYLE' => 'true', 'SPACES_URL' => ''];

    expect(uploadConfig($berth)['public_through_app'])->toBeTrue()
        ->and(uploadConfig($berth)['disks']['public']['use_path_style_endpoint'])->toBeTrue()
        ->and(uploadConfig(['FILESYSTEM_UPLOADS' => 'spaces', 'SPACES_URL' => 'https://cdn.example.test'])['public_through_app'])->toBeFalse()
        ->and(uploadConfig(['FILESYSTEM_UPLOADS' => 'local'])['public_through_app'])->toBeFalse();
});

test('the site serves public uploads under its own address', function () {
    Storage::fake('public');
    Storage::disk('public')->put('avatars/photo.webp', 'image-bytes');
    config(['filesystems.public_through_app' => true]);

    expect(PublicUpload::url('avatars/photo.webp'))->toBe(url('files/avatars/photo.webp'));

    $response = $this->get('/files/avatars/photo.webp')->assertOk();
    expect($response->streamedContent())->toBe('image-bytes')
        ->and($response->headers->get('Cache-Control'))->toContain('immutable')
        ->and($response->headers->get('Content-Type'))->toBe('image/webp')
        ->and($response->headers->get('Set-Cookie'))->toBeNull();

    $this->get('/files/avatars/missing.webp')->assertNotFound();
    $this->get('/files/avatars/../avatars/photo.webp')->assertNotFound();
});
