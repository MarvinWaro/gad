<?php

namespace App\Models;

use App\Enums\CertificateKind;
use App\Models\Concerns\BelongsToRegion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * A certificate's design, for an office to use on its GAD events
 * (docs/certificates.md): its kind, one of the fixed backgrounds, the wording
 * with its blanks, extra logos, and one to three signatories in the order
 * they sign. The CHED seal and Bagong Pilipinas are always printed.
 *
 * @property string $id
 * @property int|null $survey_region_id Null: the Central Office's, for every-region events.
 * @property CertificateKind $kind
 * @property string|null $paired_with_id The design of the other kind it was made from: the two go on events and out together.
 * @property string $name The office's own label for it.
 * @property string $background One of BACKGROUNDS.
 * @property string $body The wording, with blanks such as {event}.
 * @property list<string> $logo_paths On the `certificates` disk.
 * @property int|null $created_by
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['survey_region_id', 'kind', 'paired_with_id', 'name', 'background', 'body', 'logo_paths', 'created_by'])]
class CertificateDesign extends Model
{
    use BelongsToRegion, HasUlids;

    /** The fixed backgrounds, drawn in lib/certificate-backgrounds.ts. */
    public const BACKGROUNDS = ['frame', 'flow', 'band'];

    /** What the wording may leave blank, filled in for each person. */
    public const BLANKS = ['event', 'dates', 'days', 'venue', 'released'];

    public const MAX_LOGOS = 3;

    public const MAX_SIGNATORIES = 3;

    /** Files, as the activity log never shows them. */
    protected $hidden = ['logo_paths'];

    protected function casts(): array
    {
        return [
            'kind' => CertificateKind::class,
            'logo_paths' => 'array',
        ];
    }

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /**
     * In the order they sign, left to right.
     *
     * @return BelongsToMany<CertificateSignatory, $this>
     */
    public function signatories(): BelongsToMany
    {
        return $this->belongsToMany(CertificateSignatory::class, 'certificate_design_signatory')
            ->withPivot('position')
            ->orderByPivot('position');
    }

    /** @return HasMany<GadEventCertificate, $this> */
    public function uses(): HasMany
    {
        return $this->hasMany(GadEventCertificate::class);
    }

    /**
     * The design it was made from, of the other kind.
     *
     * @return BelongsTo<CertificateDesign, $this>
     */
    public function pairedWith(): BelongsTo
    {
        return $this->belongsTo(self::class, 'paired_with_id');
    }

    /**
     * The design of the other kind made from it.
     *
     * @return HasOne<CertificateDesign, $this>
     */
    public function pairedBy(): HasOne
    {
        return $this->hasOne(self::class, 'paired_with_id');
    }

    /**
     * Its pair, of the other kind, whichever was made from which: the two
     * go on events and out together (docs/certificates.md).
     */
    public function partner(): ?self
    {
        return $this->pairedWith ?? $this->pairedBy;
    }

    /**
     * The blanks the wording uses, such as ['event', 'venue'].
     *
     * @return list<string>
     */
    public static function blanksIn(string $body): array
    {
        preg_match_all('/\{([^{}]*)\}/', $body, $matches);

        return array_values(array_unique($matches[1]));
    }
}
