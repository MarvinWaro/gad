<?php

namespace App\Support;

use App\Models\User;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Encoder\Encoder;

/**
 * The Virtual ID's participant code, such as "GAD-7K2M-Q9XA" (docs/virtual-id.md).
 * It is random, never the account's number or its public ULID, so no one can
 * make another person's QR from what they can see of them.
 */
final class ParticipantCode
{
    /** Crockford's base32: no I, L, O or U, which read like 1, 0 and V. */
    public const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    /** Eight random characters: 40 bits, about 1.1 trillion codes. */
    public static function generate(): string
    {
        $characters = '';
        for ($index = 0; $index < 8; $index++) {
            $characters .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return 'GAD-'.substr($characters, 0, 4).'-'.substr($characters, 4);
    }

    /** A code no account holds yet. */
    public static function unique(): string
    {
        do {
            $code = self::generate();
        } while (User::query()->where('participant_code', $code)->exists());

        return $code;
    }

    /**
     * The code's QR modules, one string of 0s and 1s per row, for the card to
     * draw: the code alone, so it encodes in alphanumeric mode at the
     * smallest size (version 1, 21 × 21) even with error correction Q, which
     * reads through 25% glare or damage. The card adds the four-module quiet
     * zone, black on white, and no logo inside, for any camera.
     *
     * @return list<string>
     */
    public static function qrRows(string $code): array
    {
        $matrix = Encoder::encode($code, ErrorCorrectionLevel::Q(), Encoder::DEFAULT_BYTE_MODE_ENCODING)->getMatrix();
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
