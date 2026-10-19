<?php

namespace App\Support;

use GdImage;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * A post photo's smaller copy for the feed's tiles, kept beside it on the
 * public disk (`posts/thumbs/`). A photo already this small, an unreadable
 * one, or a server without PHP's GD extension gets none, and the feed shows
 * the photo itself: a thumbnail never stops a post.
 */
final class PhotoThumbnail
{
    /** Enough for the widest tile on a sharp phone screen. */
    public const LONGEST_SIDE = 1280;

    private const QUALITY = 80;

    /**
     * Makes and stores the thumbnail of a photo read from a local file, such
     * as the upload itself.
     *
     * @return string|null the thumbnail's path on the public disk
     */
    public static function fromFile(string $file, string $photoPath): ?string
    {
        if (! extension_loaded('gd')) {
            return null;
        }

        try {
            $image = self::upright($file);
            if ($image === null) {
                return null;
            }

            $width = imagesx($image);
            $height = imagesy($image);
            $scale = self::LONGEST_SIDE / max($width, $height);
            if ($scale >= 1) {
                return null;
            }

            $thumbnail = self::resized($image, max(1, (int) round($width * $scale)), max(1, (int) round($height * $scale)));
            [$bytes, $extension] = self::encoded($thumbnail);
            $path = dirname($photoPath).'/thumbs/'.pathinfo($photoPath, PATHINFO_FILENAME).'.'.$extension;

            return Storage::disk('public')->put($path, $bytes) ? $path : null;
        } catch (Throwable $exception) {
            report($exception);

            return null;
        }
    }

    /**
     * Makes and stores the thumbnail of a photo already on the public disk,
     * for photos posted before thumbnails were made.
     *
     * @return string|null the thumbnail's path on the public disk
     */
    public static function fromStored(string $photoPath): ?string
    {
        $bytes = Storage::disk('public')->get($photoPath);
        if ($bytes === null) {
            return null;
        }

        $file = (string) tempnam(sys_get_temp_dir(), 'photo');

        try {
            file_put_contents($file, $bytes);

            return self::fromFile($file, $photoPath);
        } finally {
            @unlink($file);
        }
    }

    /** The photo turned as its EXIF orientation says, as browsers show it. */
    private static function upright(string $file): ?GdImage
    {
        $bytes = file_get_contents($file);
        $image = $bytes === false || $bytes === '' ? false : @imagecreatefromstring($bytes);
        if ($image === false) {
            return null;
        }

        // GD turns counter-clockwise. 2, 4, 5 and 7 are also mirrored.
        $orientation = PhotoDimensions::orientation($file);
        $turn = match ($orientation) {
            3, 4 => 180,
            5, 6 => 270,
            7, 8 => 90,
            default => 0,
        };
        if ($turn !== 0) {
            $image = imagerotate($image, $turn, 0) ?: $image;
        }
        if (in_array($orientation, [2, 4, 5, 7], true)) {
            imageflip($image, IMG_FLIP_HORIZONTAL);
        }

        return $image;
    }

    /**
     * @param  int<1, max>  $width
     * @param  int<1, max>  $height
     */
    private static function resized(GdImage $image, int $width, int $height): GdImage
    {
        $thumbnail = imagecreatetruecolor($width, $height);
        // See-through parts of a PNG stay see-through in WebP.
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);
        imagefill($thumbnail, 0, 0, (int) imagecolorallocatealpha($thumbnail, 255, 255, 255, 127));
        imagecopyresampled($thumbnail, $image, 0, 0, 0, 0, $width, $height, imagesx($image), imagesy($image));

        return $thumbnail;
    }

    /**
     * WebP where GD can write it; otherwise JPEG, on white.
     *
     * @return array{0: string, 1: string} the bytes and their file extension
     */
    private static function encoded(GdImage $thumbnail): array
    {
        if (function_exists('imagewebp') && (imagetypes() & IMG_WEBP)) {
            return [self::captured(fn () => imagewebp($thumbnail, null, self::QUALITY)), 'webp'];
        }

        $flat = imagecreatetruecolor(imagesx($thumbnail), imagesy($thumbnail));
        imagefill($flat, 0, 0, (int) imagecolorallocate($flat, 255, 255, 255));
        imagecopy($flat, $thumbnail, 0, 0, 0, 0, imagesx($thumbnail), imagesy($thumbnail));

        return [self::captured(fn () => imagejpeg($flat, null, self::QUALITY)), 'jpg'];
    }

    /** What GD writes to the output, as a string. */
    private static function captured(callable $write): string
    {
        ob_start();

        try {
            $write();

            return (string) ob_get_contents();
        } finally {
            ob_end_clean();
        }
    }
}
