<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use League\Flysystem\FilesystemException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Mime\MimeTypes;

/**
 * Streams a public upload from the bucket under this site's own address
 * (PublicUpload::url), so browsers never need the bucket's. One request to
 * the bucket per photo: its type comes from its name, which the upload set,
 * rather than asking the bucket again for its type and size.
 */
class PublicUploadController extends Controller
{
    public function __invoke(string $path): StreamedResponse
    {
        abort_if(str_contains($path, '..'), 404);

        try {
            $stream = Storage::disk('public')->readStream($path);
        } catch (FilesystemException) {
            $stream = null;
        }

        abort_if(! is_resource($stream), 404);

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => MimeTypes::getDefault()->getMimeTypes(pathinfo($path, PATHINFO_EXTENSION))[0] ?? 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            // Every upload gets a new random name, so a kept copy never goes stale.
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
