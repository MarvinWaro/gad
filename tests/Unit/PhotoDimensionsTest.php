<?php

use App\Support\PhotoDimensions;

test('a photo turned a quarter by its Exif tag reports its upright size', function (int $orientation, bool $bigEndian) {
    $path = exifJpeg(1200, 800, $orientation, $bigEndian);

    expect(PhotoDimensions::orientation($path))->toBe($orientation)
        ->and(PhotoDimensions::of($path))->toBe(['width' => 800, 'height' => 1200]);

    unlink($path);
})->with([
    'rotated right, Motorola byte order' => [6, true],
    'rotated left, Intel byte order' => [8, false],
    'mirrored and turned' => [5, true],
]);

test('a photo whose Exif tag does not turn it keeps its size', function (int $orientation) {
    $path = exifJpeg(1200, 800, $orientation);

    expect(PhotoDimensions::of($path))->toBe(['width' => 1200, 'height' => 800]);

    unlink($path);
})->with([1, 2, 3, 4]);

test('photos without an Exif tag keep their size', function () {
    $path = (string) tempnam(sys_get_temp_dir(), 'photo-');
    imagepng(imagecreatetruecolor(300, 500), $path);

    expect(PhotoDimensions::orientation($path))->toBe(1)
        ->and(PhotoDimensions::of($path))->toBe(['width' => 300, 'height' => 500]);

    unlink($path);
});
