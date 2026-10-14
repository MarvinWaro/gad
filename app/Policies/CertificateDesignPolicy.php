<?php

namespace App\Policies;

use App\Models\CertificateDesign;
use App\Models\User;

/**
 * Who may work on a certificate design: staff of the office it belongs to,
 * a region's or the Central Office's (docs/certificates.md). Using one on an
 * event is GadEventCertificatePolicy's.
 */
class CertificateDesignPolicy
{
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('certificates.create') && $user->hasOffice();
    }

    public function view(User $user, CertificateDesign $design): bool
    {
        return $user->hasPermissionTo('certificates.view') && $user->reachesRegion($design->survey_region_id);
    }

    public function update(User $user, CertificateDesign $design): bool
    {
        return $user->hasPermissionTo('certificates.update') && $user->reachesRegion($design->survey_region_id);
    }

    public function delete(User $user, CertificateDesign $design): bool
    {
        return $user->hasPermissionTo('certificates.delete') && $user->reachesRegion($design->survey_region_id);
    }

    /** Using it on one of its region's events. */
    public function use(User $user, CertificateDesign $design): bool
    {
        return $user->hasPermissionTo('certificates.release') && $user->reachesRegion($design->survey_region_id);
    }
}
