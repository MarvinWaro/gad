<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * The browser address of a public upload (profile photos, post photos,
 * carousel slides, badges). A private bucket can't be read by browsers, so
 * with no SPACES_URL the app hands those files out itself
 * (PublicUploadController).
 */
final class PublicUpload
{
    public static function url(string $path): string
    {
        return config('filesystems.public_through_app')
            ? route('public-uploads.show', ['path' => $path])
            : Storage::disk('public')->url($path);
    }
}
