<?php

namespace App\Http\Resources;

use App\Models\MonitoringReview;
use App\Models\MonitoringRevision;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MonitoringRevision */
class MonitoringRevisionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'template_version' => $this->template_version,
            'details' => $this->details(),
            'answers' => $this->whenLoaded('answers', fn (): object => (object) $this->answers->pluck('answer', 'requirement_key')->all()),
            'finalized_at' => $this->finalized_at?->toIso8601String(),
            'finalized_by' => $this->whenLoaded('finalizer', fn (): ?string => $this->finalizer?->name),
            'document_code' => $this->document_code,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'submitted_by' => $this->whenLoaded('submitter', fn (): ?string => $this->submitter?->name),
            'attachment' => $this->whenLoaded('attachment', fn (): ?array => $this->attachment === null ? null : [
                'name' => $this->attachment->original_name,
                'size' => (int) $this->attachment->size,
                'url' => route('monitoring.attachment', [$this->monitoring_report_id, $this->id]),
                'inline_url' => route('monitoring.attachment', [$this->monitoring_report_id, $this->id, 'inline' => 1]),
            ]),
            'reviews' => $this->whenLoaded('reviews', fn (): array => $this->reviews->map(fn (MonitoringReview $review): array => [
                'id' => $review->id,
                'decision' => $review->decision,
                'comment' => $review->comment,
                'reviewer' => $review->reviewer_name,
                'created_at' => $review->created_at?->toIso8601String(),
            ])->all()),
        ];
    }
}
