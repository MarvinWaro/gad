<?php

namespace App\Models;

use App\Models\Concerns\BelongsToRegion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Someone who signs event certificates, with the e-signature their office
 * uploaded with their consent (docs/certificates.md). Removed, they stay
 * for the released certificates that print them; the file is kept on the
 * private `certificates` disk and only ever sent through signed links.
 *
 * @property string $id
 * @property int|null $survey_region_id Null: the Central Office's.
 * @property string $name
 * @property string $position
 * @property string $signature_path On the `certificates` disk.
 * @property int|null $created_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property CarbonImmutable|null $deleted_at
 */
#[Fillable(['survey_region_id', 'name', 'position', 'signature_path', 'created_by'])]
class CertificateSignatory extends Model
{
    use BelongsToRegion, HasUlids, SoftDeletes;

    /** Signature and logo files, as the activity log never shows them. */
    protected $hidden = ['signature_path'];

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** @return BelongsToMany<CertificateDesign, $this> */
    public function designs(): BelongsToMany
    {
        return $this->belongsToMany(CertificateDesign::class, 'certificate_design_signatory')->withPivot('position');
    }
}
