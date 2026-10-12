<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A certificate given to someone checked in to a GAD event, when its office
 * released the event's certificate (docs/certificates.md). Its random number
 * opens the public verify page. The name, affiliation and place are as they
 * were when it was given; staff withdraw one given by mistake.
 *
 * @property string $id
 * @property string $gad_event_certificate_id
 * @property int $user_id
 * @property string $number Such as "CERT-7K2M-Q9XA".
 * @property string $name
 * @property string|null $affiliation
 * @property int|null $survey_region_id
 * @property int|null $survey_hei_id
 * @property CarbonImmutable $issued_at
 * @property CarbonImmutable|null $withdrawn_at
 * @property int|null $withdrawn_by
 */
#[Fillable(['gad_event_certificate_id', 'user_id', 'number', 'name', 'affiliation', 'survey_region_id', 'survey_hei_id', 'withdrawn_at', 'withdrawn_by'])]
class Certificate extends Model
{
    use HasUlids;

    /** Given once; only withdrawn, restored, or renamed by an update. */
    public const CREATED_AT = 'issued_at';

    public const UPDATED_AT = null;

    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
            'withdrawn_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<GadEventCertificate, $this> */
    public function eventCertificate(): BelongsTo
    {
        return $this->belongsTo(GadEventCertificate::class, 'gad_event_certificate_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** @return BelongsTo<SurveyHei, $this> */
    public function hei(): BelongsTo
    {
        return $this->belongsTo(SurveyHei::class, 'survey_hei_id');
    }

    /** @return BelongsTo<User, $this> */
    public function withdrawer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'withdrawn_by');
    }

    public function isWithdrawn(): bool
    {
        return $this->withdrawn_at !== null;
    }

    /**
     * The name as every certificate prints it: in capitals, so they all look
     * alike whatever case the account was written in. The one place this
     * rule lives.
     */
    public static function printedName(string $name): string
    {
        return mb_strtoupper(trim($name));
    }
}
