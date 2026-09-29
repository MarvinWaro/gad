<?php

namespace App\Http\Resources;

use App\Models\MonitoringReport;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MonitoringReport */
class MonitoringReportResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $current = $this->resource->relationLoaded('currentRevision') ? $this->currentRevision : null;

        return [
            'id' => $this->id,
            'academic_year' => $this->academic_year,
            'semester' => $this->semester,
            'status' => $this->status,
            'lock_version' => $this->lock_version,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'place' => [
                // The name printed for signing, kept as it was when the report began.
                'hei' => ['id' => $this->survey_hei_id, 'name' => $this->institution_name],
                'cluster' => $this->whenLoaded('cluster', fn (): array => $this->cluster->only(['id', 'name'])),
                'region' => $this->whenLoaded('region', fn (): array => $this->region->only(['id', 'name'])),
            ],
            'current' => $current === null ? null : [
                'number' => $current->number,
                'finalized_at' => $current->finalized_at?->toIso8601String(),
                'submitted_at' => $current->submitted_at?->toIso8601String(),
            ],
            'abilities' => $this->abilities($request->user()),
            'revisions' => $this->whenLoaded('revisions', fn (): array => MonitoringRevisionResource::collection($this->revisions)->resolve($request)),
        ];
    }

    /**
     * What the viewer can do next, from their access and the report's state.
     *
     * @return array{edit: bool, sign: bool, review: bool}
     */
    private function abilities(?User $user): array
    {
        $current = $this->resource->relationLoaded('currentRevision') ? $this->currentRevision : null;
        $working = $current !== null && $this->isOpen() && $user?->can('edit', $this->resource) === true;

        return [
            'edit' => $working && $current->isEditable(),
            'sign' => $working && $current->isAwaitingSignature(),
            'review' => $this->status === 'submitted' && $user?->can('review', $this->resource) === true,
        ];
    }
}
