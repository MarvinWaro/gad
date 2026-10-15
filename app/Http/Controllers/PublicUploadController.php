<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Streams a public upload from the bucket under this site's own address
 * (PublicUpload::url), so browsers never need the bucket's.
 */
class PublicUploadController extends Controller
{
    public function __invoke(string $path): StreamedResponse
    {
        $disk = Storage::disk('public');

        abort_if(str_contains($path, '..') || ! $disk->exists($path), 404);

        return $disk->response($path, null, [
            // Every upload gets a new random name, so a kept copy never goes stale.
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
