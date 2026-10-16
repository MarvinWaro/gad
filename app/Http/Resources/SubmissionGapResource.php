<?php

namespace App\Http\Resources;

use App\Models\SurveyHei;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An institution in a "Not yet submitted" list (App\Support\SubmissionGaps):
 * where it is, how far it got, and whether anyone there can send it.
 *
 * @mixin SurveyHei
 */
class SubmissionGapResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $status = $this->getAttribute('report_status');

        return [
            'hei' => ['id' => $this->id, 'name' => $this->name],
            'region' => $this->getAttribute('region_name'),
            // not_started, draft (being written or awaiting signature) or returned.
            'status' => is_string($status) ? $status : 'not_started',
            'report_id' => $this->getAttribute('report_id'),
            'has_focal' => (bool) $this->getAttribute('has_focal'),
        ];
    }
}
