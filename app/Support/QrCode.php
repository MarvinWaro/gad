<?php

namespace App\Support;

use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Encoder\Encoder;

/**
 * A QR code's modules, one string of 0s and 1s per row (1 is dark), for the
 * browser to draw crisply at the size it needs: the Virtual ID in whole
 * pixels, a certificate's verify QR as one vector path. The quiet zone is
 * the drawing's to add. The app's one QR encoder.
 */
final class QrCode
{
    /** @return list<string> */
    public static function rows(string $text, ErrorCorrectionLevel $level): array
    {
        $matrix = Encoder::encode($text, $level, Encoder::DEFAULT_BYTE_MODE_ENCODING)->getMatrix();
        $rows = [];
        for ($y = 0; $y < $matrix->getHeight(); $y++) {
            $row = '';
            for ($x = 0; $x < $matrix->getWidth(); $x++) {
                $row .= $matrix->get($x, $y) === 1 ? '1' : '0';
            }
            $rows[] = $row;
        }

        return $rows;
    }
}
