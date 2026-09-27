<?php

namespace App\Models;

use App\Enums\UserStatus;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
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
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Mirror the column default so unsaved models agree with the database.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'active',
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

        return $this->roles->pluck('slug')->all() === ['hei'];
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
