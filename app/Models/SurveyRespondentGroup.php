<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $value
 * @property string $label
 * @property bool $requires_text
 * @property bool $is_active
 * @property int $sort_order
 */
#[Fillable(['value', 'label', 'requires_text', 'is_active', 'sort_order'])]
class SurveyRespondentGroup extends Model
{
    protected function casts(): array
    {
        return [
            'requires_text' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /** @param Builder<self> $query */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('label');
    }

    /**
     * The groups a respondent may choose from, in the order they are shown.
     *
     * @return Collection<int, self>
     */
    public static function active(): Collection
    {
        return self::query()->where('is_active', true)->ordered()->get();
    }
}
