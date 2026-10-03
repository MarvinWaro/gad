<?php

namespace App\Models;

use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\RoutesNotifications;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property int|null $survey_hei_id
 * @property int|null $survey_region_id
 * @property bool $national_access
 * @property string|null $mobile_number
 * @property string|null $sex
 * @property string|null $avatar_path
 * @property-read string|null $avatar
 * @property UserStatus $status
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'survey_hei_id', 'mobile_number', 'sex', 'status'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'avatar_path'])]
#[Appends(['avatar'])]
// Email verification is temporarily optional. Restore MustVerifyEmail here to
// require verification again; keep the verification routes and stored status.
// Laravel's notifications only send mail here (password resets, email
// checks); the in-app ones are App\Models\Notification, so Notifiable's
// database relation is left out.
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, PasskeyAuthenticatable, RoutesNotifications, TwoFactorAuthenticatable;

    /**
     * Mirror the column default so unsaved models agree with the database.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'active',
        'national_access' => false,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'status' => UserStatus::class,
            'survey_region_id' => 'integer',
            'national_access' => 'boolean',
        ];
    }

    /** A removed account takes its profile photo with it. */
    protected static function booted(): void
    {
        static::deleted(function (User $user): void {
            if ($user->avatar_path !== null) {
                Storage::disk('public')->delete($user->avatar_path);
            }
        });
    }

    /**
     * The profile photo's URL, or null to show initials.
     *
     * @return Attribute<string|null, never>
     */
    protected function avatar(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->avatar_path !== null
            ? Storage::disk('public')->url($this->avatar_path)
            : null);
    }

    /** @return BelongsTo<SurveyHei, $this> */
    public function hei(): BelongsTo
    {
        return $this->belongsTo(SurveyHei::class, 'survey_hei_id');
    }

    /**
     * A staff account's regional office. HEI accounts have none: their region
     * comes through the HEI.
     *
     * @return BelongsTo<SurveyRegion, $this>
     */
    public function officeRegion(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** Whether the account is placed in an office, so it sees some region's data. */
    public function hasOffice(): bool
    {
        return $this->national_access || $this->survey_region_id !== null;
    }

    /** Whether the account's office covers a region: its own, or all of them. */
    public function reachesRegion(?int $regionId): bool
    {
        return $this->national_access
            || ($regionId !== null && $this->survey_region_id === $regionId);
    }

    /**
     * Accounts placed in a region or HEI: HEI accounts through their
     * institution, CHED staff through their regional office. Central Office
     * staff belong to no one region.
     *
     * @param  Builder<User>  $query
     */
    public function scopePlacedIn(Builder $query, ?int $regionId = null, ?int $heiId = null): void
    {
        $query
            ->when($heiId, fn (Builder $query) => $query->where('survey_hei_id', $heiId))
            ->when($regionId, fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->where('survey_region_id', $regionId)
                ->orWhereHas('hei.cluster', fn (Builder $query) => $query->where('survey_region_id', $regionId))));
    }

    /**
     * Accounts that may sign in now.
     *
     * @param  Builder<User>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', UserStatus::Active);
    }

    /**
     * Accounts holding a permission through any of their roles.
     *
     * @param  Builder<User>  $query
     */
    public function scopeWithPermission(Builder $query, string $permission): void
    {
        $query->whereHas('roles.permissions', fn (Builder $query) => $query->where('slug', $permission));
    }

    /**
     * Staff whose office covers a region: the Central Office always, and that
     * region's own office. With no region, the Central Office only.
     *
     * @param  Builder<User>  $query
     */
    public function scopeReaching(Builder $query, ?int $regionId): void
    {
        $query->where(fn (Builder $query) => $query
            ->where('national_access', true)
            ->when($regionId !== null, fn (Builder $query) => $query->orWhere('survey_region_id', $regionId)));
    }

    /**
     * What the account has been told about, in the bell and on the
     * Notifications page.
     *
     * @return HasMany<Notification, $this>
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /** @return HasMany<Post, $this> */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /** @return HasMany<PostComment, $this> */
    public function postComments(): HasMany
    {
        return $this->hasMany(PostComment::class);
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    /** @return BelongsToMany<Role, $this> */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function assignRole(Role|string $role): void
    {
        $roleId = $role instanceof Role
            ? $role->getKey()
            : Role::query()->where('slug', $role)->value('id');

        if ($roleId !== null) {
            $this->roles()->syncWithoutDetaching([$roleId]);
            $this->unsetRelation('roles');
        }
    }

    public function hasRole(string $role): bool
    {
        $this->loadMissing('roles');

        return $this->roles->contains('slug', $role);
    }

    /** An HEI account with no staff role, which gets the HEI home and header shell. */
    public function isHeiOnly(): bool
    {
        $this->loadMissing('roles');

        return Role::onlyHei(array_values($this->roles->map(fn (Role $role): string => $role->slug)->all()));
    }

    public function hasPermissionTo(string $permission): bool
    {
        $this->loadMissing('roles.permissions');

        return $this->roles->contains(
            fn (Role $role): bool => $role->permissions->contains('slug', $permission),
        );
    }

    /** @return array<int, string> */
    public function permissionSlugs(): array
    {
        $this->loadMissing('roles.permissions');

        return $this->roles
            ->flatMap->permissions
            ->pluck('slug')
            ->unique()
            ->sort()
            ->values()
            ->all();
    }
}
