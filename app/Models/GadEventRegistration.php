<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Someone who joined a GAD event before it, or whom staff added to it
 * (docs/event-registration.md). Only they can be checked in to it and given
 * its certificates. The place is where they belonged when they joined.
 *
 * @property string $id
 * @property int $gad_event_id
 * @property int $user_id
 * @property CarbonImmutable $joined_at
 * @property int|null $survey_region_id
 * @property int|null $survey_hei_id
 * @property int|null $added_by The staff member who added them; null when they joined themselves.
 */
#[Fillable(['gad_event_id', 'user_id', 'survey_region_id', 'survey_hei_id', 'added_by'])]
class GadEventRegistration extends Model
{
    use HasUlids;

    /** Joining is its creation; it is never edited, only left or removed. */
    public const CREATED_AT = 'joined_at';

    public const UPDATED_AT = null;

    /** @return BelongsTo<GadEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(GadEvent::class, 'gad_event_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'added_by' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function adder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'added_by');
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
}
