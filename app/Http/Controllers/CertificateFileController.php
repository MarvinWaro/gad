<?php

namespace App\Http\Controllers;

use App\Support\CertificateFiles;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A signature or logo from the private `certificates` disk, through the
 * signed, short-lived link a certificate's data or the design editor gave
 * (CertificateFiles::url). From this site, so the browser's PDF maker can
 * read it.
 */
class CertificateFileController extends Controller
{
    public function show(string $folder, string $file): StreamedResponse
    {
        $path = "{$folder}/{$file}";
        $disk = Storage::disk(CertificateFiles::DISK);

        abort_unless(in_array($folder, CertificateFiles::FOLDERS, true) && $disk->exists($path), 404);

        return $disk->response($path, null, [
            'Cache-Control' => 'private, max-age=7200',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
