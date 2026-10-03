<?php

namespace App\Http\Resources;

use App\Models\ChecklistAnswer;
use App\Models\ChecklistResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ChecklistResponse */
class ChecklistResponseResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'academic_year' => $this->academic_year,
            // The checked item keys; unchecked items are the rest of the checklist.
            'items' => $this->whenLoaded('answers', fn (): array => $this->answers
                ->map(fn (ChecklistAnswer $answer): string => $answer->item_key)
                ->values()
                ->all()),
            'submitted_at' => $this->submitted_at->toIso8601String(),
            'submitted_by' => $this->whenLoaded('submitter', fn (): ?string => $this->submitter?->name),
            'place' => [
                'hei' => $this->whenLoaded('hei', fn (): array => $this->hei->only(['id', 'name'])),
                'region' => $this->whenLoaded('region', fn (): array => $this->region->only(['id', 'name'])),
            ],
        ];
    }
}
