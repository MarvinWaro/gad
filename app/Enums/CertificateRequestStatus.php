<?php

namespace App\Enums;

/**
 * Where a request for a certificate stands (docs/certificates.md): waiting
 * for the event's office, approved (the certificate is given), or declined
 * with a note. Sent as these codes.
 */
enum CertificateRequestStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Declined = 'declined';
}
