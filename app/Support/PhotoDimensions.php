<?php

namespace App\Support;

/**
 * A photo's size as people see it. Phones often save a portrait photo as
 * landscape pixels plus an EXIF "Orientation" tag that browsers apply, so
 * that tag decides whether width and height swap. The tag is read here
 * directly, because not every server has PHP's exif extension.
 */
class PhotoDimensions
{
    /**
     * @return array{width: int, height: int}|null null when the file is not a readable image
     */
    public static function of(string $path): ?array
    {
        $size = getimagesize($path);

        if ($size === false || $size[0] < 1 || $size[1] < 1) {
            return null;
        }

        // Orientations 5 to 8 turn the picture a quarter turn.
        return self::orientation($path) >= 5
            ? ['width' => $size[1], 'height' => $size[0]]
            : ['width' => $size[0], 'height' => $size[1]];
    }

    /** A JPEG's EXIF orientation, 1 to 8; 1 (upright) when it has none. */
    public static function orientation(string $path): int
    {
        // The Exif block (at most 64 KB) comes before the image data.
        $bytes = file_get_contents($path, false, null, 0, 131072);

        if ($bytes === false || ! str_starts_with($bytes, "\xFF\xD8")) {
            return 1;
        }

        $offset = 2;

        while ($offset + 4 <= strlen($bytes) && $bytes[$offset] === "\xFF") {
            $marker = ord($bytes[$offset + 1]);
            $length = self::number('n', $bytes, $offset + 2);

            if ($marker === 0xDA || $length < 2) {
                break; // The image data starts; no metadata follows.
            }

            if ($marker === 0xE1 && substr($bytes, $offset + 4, 6) === "Exif\0\0") {
                return self::tiffOrientation(substr($bytes, $offset + 10, $length - 8));
            }

            $offset += 2 + $length;
        }

        return 1;
    }

    /** The Orientation tag (0x0112) in the first IFD of an Exif TIFF block. */
    private static function tiffOrientation(string $tiff): int
    {
        [$short, $long] = match (substr($tiff, 0, 2)) {
            'II' => ['v', 'V'],
            'MM' => ['n', 'N'],
            default => [null, null],
        };

        if ($short === null || strlen($tiff) < 8) {
            return 1;
        }

        $directory = self::number($long, $tiff, 4);

        if ($directory + 2 > strlen($tiff)) {
            return 1;
        }

        $entries = self::number($short, $tiff, $directory);

        for ($index = 0; $index < $entries; $index++) {
            $entry = $directory + 2 + $index * 12;

            if ($entry + 12 > strlen($tiff)) {
                break;
            }

            if (self::number($short, $tiff, $entry) === 0x0112) {
                $orientation = self::number($short, $tiff, $entry + 8);

                return $orientation >= 1 && $orientation <= 8 ? $orientation : 1;
            }
        }

        return 1;
    }

    /** One unsigned number at $offset; callers check the bytes are there. */
    private static function number(string $format, string $bytes, int $offset): int
    {
        $value = unpack($format, $bytes, $offset);

        return $value === false ? 0 : (int) $value[1];
    }
}
