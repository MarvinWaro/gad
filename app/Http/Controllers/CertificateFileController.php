<?php

namespace App\Http\Controllers;

use App\Support\CertificateFiles;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A signature or logo from the private `certificates` disk, through the
 * signed, short-lived link a certificate's data or the design editor gave
 * (CertificateFiles::url). From this site, so the browser's PDF maker can
 * read it. A file that is gone, or a storage that can't be reached (such as
 * a removed bucket), is a 404, so the page says what is missing; the
 * storage error is still logged.
 */
class CertificateFileController extends Controller
{
    public function show(string $folder, string $file): StreamedResponse
    {
        $path = "{$folder}/{$file}";
        $disk = Storage::disk(CertificateFiles::DISK);

        abort_unless(in_array($folder, CertificateFiles::FOLDERS, true) && rescue(fn (): bool => $disk->exists($path), false), 404);

        return $disk->response($path, null, [
            'Cache-Control' => 'private, max-age=7200',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
