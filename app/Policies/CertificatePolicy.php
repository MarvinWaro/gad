<?php

namespace App\Policies;

use App\Models\Certificate;
use App\Models\User;

/**
 * Who may download a certificate: the person it was given to, until it is
 * withdrawn, and the staff who release it, to print it on request.
 */
class CertificatePolicy
{
    public function download(User $user, Certificate $certificate): bool
    {
        if ($certificate->user_id === $user->id) {
            return ! $certificate->isWithdrawn();
        }

        $release = $certificate->eventCertificate;

        return $release !== null && $user->can('release', $release);
    }
}
