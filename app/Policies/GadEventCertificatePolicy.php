<?php

namespace App\Policies;

use App\Models\GadEventCertificate;
use App\Models\User;

/**
 * Who may release an event's certificate, update it, withdraw one, or take
 * the design off the event: staff of the office whose event it is, never at
 * a deadline, which nobody attends (docs/certificates.md).
 */
class GadEventCertificatePolicy
{
    public function release(User $user, GadEventCertificate $certificate): bool
    {
        $event = $certificate->event;

        return $event !== null
            && $user->hasPermissionTo('certificates.release')
            && $event->category !== 'deadline'
            && $user->reachesRegion($event->survey_region_id);
    }
}
