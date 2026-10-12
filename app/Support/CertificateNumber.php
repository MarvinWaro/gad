<?php

namespace App\Support;

use App\Models\Certificate;

/**
 * A certificate's number, such as "CERT-7K2M-Q9XA", printed on it and in its
 * QR for the public verify page (docs/certificates.md). Random, in the
 * participant code's alphabet, so numbers can't be guessed one after another.
 */
final class CertificateNumber
{
    public const PREFIX = 'CERT';

    /** Eight random characters: 40 bits, about 1.1 trillion numbers. */
    public static function generate(): string
    {
        $characters = '';
        for ($index = 0; $index < 8; $index++) {
            $characters .= ParticipantCode::ALPHABET[random_int(0, strlen(ParticipantCode::ALPHABET) - 1)];
        }

        return self::format($characters);
    }

    /**
     * A number as someone typed it, written the one way certificates hold
     * it, or null when it can't be one. Case, spaces, dashes and the "CERT"
     * prefix don't matter, and I and L are 1 and O is 0, as on the Virtual ID.
     */
    public static function parse(string $text): ?string
    {
        $characters = strtr(
            strtoupper((string) preg_replace('/[\s-]+/', '', $text)),
            ['I' => '1', 'L' => '1', 'O' => '0'],
        );

        if (strlen($characters) === 12 && str_starts_with($characters, self::PREFIX)) {
            $characters = substr($characters, 4);
        }

        if (preg_match('/^['.ParticipantCode::ALPHABET.']{8}$/', $characters) !== 1) {
            return null;
        }

        return self::format($characters);
    }

    /** A number no certificate holds yet. */
    public static function unique(): string
    {
        do {
            $number = self::generate();
        } while (Certificate::query()->where('number', $number)->exists());

        return $number;
    }

    private static function format(string $characters): string
    {
        return self::PREFIX.'-'.substr($characters, 0, 4).'-'.substr($characters, 4);
    }
}
