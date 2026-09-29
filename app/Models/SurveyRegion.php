<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property bool $is_active
 * @property string|null $office_city
 * @property string|null $office_address
 * @property string|null $office_email
 * @property string|null $office_website
 * @property string|null $office_phone
 */
#[Fillable(['name', 'is_active', 'office_city', 'office_address', 'office_email', 'office_website', 'office_phone'])]
class SurveyRegion extends Model
{
    /** Letterhead details a regional office keeps up to date. */
    public const OFFICE_FIELDS = ['office_city', 'office_address', 'office_email', 'office_website', 'office_phone'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    /** @return HasMany<SurveyCluster, $this> */
    public function clusters(): HasMany
    {
        return $this->hasMany(SurveyCluster::class);
    }
}
