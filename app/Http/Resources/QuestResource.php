<?php

namespace App\Http\Resources;

use App\Models\Quest;
use App\Models\QuestChoice;
use App\Models\QuestQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A quest as its staff see it, correct answers included, so it is only ever
 * sent to accounts that may manage it. Load `region` and `creator` first;
 * `questions.choices`, `players_count`, `completed_count` and `played` are
 * added when loaded.
 *
 * @mixin Quest
 */
class QuestResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status->value,
            'region' => $this->region !== null ? ['id' => $this->region->id, 'name' => $this->region->name] : null,
            'organizer' => $this->organizer(),
            'allow_retakes' => $this->allow_retakes,
            'created_by' => $this->creator?->name,
            'published_at' => $this->published_at?->toIso8601ZuluString(),
            'updated_at' => $this->updated_at?->toIso8601ZuluString(),
            'players' => $this->whenCounted('players'),
            'completed' => $this->whenCounted('completed'),
            'played' => $this->whenHas('played', fn (): bool => (bool) $this->getAttribute('played')),
            'questions' => $this->whenLoaded('questions', fn (): array => $this->questions
                ->map(fn (QuestQuestion $question): array => [
                    'prompt' => $question->prompt,
                    'explanation' => $question->explanation,
                    'choices' => $question->choices->pluck('label')->values()->all(),
                    'correct' => (int) $question->choices->search(fn (QuestChoice $choice): bool => $choice->is_correct),
                ])
                ->values()
                ->all()),
        ];
    }
}
