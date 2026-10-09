<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\ParticipantCode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Someone's own Virtual ID, as their Settings show it: who they are and where
 * they belong, from their profile now, and their participant code with its
 * QR. Only ever sent to its owner. Load `hei` and `officeRegion` first.
 *
 * @mixin User
 */
class VirtualIdResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'affiliation' => $this->affiliation(),
            // From this site, not the photo's storage, so the card can be
            // saved as an image (a canvas only exports same-origin pictures).
            // The version changes with the photo, so a new one shows at once.
            'photo' => $this->avatar_path !== null
                ? route('virtual-id.photo', ['v' => substr(sha1($this->avatar_path), 0, 8)])
                : null,
            'code' => $this->participant_code,
            'qr' => ParticipantCode::qrRows($this->participant_code),
        ];
    }
}
