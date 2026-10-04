<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The choice a player picked for one question in one attempt. Whether it
 * was right comes from the choice, so it is never stored twice.
 *
 * @property int $id
 * @property string $quest_attempt_id
 * @property int $quest_question_id
 * @property int $quest_choice_id
 * @property CarbonImmutable|null $created_at
 */
#[Fillable(['quest_attempt_id', 'quest_question_id', 'quest_choice_id'])]
class QuestAnswer extends Model
{
    public const UPDATED_AT = null;

    /** @return BelongsTo<QuestAttempt, $this> */
    public function attempt(): BelongsTo
    {
        return $this->belongsTo(QuestAttempt::class, 'quest_attempt_id');
    }

    /** @return BelongsTo<QuestQuestion, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(QuestQuestion::class, 'quest_question_id');
    }

    /** @return BelongsTo<QuestChoice, $this> */
    public function choice(): BelongsTo
    {
        return $this->belongsTo(QuestChoice::class, 'quest_choice_id');
    }
}
