<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One question of a quest, with its choices and the explanation a player
 * sees once they have answered.
 *
 * @property int $id
 * @property string $quest_id
 * @property int $position
 * @property string $prompt
 * @property string $explanation
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['quest_id', 'position', 'prompt', 'explanation'])]
class QuestQuestion extends Model
{
    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    /** @return BelongsTo<Quest, $this> */
    public function quest(): BelongsTo
    {
        return $this->belongsTo(Quest::class);
    }

    /** @return HasMany<QuestChoice, $this> */
    public function choices(): HasMany
    {
        return $this->hasMany(QuestChoice::class)->orderBy('position');
    }
}
