<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One play of a quest. It finishes with the last answer; the score is never
 * stored but counted from the answers (`withScore`). The place is where the
 * player was when they played.
 *
 * @property string $id
 * @property string $quest_id
 * @property int $user_id
 * @property int|null $survey_region_id
 * @property int|null $survey_hei_id
 * @property CarbonImmutable $started_at
 * @property CarbonImmutable|null $finished_at
 * @property int|null $score Correct answers, when loaded with `withScore`.
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['quest_id', 'user_id', 'survey_region_id', 'survey_hei_id', 'started_at', 'finished_at'])]
class QuestAttempt extends Model
{
    use HasUlids;

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Quest, $this> */
    public function quest(): BelongsTo
    {
        return $this->belongsTo(Quest::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** @return BelongsTo<SurveyHei, $this> */
    public function hei(): BelongsTo
    {
        return $this->belongsTo(SurveyHei::class, 'survey_hei_id');
    }

    /** @return HasMany<QuestAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(QuestAnswer::class);
    }

    public function isFinished(): bool
    {
        return $this->finished_at !== null;
    }

    /**
     * An opaque key for one of the quest's questions or choices in this
     * attempt. Choices reach the browser by this key, never by their id:
     * ids count up in the order the author wrote the choices, and authors
     * often write the right answer first. It is signed with the app key, so
     * neither the key nor the shuffled order it gives leads back to an id.
     */
    public function keyFor(int $id): string
    {
        return substr(hash_hmac('sha256', $this->id.':'.$id, (string) config('app.key')), 0, 20);
    }

    /**
     * Adds `score`: how many of the attempt's answers chose a correct choice.
     *
     * @param  Builder<QuestAttempt>  $query
     */
    public function scopeWithScore(Builder $query): void
    {
        $query->withCount(['answers as score' => fn (Builder $query) => $query->whereRelation('choice', 'is_correct', true)]);
    }

    /**
     * @param  Builder<QuestAttempt>  $query
     */
    public function scopeFinished(Builder $query): void
    {
        $query->whereNotNull('finished_at');
    }
}
