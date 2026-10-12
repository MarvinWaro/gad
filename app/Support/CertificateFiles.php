<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\URL;

/**
 * Signatures and logos on the private `certificates` disk
 * (docs/certificates.md). Uploads are kept for good, as released
 * certificates point at them, and are only ever handed out through signed,
 * short-lived links from this site, which the browser's PDF maker can read.
 */
final class CertificateFiles
{
    public const DISK = 'certificates';

    public const FOLDERS = ['signatures', 'logos'];

    /** How long a link works: an editor left open keeps its preview. */
    private const LINK_MINUTES = 120;

    /** @param  'signatures'|'logos'  $folder */
    public static function store(UploadedFile $file, string $folder): string
    {
        return (string) $file->store($folder, self::DISK);
    }

    /** A signed link to the file, for whoever may see it now. */
    public static function url(string $path): string
    {
        [$folder, $file] = array_pad(explode('/', $path, 2), 2, '');

        return URL::temporarySignedRoute('certificate-files.show', now()->addMinutes(self::LINK_MINUTES), [
            'folder' => $folder,
            'file' => $file,
        ]);
    }

    /** The file's name, which the design editor uses to say which logos stay. */
    public static function key(string $path): string
    {
        return basename($path);
    }
}
