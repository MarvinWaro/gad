<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One answer to a respondent group's follow-up question: the chosen choice,
 * and what the respondent typed when that choice asks them to specify.
 *
 * @property int $id
 * @property string $survey_response_id
 * @property int $question_id
 * @property int $option_id
 * @property string|null $text
 */
#[Fillable(['survey_response_id', 'question_id', 'option_id', 'text'])]
class SurveyGroupAnswer extends Model
{
    /** Written once with its response, which carries the timestamps. */
    public $timestamps = false;

    /** @return BelongsTo<SurveyResponse, $this> */
    public function response(): BelongsTo
    {
        return $this->belongsTo(SurveyResponse::class, 'survey_response_id');
    }

    /** @return BelongsTo<SurveyGroupQuestion, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(SurveyGroupQuestion::class, 'question_id');
    }

    /** @return BelongsTo<SurveyGroupOption, $this> */
    public function option(): BelongsTo
    {
        return $this->belongsTo(SurveyGroupOption::class, 'option_id');
    }
}
