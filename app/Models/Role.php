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

    /**
     * Regional CHED roles. An account holding one belongs to exactly one
     * regional office: it sees, and is told about, that region alone.
     */
    public const REGIONAL_SLUGS = ['ched-focal', 'ched-employee'];

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

    /**
     * Whether a set of role slugs includes an HEI role, which places the
     * account at an institution.
     *
     * @param  list<string>  $slugs
     */
    public static function includesHei(array $slugs): bool
    {
        return array_intersect($slugs, self::HEI_SLUGS) !== [];
    }

    /**
     * Whether a set of role slugs must name one regional office: a regional
     * CHED role, unless the account is also an Administrator, who always
     * covers every region.
     *
     * @param  list<string>  $slugs
     */
    public static function needsRegion(array $slugs): bool
    {
        return array_intersect($slugs, self::REGIONAL_SLUGS) !== [] && ! in_array('admin', $slugs, true);
    }

    /**
     * The slugs of the roles with these ids; anything else is skipped.
     *
     * @return list<string>
     */
    public static function slugsOf(mixed $ids): array
    {
        $ids = array_filter((array) $ids, fn (mixed $id): bool => is_numeric($id));

        return $ids === [] ? [] : array_values(static::query()->whereKey($ids)->get(['slug'])
            ->map(fn (Role $role): string => $role->slug)
            ->all());
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
