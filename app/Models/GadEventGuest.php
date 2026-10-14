<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A guest at a GAD event who has no PHLGADIS account, such as someone from
 * another agency (docs/event-registration.md). Staff add them and mark the
 * days they came; they get no Virtual ID, QR or notices. Their certificate
 * prints their name and organization, and staff hand it over.
 *
 * @property string $id
 * @property int $gad_event_id
 * @property string $name
 * @property string $organization Their agency or organization, printed as their affiliation.
 * @property string|null $position
 * @property string|null $sex One of RegistrationDetailsRules::SEXES.
 * @property int|null $added_by
 * @property CarbonImmutable $created_at
 */
#[Fillable(['gad_event_id', 'name', 'organization', 'position', 'sex', 'added_by'])]
class GadEventGuest extends Model
{
    use HasUlids;

    /** @return BelongsTo<GadEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(GadEvent::class, 'gad_event_id');
    }

    /**
     * The Philippine days they came, one row each.
     *
     * @return HasMany<GadEventGuestDay, $this>
     */
    public function days(): HasMany
    {
        return $this->hasMany(GadEventGuestDay::class);
    }

    /** @return HasMany<Certificate, $this> */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'gad_event_guest_id');
    }

    /** How their certificate names where they are from: "Position, Organization". */
    public function affiliation(): string
    {
        return $this->position !== null && $this->position !== '' ? "{$this->position}, {$this->organization}" : $this->organization;
    }
}
