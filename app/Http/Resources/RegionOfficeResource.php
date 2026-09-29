<?php

namespace App\Http\Resources;

use App\Models\SurveyRegion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A regional office's letterhead. The region's name is the office line.
 *
 * @mixin SurveyRegion
 */
class RegionOfficeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'city' => $this->office_city,
            'address' => $this->office_address,
            'email' => $this->office_email,
            'website' => $this->office_website,
            'phone' => $this->office_phone,
        ];
    }
}
