<?php

namespace App\Models;

use App\Enums\BadgeRule;
use App\Enums\QuestLevel;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

/**
 * A badge for a profile's achievements: earned by its rule (the system
 * badges, for sharing GAD work), or, with no rule, awarded by hand. A GAD
 * Quest level's row only names and pictures that level: who holds it comes
 * from the quests themselves, one badge per quest (docs/badges.md).
 *
 * @property string $id
 * @property BadgeRule|null $rule
 * @property QuestLevel|null $quest_level
 * @property int|null $survey_region_id Null: national.
 * @property string $name
 * @property string $description
 * @property string|null $image_path
 * @property bool $is_active
 * @property int|null $created_by
 * @property-read string|null $image The uploaded picture's URL.
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['rule', 'quest_level', 'survey_region_id', 'name', 'description', 'image_path', 'is_active', 'created_by'])]
class Badge extends Model
{
    use HasUlids;

    protected function casts(): array
    {
        return [
            'rule' => BadgeRule::class,
            'quest_level' => QuestLevel::class,
            'is_active' => 'boolean',
        ];
    }

    /** @return Attribute<string|null, never> */
    protected function image(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->image_path !== null
            ? Storage::disk('public')->url($this->image_path)
            : null);
    }

    /**
     * Earned by its rule or in GAD Quest, so it is never awarded by hand or
     * deleted.
     */
    public function isSystem(): bool
    {
        return $this->rule !== null || $this->quest_level !== null;
    }

    /** A GAD Quest level comes with every finished quest, so it stays on. */
    public function canBeSwitchedOff(): bool
    {
        return $this->quest_level === null;
    }

    /**
     * The medal drawn when it has no picture: its rule's, its GAD Quest
     * level's, or the custom one.
     */
    public function medal(): string
    {
        return $this->rule?->value ?? $this->quest_level?->value ?? 'custom';
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

    /** @return HasMany<BadgeAward, $this> */
    public function awards(): HasMany
    {
        return $this->hasMany(BadgeAward::class);
    }

    /**
     * Earned badges first, in the order people reach them, then the GAD
     * Quest levels from Participant up, then the custom ones by name.
     *
     * @param  Builder<Badge>  $query
     */
    public function scopeInListOrder(Builder $query): void
    {
        $order = [
            ...array_map(fn (BadgeRule $rule): array => ['rule', $rule->value], BadgeRule::cases()),
            ...array_map(fn (QuestLevel $level): array => ['quest_level', $level->value], QuestLevel::cases()),
        ];
        $cases = [];
        $bindings = [];
        foreach ($order as $position => [$column, $value]) {
            $cases[] = "when {$column} = ? then ?";
            array_push($bindings, $value, $position);
        }

        $query
            ->orderByRaw('case '.implode(' ', $cases).' else ? end', [...$bindings, count($order)])
            ->orderBy('name');
    }
}
