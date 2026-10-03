<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A year HEIs report on, such as 2026-2027.
 *
 * @property string $id
 * @property int $start_year
 * @property string $label
 * @property bool $is_active
 */
#[Fillable(['start_year', 'label', 'is_active'])]
class AcademicYear extends Model
{
    use HasUlids;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['start_year' => 'integer', 'is_active' => 'boolean'];
    }

    /** @return HasMany<StudentCount, $this> */
    public function studentCounts(): HasMany
    {
        return $this->hasMany(StudentCount::class);
    }
}
