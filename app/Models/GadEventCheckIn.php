<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Someone checked in to a GAD event on one of its days, by a staff member
 * who scanned their Virtual ID, typed its code, or marked the day on the list
 * of who joined, as from the paper sheet (docs/event-check-in.md).
 * The place is where they belonged when checked in.
 *
 * @property string $id
 * @property int $gad_event_id
 * @property int $user_id
 * @property string $attended_on The Philippine day, Y-m-d. Kept as text, never cast: `createOrFirst` looks it up as written.
 * @property CarbonImmutable $checked_in_at
 * @property int|null $checked_in_by
 * @property string $method One of METHODS, or MANUAL.
 * @property int|null $survey_region_id
 * @property int|null $survey_hei_id
 */
#[Fillable(['gad_event_id', 'user_id', 'attended_on', 'checked_in_by', 'method', 'survey_region_id', 'survey_hei_id'])]
class GadEventCheckIn extends Model
{
    use HasUlids;

    /** How the code reached the scanner: its camera, or typed by hand. */
    public const METHODS = ['scan', 'typed'];

    /** A day staff marked on the list of who joined (ManageEventRegistration::setAttendance). */
    public const MANUAL = 'manual';

    /** The check-in's own time is its creation; it is never edited, only undone. */
    public const CREATED_AT = 'checked_in_at';

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

    /**
     * The staff member who checked them in.
     *
     * @return BelongsTo<User, $this>
     */
    public function checker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_in_by');
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
