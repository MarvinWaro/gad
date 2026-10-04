<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One answer a question offers. Exactly one of a question's choices is
 * correct; players learn which only after they answer.
 *
 * @property int $id
 * @property int $quest_question_id
 * @property int $position
 * @property string $label
 * @property bool $is_correct
 */
#[Fillable(['quest_question_id', 'position', 'label', 'is_correct'])]
class QuestChoice extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_correct' => 'boolean',
        ];
    }

    /** @return BelongsTo<QuestQuestion, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(QuestQuestion::class, 'quest_question_id');
    }
}
