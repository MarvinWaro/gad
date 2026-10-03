<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * @property int $id
 * @property string|null $code PSGC code from HEIDA, which the directory sync matches on
 * @property string $name
 * @property bool $is_active
 * @property string|null $office_city
 * @property string|null $office_address
 * @property string|null $office_email
 * @property string|null $office_website
 * @property string|null $office_phone
 * @property bool $instant_registration
 * @property CarbonImmutable|null $instant_registration_until
 */
#[Fillable(['code', 'name', 'is_active', 'office_city', 'office_address', 'office_email', 'office_website', 'office_phone', 'instant_registration', 'instant_registration_until'])]
class SurveyRegion extends Model
{
    /** Letterhead details a regional office keeps up to date. */
    public const OFFICE_FIELDS = ['office_city', 'office_address', 'office_email', 'office_website', 'office_phone'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'instant_registration' => 'boolean',
            'instant_registration_until' => 'immutable_datetime',
        ];
    }

    /** @return HasMany<SurveyCluster, $this> */
    public function clusters(): HasMany
    {
        return $this->hasMany(SurveyCluster::class);
    }

    /**
     * Its institutions, through the clusters that link them to it.
     *
     * @return HasManyThrough<SurveyHei, SurveyCluster, $this>
     */
    public function heis(): HasManyThrough
    {
        return $this->hasManyThrough(SurveyHei::class, SurveyCluster::class);
    }

    /**
     * Regions letting new HEI accounts in without approval: switched on, and
     * either open-ended or not yet past the closing time.
     *
     * @param  Builder<SurveyRegion>  $query
     */
    public function scopeOpenForInstantRegistration(Builder $query, ?CarbonInterface $at = null): void
    {
        $query->where('instant_registration', true)
            ->where(fn (Builder $query) => $query
                ->whereNull('instant_registration_until')
                ->orWhere('instant_registration_until', '>', $at ?? now()));
    }

    /** The same rule as the scope, for a region already loaded. */
    public function isOpenForInstantRegistration(?CarbonInterface $at = null): bool
    {
        return $this->instant_registration
            && ($this->instant_registration_until === null || $this->instant_registration_until->isAfter($at ?? now()));
    }
}
