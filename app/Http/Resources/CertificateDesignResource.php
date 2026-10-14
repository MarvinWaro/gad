<?php

namespace App\Http\Resources;

use App\Models\CertificateDesign;
use App\Models\CertificateSignatory;
use App\Support\CertificateFiles;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A certificate design as Settings shows it, with signed links to its logos
 * and its signatories' e-signatures. Load `region` first, and `signatories`,
 * `pairedWith` and `pairedBy` for the editor; `uses_count` and
 * `released_uses_count` are added when counted.
 *
 * @mixin CertificateDesign
 */
class CertificateDesignResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'kind' => $this->kind->value,
            'title' => $this->kind->title(),
            'name' => $this->name,
            'background' => $this->background,
            'body' => $this->body,
            'region' => $this->region !== null ? ['id' => $this->region->id, 'name' => $this->region->name] : null,
            'logos' => array_map(fn (string $path): array => [
                'key' => CertificateFiles::key($path),
                'url' => CertificateFiles::url($path),
            ], $this->logo_paths),
            'signatories' => $this->whenLoaded('signatories', fn (): array => $this->signatories->map(fn (CertificateSignatory $signatory): array => [
                'id' => $signatory->id,
                'name' => $signatory->name,
                'position' => $signatory->position,
                'signature' => CertificateFiles::url($signatory->signature_path),
            ])->values()->all()),
            // Its pair, of the other kind: chosen for events and released with it.
            'partner' => $this->when(
                $this->relationLoaded('pairedWith') && $this->relationLoaded('pairedBy'),
                fn (): ?array => ($partner = $this->resource->partner()) !== null
                    ? ['id' => $partner->id, 'name' => $partner->name, 'title' => $partner->kind->title()]
                    : null,
            ),
            'uses' => $this->whenCounted('uses'),
            'released_uses' => $this->whenCounted('released_uses'),
            'updated_at' => $this->updated_at?->toIso8601ZuluString(),
            'can' => [
                'update' => $user?->can('update', $this->resource) ?? false,
                'delete' => $user?->can('delete', $this->resource) ?? false,
                'use' => $user?->can('use', $this->resource) ?? false,
                'pair' => ($user?->can('view', $this->resource) ?? false) && $user->can('create', CertificateDesign::class),
            ],
        ];
    }
}
