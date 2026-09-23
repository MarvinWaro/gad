<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;

$public = realpath(__DIR__.'/../../public');
$path = realpath($public.'/'.rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)));
if ($path && str_starts_with($path, $public.DIRECTORY_SEPARATOR) && is_file($path)) {
    return false;
}

require __DIR__.'/../../vendor/autoload.php';
/** @var Application $app */
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
// Browser tests exercise built assets even when a developer has Vite running.
Vite::useHotFile(sys_get_temp_dir().'/phlgadis-browser-no-hot-file');
$app->handleRequest(Request::capture());
