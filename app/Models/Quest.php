<?php

namespace App\Models;

use App\Enums\QuestStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A GAD Quest: a short quiz a regional office (or the Central Office, for
 * every region) writes for its people to play, each question explained once
 * answered. Finishing it earns a badge (docs/gad-quest.md).
 *
 * @property string $id
 * @property int|null $survey_region_id Null: for every region.
 * @property string $title
 * @property string|null $description
 * @property QuestStatus $status
 * @property bool $allow_retakes
 * @property int|null $created_by
 * @property CarbonImmutable|null $published_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['survey_region_id', 'title', 'description', 'status', 'allow_retakes', 'created_by', 'published_at'])]
class Quest extends Model
{
    use HasUlids;

    /** Questions in every quest, for now. */
    public const QUESTIONS = 5;

    /** Choices a question may offer. */
    public const MIN_CHOICES = 2;

    public const MAX_CHOICES = 4;

    protected function casts(): array
    {
        return [
            'status' => QuestStatus::class,
            'allow_retakes' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** @return HasMany<QuestQuestion, $this> */
    public function questions(): HasMany
    {
        return $this->hasMany(QuestQuestion::class)->orderBy('position');
    }

    /** @return HasMany<QuestAttempt, $this> */
    public function attempts(): HasMany
    {
        return $this->hasMany(QuestAttempt::class);
    }

    /**
     * Quests the people of a region may play: that region's and every
     * region's. With no region, every region's only.
     *
     * @param  Builder<Quest>  $query
     */
    public function scopeForRegion(Builder $query, ?int $regionId): void
    {
        $query->where(fn (Builder $query) => $query
            ->whereNull('survey_region_id')
            ->when($regionId !== null, fn (Builder $query) => $query->orWhere('survey_region_id', $regionId)));
    }

    /** Once anyone has played, the questions stay as they were answered. */
    public function hasAttempts(): bool
    {
        return $this->attempts()->exists();
    }

    /** Who wrote it, as the badge names the organizer. */
    public function organizer(): string
    {
        return $this->region !== null ? $this->region->name : 'CHED Central Office';
    }
}
