<?php

namespace App\Models;

use App\Enums\UserStatus;
use App\Support\InstitutionName;
use App\Support\ParticipantCode;
use App\Support\PeopleSearch;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Appends;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
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
 * @property string $ulid Public: profile addresses and follow links; `id` never leaves the server in a URL.
 * @property string $participant_code The Virtual ID's code, which its QR holds (ParticipantCode). Hidden: only its owner sees it.
 * @property string $name
 * @property string $email
 * @property int|null $survey_hei_id
 * @property int|null $survey_region_id
 * @property bool $national_access
 * @property string|null $mobile_number
 * @property string|null $sex
 * @property string|null $avatar_path
 * @property string $search_name Derived from the name by PeopleSearch.
 * @property string $search_sounds Derived from the name by PeopleSearch.
 * @property-read string|null $avatar
 * @property UserStatus $status
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property bool $must_change_password Set with giveTemporaryPassword().
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'survey_hei_id', 'mobile_number', 'sex', 'status'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'avatar_path', 'search_name', 'search_sounds', 'participant_code'])]
#[Appends(['avatar'])]
// Email verification is temporarily optional. Restore MustVerifyEmail here to
// require verification again; keep the verification routes and stored status.
// Laravel's notifications only send mail here (password resets, email
// checks); the in-app ones are App\Models\Notification, so Notifiable's
// database relation is left out.
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasUlids, PasskeyAuthenticatable, RoutesNotifications, TwoFactorAuthenticatable;

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
     * The public ULID, filled in on creation; the key stays a number.
     *
     * @return list<string>
     */
    public function uniqueIds(): array
    {
        return ['ulid'];
    }

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
            'must_change_password' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
            'status' => UserStatus::class,
            'survey_region_id' => 'integer',
            'national_access' => 'boolean',
        ];
    }

    /**
     * The name's search keys follow the name. A new account gets its Virtual
     * ID code. A removed account takes its profile photo with it.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            $user->participant_code ??= ParticipantCode::unique();
        });

        static::saving(function (User $user): void {
            if ($user->isDirty('name') || ! $user->exists) {
                $user->forceFill(PeopleSearch::keysFor($user->name));
            }
        });

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
     * Where the account belongs, as profiles and lists name it: its
     * institution, or its CHED office. Load `hei` and `officeRegion` first.
     */
    public function affiliation(): string
    {
        return $this->hei !== null ? InstitutionName::display($this->hei->name) : $this->chedOffice();
    }

    /**
     * The CHED office a staff account speaks for: its regional office, or
     * the Central Office. Load `officeRegion` first.
     */
    public function chedOffice(): string
    {
        return $this->officeRegion !== null ? 'CHED '.$this->officeRegion->name : 'CHED Central Office';
    }

    /**
     * The region the account belongs to: an HEI account's through its HEI,
     * otherwise its regional office. Central Office staff have none.
     */
    public function regionId(): ?int
    {
        return $this->hei?->cluster->survey_region_id ?? $this->survey_region_id;
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
     * Accounts holding a permission (any of those given) through any of
     * their roles.
     *
     * @param  Builder<User>  $query
     */
    public function scopeWithPermission(Builder $query, string ...$permissions): void
    {
        $query->whereHas('roles.permissions', fn (Builder $query) => $query->whereIn('slug', $permissions));
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

    /**
     * The badges they hold. GAD Quest badges come from their quests.
     *
     * @return HasMany<BadgeAward, $this>
     */
    public function badgeAwards(): HasMany
    {
        return $this->hasMany(BadgeAward::class);
    }

    /**
     * The people they follow, whose posts fill their Following feed.
     *
     * @return BelongsToMany<User, $this>
     */
    public function following(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'follower_id', 'followed_id')->withPivot('created_at');
    }

    /** @return BelongsToMany<User, $this> */
    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'follows', 'followed_id', 'follower_id')->withPivot('created_at');
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

    /**
     * Give the account a password someone else knows: the shared temporary
     * one (`auth.temporary_password`) or one an administrator typed. Its
     * holder must choose their own the next time they sign in. Not saved.
     */
    public function giveTemporaryPassword(?string $password = null): static
    {
        return $this->forceFill([
            'password' => $password ?? config('auth.temporary_password'),
            'must_change_password' => true,
        ]);
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

    /**
     * Whether the account plays GAD Quest. Administrators hold every
     * permission, so they can manage every account, but they run quests
     * rather than play them.
     */
    public function playsQuests(): bool
    {
        return $this->hasPermissionTo('quests.play') && ! $this->hasRole('admin');
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

    /**
     * What the account may hand out through roles, and so whose accounts it
     * may manage: its own permissions, except that only the Central Office
     * hands out user and role management, so a regional manager never makes
     * another manager. A monitoring reviewer also names the HEI focal persons
     * who submit to them.
     *
     * @return array<int, string>
     */
    public function grantablePermissionSlugs(): array
    {
        $own = $this->permissionSlugs();
        $grantable = $this->national_access ? $own : array_diff($own, Permission::MANAGEMENT);

        if (in_array('monitoring.review', $own, true)) {
            $grantable[] = 'monitoring.submit';
        }

        return array_values(array_unique($grantable));
    }
}
