<?php

namespace App\Policies;

use App\Models\CertificateSignatory;
use App\Models\User;

/**
 * Who may keep a certificate signatory and their e-signature: staff of the
 * office it belongs to, a region's or the Central Office's
 * (docs/certificates.md).
 */
class CertificateSignatoryPolicy
{
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('certificates.create') && $user->hasOffice();
    }

    public function view(User $user, CertificateSignatory $signatory): bool
    {
        return $user->hasPermissionTo('certificates.view') && $user->reachesRegion($signatory->survey_region_id);
    }

    public function update(User $user, CertificateSignatory $signatory): bool
    {
        return $user->hasPermissionTo('certificates.update') && $user->reachesRegion($signatory->survey_region_id);
    }

    public function delete(User $user, CertificateSignatory $signatory): bool
    {
        return $user->hasPermissionTo('certificates.delete') && $user->reachesRegion($signatory->survey_region_id);
    }
}
