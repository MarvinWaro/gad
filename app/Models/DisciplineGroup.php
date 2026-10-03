<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * One of CHED's discipline groups, such as "Engineering", which enrollment
 * and graduate counts are broken down by.
 *
 * @property int $id
 * @property string $name
 * @property int $sort_order
 */
#[Fillable(['name', 'sort_order'])]
class DisciplineGroup extends Model
{
    protected function casts(): array
    {
        return ['sort_order' => 'integer'];
    }

    /** @return HasMany<StudentCount, $this> */
    public function studentCounts(): HasMany
    {
        return $this->hasMany(StudentCount::class);
    }

    /**
     * A name reduced to its words, so "IT-RELATED" and "IT-Related", or
     * "Architectural & Town Planning" and "Architectural and Town-Planning",
     * are the same group.
     */
    public static function keyOf(string $name): string
    {
        return trim((string) preg_replace('/[^a-z0-9]+/', ' ', Str::lower(str_replace('&', ' and ', $name))));
    }
}
