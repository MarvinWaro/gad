<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A day a guest came to an event, as staff marked it
 * (ManageEventGuest::update).
 *
 * @property int $id
 * @property string $gad_event_guest_id
 * @property string $attended_on The Philippine day, Y-m-d, kept as text like a check-in's.
 * @property int|null $marked_by
 * @property CarbonImmutable $created_at
 */
#[Fillable(['gad_event_guest_id', 'attended_on', 'marked_by'])]
class GadEventGuestDay extends Model
{
    /** Marked once; unmarking removes it. */
    public const UPDATED_AT = null;

    /** @return BelongsTo<GadEventGuest, $this> */
    public function guest(): BelongsTo
    {
        return $this->belongsTo(GadEventGuest::class, 'gad_event_guest_id');
    }
}
