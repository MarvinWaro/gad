<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'slug', 'description'])]
class Role extends Model
{
    /**
     * Roles held by an HEI's own people. They get the HEI home, and their
     * place comes through their HEI, never through a CHED office.
     */
    public const HEI_SLUGS = ['hei', 'hei-focal'];

    public function isHei(): bool
    {
        return in_array($this->slug, self::HEI_SLUGS, true);
    }

    /**
     * Whether a set of role slugs is HEI roles only.
     *
     * @param  list<string>  $slugs
     */
    public static function onlyHei(array $slugs): bool
    {
        return $slugs !== [] && array_diff($slugs, self::HEI_SLUGS) === [];
    }

    /** @return BelongsToMany<Permission, $this> */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    /** @return BelongsToMany<User, $this> */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
