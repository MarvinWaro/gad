<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A colleague on the HEI home's "People at your institution" card: who they
 * are and whether they are the institution's GAD Focal Person. Nothing else
 * about the account (no email, no roles) leaves the server. Select
 * `is_focal` (InstitutionPeople does).
 *
 * @mixin User
 */
class InstitutionPersonResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar' => $this->avatar,
            'focal' => (bool) $this->getAttribute('is_focal'),
        ];
    }
}
