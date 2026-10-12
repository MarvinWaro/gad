<?php

namespace App\Http\Resources;

use App\Models\CertificateSignatory;
use App\Support\CertificateFiles;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A certificate signatory as Settings shows them, with a signed link to
 * their e-signature, for staff of their office only. Load `region` first;
 * `designs_count` is added when counted.
 *
 * @mixin CertificateSignatory
 */
class CertificateSignatoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'position' => $this->position,
            'region' => $this->region !== null ? ['id' => $this->region->id, 'name' => $this->region->name] : null,
            'signature' => CertificateFiles::url($this->signature_path),
            'designs' => $this->whenCounted('designs'),
            'can' => [
                'update' => $user?->can('update', $this->resource) ?? false,
                'delete' => $user?->can('delete', $this->resource) ?? false,
            ],
        ];
    }
}
