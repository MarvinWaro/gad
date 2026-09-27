<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A follow-up question a respondent group asks once chosen, e.g. Civilian →
 * "Occupation". `key` never changes once saved; a question removed after it
 * was answered is retired (`is_active` false) rather than deleted.
 *
 * @property int $id
 * @property int $survey_respondent_group_id
 * @property string $key
 * @property string $label
 * @property string $type "select" or "radio"
 * @property bool $required
 * @property int $sort_order
 * @property bool $is_active
 */
#[Fillable(['survey_respondent_group_id', 'key', 'label', 'type', 'required', 'sort_order', 'is_active'])]
class SurveyGroupQuestion extends Model
{
    protected function casts(): array
    {
        return [
            'required' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<SurveyRespondentGroup, $this> */
    public function group(): BelongsTo
    {
        return $this->belongsTo(SurveyRespondentGroup::class, 'survey_respondent_group_id');
    }

    /**
     * Every choice, retired ones included.
     *
     * @return HasMany<SurveyGroupOption, $this>
     */
    public function options(): HasMany
    {
        return $this->hasMany(SurveyGroupOption::class, 'question_id')->orderBy('sort_order');
    }

    /**
     * The choices respondents can pick, in order.
     *
     * @return HasMany<SurveyGroupOption, $this>
     */
    public function activeOptions(): HasMany
    {
        return $this->options()->where('is_active', true);
    }

    /** @return HasMany<SurveyGroupAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(SurveyGroupAnswer::class, 'question_id');
    }
}
