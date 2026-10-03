<?php

namespace App\Http\Resources;

use App\Models\SiteFeedback;
use App\Support\FeedbackQuestions;
use App\Support\InstitutionName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Website feedback as staff read it. Load `region` and `hei` first. The sender's name and email are here because only staff with
 * `feedback.view` ever receive this shape.
 *
 * @mixin SiteFeedback
 */
class SiteFeedbackResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $answers = [];
        foreach (array_keys(FeedbackQuestions::columns()) as $column) {
            $answers[$column] = $this->getAttribute($column);
        }

        return [
            'id' => $this->id,
            'type' => ['code' => $this->type->value, 'label' => $this->type->label()],
            'feedback' => $this->feedback,
            'suggestions' => $this->suggestions,
            // Score per question key; null where it was left blank.
            'answers' => $answers,
            'contact' => ['name' => $this->name, 'email' => $this->email],
            'place' => [
                'region' => $this->region?->name,
                'hei' => $this->hei !== null ? InstitutionName::display($this->hei->name) : null,
            ],
            'submitted_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
