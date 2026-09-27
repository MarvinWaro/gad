<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A choice for a follow-up question. `value` never changes once saved; a
 * choice removed after it was picked is retired rather than deleted, so the
 * answers keep their label.
 *
 * @property int $id
 * @property int $question_id
 * @property string $value
 * @property string $label
 * @property bool $requires_text Asks the respondent to specify, like "Others".
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable(['question_id', 'value', 'label', 'requires_text', 'sort_order', 'is_active'])]
class SurveyGroupOption extends Model
{
    protected function casts(): array
    {
        return [
            'requires_text' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<SurveyGroupQuestion, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(SurveyGroupQuestion::class, 'question_id');
    }

    /** @return HasMany<SurveyGroupAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(SurveyGroupAnswer::class, 'option_id');
    }
}
