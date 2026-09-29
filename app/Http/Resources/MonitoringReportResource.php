<?php

namespace App\Http\Resources;

use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Support\MonitoringTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MonitoringReport */
class MonitoringReportResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'institution_name' => $this->institution_name,
            'academic_year' => $this->academic_year, 'semester' => $this->semester,
            'status' => $this->status, 'lock_version' => $this->lock_version,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'region_name' => $this->whenLoaded('region', fn () => $this->region->name),
            'cluster_name' => $this->whenLoaded('cluster', fn () => $this->cluster->name),
            'can_edit' => $request->user()->can('update', $this->resource),
            'can_review' => $request->user()->can('review', $this->resource),
            'revisions' => $this->whenLoaded('revisions', fn () => $this->revisions->map(fn (MonitoringRevision $revision): array => $this->revisionData($revision))),
        ];
    }

    /** @return array<string, mixed> */
    private function revisionData(MonitoringRevision $revision): array
    {
        return [
            'id' => $revision->id, 'number' => $revision->number,
            'template' => MonitoringTemplate::definition($revision->template_version),
            'address' => $revision->address ?? '', 'accomplished_on' => $revision->accomplished_on?->format('Y-m-d') ?? '',
            'president_name' => $revision->president_name ?? '', 'focal_person_name' => $revision->focal_person_name ?? '',
            'submitted_at' => $revision->submitted_at?->toIso8601String(),
            'institution' => $revision->institution_snapshot,
            'answers' => (object) $revision->answers->pluck('answer', 'requirement_key')->all(),
            'legacy_overview' => $revision->template_version !== MonitoringTemplate::LEGACY_VERSION
                ? $revision->answers->firstWhere('requirement_key', 'gfps-establishment')?->answer
                : null,
            'legacy_opportunity' => $revision->template_version === MonitoringTemplate::VERSION
                ? $revision->answers->firstWhere('requirement_key', 'opportunity')?->answer
                : null,
            'attachment' => $revision->attachment ? [
                'name' => $revision->attachment->original_name, 'size' => $revision->attachment->size,
                'url' => route('monitoring.attachment', [$this->id, $revision->id]),
            ] : null,
            'reviews' => $revision->reviews->map(fn ($review) => [
                'id' => $review->id, 'decision' => $review->decision,
                'comment' => $review->comment, 'reviewer' => $review->reviewer_name,
                'created_at' => $review->created_at->toIso8601String(),
            ]),
        ];
    }
}
