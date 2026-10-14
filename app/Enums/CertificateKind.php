<?php

namespace App\Enums;

/**
 * The certificates PHLGADIS gives the people checked in to a GAD event
 * (docs/certificates.md). Speakers' certificates are made by the office
 * itself. The codes are stored and sent as they are; never reuse one.
 */
enum CertificateKind: string
{
    case Participation = 'participation';
    case Appearance = 'appearance';

    /** As the certificate's title prints it. */
    public function title(): string
    {
        return match ($this) {
            self::Participation => 'Certificate of Participation',
            self::Appearance => 'Certificate of Appearance',
        };
    }

    /** The kind a pair is made of with this one (CertificateDesign::partner). */
    public function other(): self
    {
        return match ($this) {
            self::Participation => self::Appearance,
            self::Appearance => self::Participation,
        };
    }

    /** The line between the title and the person's name. */
    public function lead(): string
    {
        return match ($this) {
            self::Participation => 'is presented to',
            self::Appearance => 'This is to certify that',
        };
    }

    /** The wording a new design starts with, after the name and affiliation. */
    public function defaultBody(): string
    {
        return match ($this) {
            self::Participation => 'for participating in the {event} held on {dates}. Given this {released} at {venue}.',
            self::Appearance => 'appeared at the {event} on {days} at {venue}. This certification is issued upon request for whatever legal purpose it may serve.',
        };
    }
}
