<?php

namespace App\Http\Resources;

use App\Models\Badge;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A badge as Settings → Badges shows it, with what the viewer may do to it.
 * Load `region` first; `holders_count` is added when counted.
 *
 * @mixin Badge
 */
class BadgeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id' => $this->id,
            'rule' => $this->rule?->value,
            'criterion' => $this->rule?->criterion(),
            'name' => $this->name,
            'description' => $this->description,
            'medal' => $this->medal(),
            'image' => $this->image,
            'is_active' => $this->is_active,
            'region' => $this->region !== null ? ['id' => $this->region->id, 'name' => $this->region->name] : null,
            'holders' => $this->whenCounted('holders'),
            'can' => [
                'update' => $user?->can('update', $this->resource) ?? false,
                'delete' => ! $this->isSystem() && ($user?->can('delete', $this->resource) ?? false),
                'award' => ! $this->isSystem() && $this->is_active && ($user?->can('award', $this->resource) ?? false),
            ],
        ];
    }
}
