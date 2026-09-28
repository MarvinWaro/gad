<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    /**
     * Every follow-up question, retired ones included.
     *
     * @return HasMany<SurveyGroupQuestion, $this>
     */
    public function questions(): HasMany
    {
        return $this->hasMany(SurveyGroupQuestion::class)->orderBy('sort_order');
    }

    /**
     * The questions asked right after a respondent picks this group.
     *
     * @return HasMany<SurveyGroupQuestion, $this>
     */
    public function followUpQuestions(): HasMany
    {
        return $this->questions()->where('is_active', true);
    }

    /**
     * The follow-up questions as the public form and the settings editor use
     * them: each with its key, label, type and choices. Eager load
     * `followUpQuestions.activeOptions` when reading several groups.
     *
     * @return list<array{key: string, label: string, type: string, required: bool, options: list<array{value: string, label: string, requires_text?: true}>}>
     */
    public function followUps(): array
    {
        return array_values($this->followUpQuestions->map(fn (SurveyGroupQuestion $question): array => [
            'key' => $question->key,
            'label' => $question->label,
            'type' => $question->type,
            'required' => $question->required,
            'options' => array_values($question->activeOptions->map(fn (SurveyGroupOption $option): array => [
                'value' => $option->value,
                'label' => $option->label,
                ...($option->requires_text ? ['requires_text' => true] : []),
            ])->all()),
        ])->all());
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
