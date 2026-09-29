<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;

$public = realpath(__DIR__.'/../../public');
$uri = rawurldecode((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$path = realpath($public.'/'.$uri);
if ($path && str_starts_with($path, $public.DIRECTORY_SEPARATOR) && is_file($path)) {
    return false;
}

// server.php gives each run its own uploads folder; serve it as /storage.
$uploadsFolder = getenv('BROWSER_UPLOADS');
$uploads = $uploadsFolder ? realpath($uploadsFolder) : false;
if ($uploads && str_starts_with($uri, '/storage/')) {
    $upload = realpath($uploads.'/'.substr($uri, strlen('/storage/')));
    if ($upload && str_starts_with($upload, $uploads.DIRECTORY_SEPARATOR) && is_file($upload)) {
        header('Content-Type: '.(mime_content_type($upload) ?: 'application/octet-stream'));
        readfile($upload);

        return true;
    }
}

require __DIR__.'/../../vendor/autoload.php';
/** @var Application $app */
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if ($uploads) {
    config(['filesystems.disks.public.root' => $uploads]);
    config(['filesystems.disks.monitoring.root' => $uploads.'-private']);
}
// Browser tests exercise built assets even when a developer has Vite running.
Vite::useHotFile(sys_get_temp_dir().'/phlgadis-browser-no-hot-file');
$app->handleRequest(Request::capture());
