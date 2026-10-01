<?php

namespace App\Http\Resources;

use App\Models\SurveyRegion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Whether a region lets new HEI accounts in without approval. A closing time
 * that has passed reads as closed.
 *
 * @mixin SurveyRegion
 */
class RegionRegistrationResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $open = $this->isOpenForInstantRegistration();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'open' => $open,
            'until' => $open ? $this->instant_registration_until?->toIso8601String() : null,
        ];
    }
}
