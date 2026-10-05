<?php

namespace App\Http\Controllers\Settings;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreManagedUserRequest;
use App\Http\Requests\Settings\UpdateManagedUserRequest;
use App\Http\Requests\Settings\UserFilterRequest;
use App\Http\Resources\RegionRegistrationResource;
use App\Models\Role;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use App\Support\CountPhrase;
use App\Support\PlaceFilters;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(UserFilterRequest $request): Response
    {
        $validated = $request->validated();
        $search = trim((string) ($validated['search'] ?? ''));
        $status = UserStatus::tryFrom((string) ($validated['status'] ?? ''));
        $role = (string) ($validated['role'] ?? '');
        $actorPermissions = $request->user()->permissionSlugs();
        $canEdit = $request->user()->can('users.create') || $request->user()->can('users.update');

        $actor = $request->user();
        // Every filter but the status, so the status tabs count what they would show.
        $filtered = fn () => User::query()
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('roles', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('hei', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($role !== '', fn ($query) => $query->whereHas('roles', fn ($query) => $query->where('slug', $role)))
            // A regional office lists its own region's accounts (staff by
            // office, HEI accounts through their HEI) and those placed nowhere.
            ->when(! $actor->national_access, fn ($query) => $query
                ->where('national_access', false)
                ->where(fn ($query) => $query
                    ->placedIn($actor->survey_region_id)
                    ->orWhere(fn ($query) => $query->whereNull('survey_region_id')->whereNull('survey_hei_id'))))
            ->placedIn(
                isset($validated['region']) ? (int) $validated['region'] : null,
                isset($validated['hei']) ? (int) $validated['hei'] : null,
            );
        $users = $filtered()
            ->with(['roles:id,name,slug', 'hei:id,name,survey_cluster_id', 'hei.cluster:id,survey_region_id', 'officeRegion:id,name'])
            ->when($status !== null, fn ($query) => $query->where('status', $status))
            // Registrations awaiting approval are the admin's to-do list.
            ->orderByRaw('case when status = ? then 0 else 1 end', [UserStatus::Pending->value])
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'hei' => $user->hei?->only(['id', 'name']),
                'mobile_number' => $user->mobile_number,
                'status' => $user->status->value,
                'roles' => $user->roles->map->only(['id', 'name', 'slug'])->values(),
                'office' => [
                    'national' => $user->national_access,
                    'region' => $user->officeRegion?->only(['id', 'name']),
                ],
                'created_at' => $user->created_at?->toISOString(),
                'is_current_user' => $user->is($actor),
                'can_manage' => array_diff($user->permissionSlugs(), $actorPermissions) === []
                    && $this->reachesOffice($actor, $user),
            ]);

        $roles = Role::query()
            ->with('permissions:id,slug')
            ->orderBy('name')
            ->get()
            ->filter(fn (Role $role): bool => array_diff(
                $role->permissions->pluck('slug')->all(),
                $actorPermissions,
            ) === [])
            // HEI roles never hold an office, so the form hides the office for them.
            ->map(fn (Role $role): array => [...$role->only(['id', 'name', 'slug']), 'hei' => $role->isHei()])
            ->values();

        $counts = $filtered()
            ->toBase()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        // Active institutions, plus any inactive one still linked to an
        // account so editing that account keeps its current selection. The
        // form picks the region first, so each carries its region. A
        // regional office places accounts in its own region only.
        $heis = $canEdit
            ? SurveyHei::query()
                ->join('survey_clusters', 'survey_clusters.id', '=', 'survey_heis.survey_cluster_id')
                ->join('survey_regions', 'survey_regions.id', '=', 'survey_clusters.survey_region_id')
                ->when(! $actor->national_access, fn ($query) => $query->where('survey_regions.id', $actor->survey_region_id))
                ->where(fn ($query) => $query
                    ->where('survey_heis.is_active', true)
                    ->orWhereIn('survey_heis.id', User::query()->whereNotNull('survey_hei_id')->select('survey_hei_id')))
                ->orderBy('survey_heis.name')
                ->get(['survey_heis.id', 'survey_heis.name', 'survey_regions.id as region_id', 'survey_regions.name as region_name'])
            : collect();

        return Inertia::render('settings/users', [
            'users' => $users,
            'roles' => $roles,
            'heis' => $heis->map(fn (SurveyHei $hei): array => [
                'id' => $hei->id,
                'name' => $hei->name,
                'region_id' => (int) $hei->getAttribute('region_id'),
            ])->values(),
            // The regions those institutions are in.
            'heiRegions' => $heis->map(fn (SurveyHei $hei): array => [
                'id' => (int) $hei->getAttribute('region_id'),
                'name' => (string) $hei->getAttribute('region_name'),
            ])->unique('id')->sortBy('name')->values(),
            // Offices this manager may place accounts in: every region from
            // the Central Office, otherwise only their own.
            'offices' => [
                'national' => $actor->national_access,
                'regions' => $canEdit
                    ? SurveyRegion::query()
                        ->when(! $actor->national_access, fn ($query) => $query->whereKey($actor->survey_region_id))
                        ->orderBy('name')
                        ->get(['id', 'name'])
                    : [],
            ],
            // On-the-spot registration for the regions this manager covers.
            'registration' => $request->user()->can('users.update')
                ? RegionRegistrationResource::collection(
                    SurveyRegion::query()
                        ->where('is_active', true)
                        ->when(! $actor->national_access, fn ($query) => $query->whereKey($actor->survey_region_id))
                        ->orderBy('name')
                        ->get(['id', 'name', 'instant_registration', 'instant_registration_until']),
                )->resolve($request)
                : [],
            'statusCounts' => collect(UserStatus::cases())
                ->mapWithKeys(fn (UserStatus $case): array => [$case->value => (int) ($counts[$case->value] ?? 0)]),
            'filters' => [
                'search' => $search,
                'status' => $status->value ?? '',
                'role' => $role,
                'region' => (string) ($validated['region'] ?? ''),
                'hei' => (string) ($validated['hei'] ?? ''),
            ],
            // Every role, to filter by, including any this manager cannot assign.
            'roleOptions' => Role::query()->orderBy('name')->get(['name', 'slug']),
            // Where accounts are placed, as the monitoring lists filter them.
            'places' => PlaceFilters::options($actor, $validated),
            'permissions' => [
                'create' => $request->user()->can('users.create'),
                'update' => $request->user()->can('users.update'),
                'delete' => $request->user()->can('users.delete'),
                'activity' => $request->user()->can('activity-logs.view'),
            ],
            // What a new account signs in with, to pass on to its holder.
            'temporaryPassword' => $request->user()->can('users.create') ? config('auth.temporary_password') : null,
        ]);
    }

    public function store(StoreManagedUserRequest $request, ActivityRecorder $activity): RedirectResponse
    {
        $validated = $request->validated();
        $this->ensureRolesAreAssignable($request->user(), $validated['role_ids']);
        $slugs = Role::slugsOf($validated['role_ids']);
        $office = $this->officeFrom($slugs, $validated);
        $this->ensureOfficeIsAssignable($request->user(), $office);

        $user = DB::transaction(function () use ($validated, $slugs, $office): User {
            // It starts with the temporary password, which its holder must
            // change the first time they sign in.
            $user = (new User)->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'survey_hei_id' => $this->heiFrom($slugs, $validated),
                'status' => UserStatus::Active,
            ])->giveTemporaryPassword();

            // Neither is mass assignable, so a form elsewhere cannot set them.
            $user->forceFill(['email_verified_at' => now(), ...($office ?? [])])->save();

            $user->roles()->sync($validated['role_ids']);

            return $user;
        });

        $activity->record(ActivityAction::Created, ActivityModule::Users, $user, properties: [
            'roles' => Role::query()->whereKey($validated['role_ids'])->orderBy('name')->pluck('name')->all(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User created. Their temporary password is “:password”.', ['password' => config('auth.temporary_password')]),
        ]);

        return to_route('settings.users.index');
    }

    public function update(UpdateManagedUserRequest $request, User $user, ActivityRecorder $activity): RedirectResponse
    {
        $validated = $request->validated();
        $this->ensureUserIsManageable($request->user(), $user);
        $this->ensureRolesAreAssignable($request->user(), $validated['role_ids']);
        $this->ensureAdministratorRemains($user, $validated['role_ids']);
        $slugs = Role::slugsOf($validated['role_ids']);
        $office = $this->officeFrom($slugs, $validated);
        $this->ensureOfficeIsAssignable($request->user(), $office);
        $rolesBefore = $user->roles()->pluck('name')->all();
        // A password set for someone else is theirs to replace at their next
        // sign-in; a manager editing their own account keeps what they typed.
        $temporary = ! empty($validated['password']) && ! $user->is($request->user());

        DB::transaction(function () use ($user, $validated, $slugs, $office, $temporary): void {
            // Contact details are left as the account holder set them.
            $user->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'survey_hei_id' => $this->heiFrom($slugs, $validated),
            ]);

            if ($temporary) {
                $user->giveTemporaryPassword($validated['password']);
            } elseif (! empty($validated['password'])) {
                $user->password = $validated['password'];
            }

            if ($office !== null) {
                $user->forceFill($office);
            }

            $user->save();
            $user->roles()->sync($validated['role_ids']);
        });

        $changes = $activity->changesOf($user, except: ['must_change_password']);
        $roles = $activity->listChange($rolesBefore, Role::query()->whereKey($validated['role_ids'])->pluck('name')->all());
        if ($roles !== null) {
            $changes['roles'] = $roles;
        }
        if (! empty($validated['password'])) {
            $changes['password'] = [null, $temporary ? 'Changed, to replace at next sign-in' : 'Changed'];
        }
        $activity->record(ActivityAction::Updated, ActivityModule::Users, $user, $changes);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User updated.'),
        ]);

        return to_route('settings.users.index');
    }

    public function updateStatus(Request $request, User $user, ActivityRecorder $activity, Notifier $notifier): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(UserStatus::class)],
        ]);
        $status = UserStatus::from($validated['status']);

        if ($user->is($request->user())) {
            return $this->refuse(__('You cannot change the status of your own account.'));
        }

        try {
            $this->ensureUserIsManageable($request->user(), $user);

            if ($status !== UserStatus::Active) {
                $this->ensureAnotherActiveAdministrator($user, 'user');
            }
        } catch (ValidationException $exception) {
            return $this->refuse($this->firstMessage($exception));
        }

        $message = match (true) {
            $status === UserStatus::Active && $user->status === UserStatus::Pending => __(':name approved.', ['name' => $user->name]),
            $status === UserStatus::Active => __(':name reactivated.', ['name' => $user->name]),
            $status === UserStatus::Inactive => $this->deactivatedMessage($user),
            default => __(':name marked as pending.', ['name' => $user->name]),
        };

        $action = match (true) {
            $status === UserStatus::Active && $user->status === UserStatus::Pending => ActivityAction::Approved,
            $status === UserStatus::Active => ActivityAction::Activated,
            $status === UserStatus::Inactive => ActivityAction::Deactivated,
            default => ActivityAction::MarkedPending,
        };

        $user->update(['status' => $status]);
        $entry = $activity->record($action, ActivityModule::Users, $user, $activity->changesOf($user));

        if ($action === ActivityAction::Approved) {
            $notifier->accountApproved($user, $entry);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $message,
        ]);

        return back();
    }

    public function destroy(Request $request, User $user, ActivityRecorder $activity): RedirectResponse
    {
        if ($user->is($request->user())) {
            return $this->refuse(__('You cannot delete your own account from user management.'));
        }

        try {
            $this->ensureUserIsManageable($request->user(), $user);
            $this->ensureAdministratorRemains($user, []);
        } catch (ValidationException $exception) {
            return $this->refuse($this->firstMessage($exception));
        }

        // Posts and comments are the school's GAD record; deleting the author
        // would erase them. Deactivation keeps them and blocks the login.
        $records = $this->activityCounts($user);

        if (array_sum($records) > 0) {
            return $this->refuse(__(':name has :activity. Deactivate the account instead to keep them.', [
                'name' => $user->name,
                'activity' => CountPhrase::of($records),
            ]));
        }

        $user->delete();
        $activity->record(ActivityAction::Deleted, ActivityModule::Users, $user);

        Inertia::flash('toast', [
            'type' => 'deleted',
            'message' => __(':name deleted.', ['name' => $user->name]),
        ]);

        return to_route('settings.users.index');
    }

    /** @return array{post: int, comment: int} */
    private function activityCounts(User $user): array
    {
        return [
            'post' => $user->posts()->count(),
            'comment' => $user->postComments()->count(),
        ];
    }

    private function deactivatedMessage(User $user): string
    {
        $activity = $this->activityCounts($user);

        return array_sum($activity) > 0
            ? __(':name deactivated. Their activity (:activity) stays visible, marked as from a deactivated account.', [
                'name' => $user->name,
                'activity' => CountPhrase::of($activity),
            ])
            : __(':name deactivated.', ['name' => $user->name]);
    }

    private function firstMessage(ValidationException $exception): string
    {
        return (string) (collect($exception->errors())->flatten()->first() ?? $exception->getMessage());
    }

    /** @param array<int, int|string> $roleIds */
    private function ensureAdministratorRemains(User $user, array $roleIds): void
    {
        $adminRoleId = Role::query()->where('slug', 'admin')->value('id');

        if ($adminRoleId !== null && in_array((int) $adminRoleId, array_map('intval', $roleIds), true)) {
            return;
        }

        $this->ensureAnotherActiveAdministrator($user, 'role_ids');
    }

    /**
     * Refuse to take an administrator out of service when no other active
     * administrator would be left to manage the system.
     */
    private function ensureAnotherActiveAdministrator(User $user, string $errorKey): void
    {
        $adminRole = Role::query()->where('slug', 'admin')->first();

        if ($adminRole === null || ! $user->roles()->whereKey($adminRole->id)->exists()) {
            return;
        }

        $anotherRemains = $adminRole->users()
            ->whereKeyNot($user->id)
            ->where('status', UserStatus::Active)
            ->exists();

        if (! $anotherRemains) {
            throw ValidationException::withMessages([
                $errorKey => __('The system must retain at least one active administrator.'),
            ]);
        }
    }

    /** @param array<int, int|string> $roleIds */
    private function ensureRolesAreAssignable(User $actor, array $roleIds): void
    {
        $selectedPermissions = Role::query()
            ->whereKey($roleIds)
            ->with('permissions:id,slug')
            ->get()
            ->flatMap->permissions
            ->pluck('slug')
            ->unique()
            ->all();

        if (array_diff($selectedPermissions, $actor->permissionSlugs()) !== []) {
            throw ValidationException::withMessages([
                'role_ids' => __('You cannot assign a role with permissions above your own access.'),
            ]);
        }
    }

    private function ensureUserIsManageable(User $actor, User $target): void
    {
        if (array_diff($target->permissionSlugs(), $actor->permissionSlugs()) !== []) {
            throw ValidationException::withMessages([
                'user' => __('You cannot manage a user with permissions above your own access.'),
            ]);
        }

        if (! $this->reachesOffice($actor, $target)) {
            throw ValidationException::withMessages([
                'user' => __('You cannot manage an account in another office.'),
            ]);
        }
    }

    /**
     * Central Office staff manage everyone. Others manage accounts of their
     * own region (staff by their office, HEI accounts through their HEI) and
     * accounts placed nowhere yet.
     */
    private function reachesOffice(User $actor, User $target): bool
    {
        if ($actor->national_access) {
            return true;
        }

        $region = $target->regionId();

        return ! $target->national_access && ($region === null || $region === $actor->survey_region_id);
    }

    /**
     * The institution a create or update sets. It places HEI accounts (the
     * request requires it for an HEI role); CHED staff have none, since
     * their office places them.
     *
     * @param  list<string>  $slugs
     * @param  array<string, mixed>  $validated
     */
    private function heiFrom(array $slugs, array $validated): ?int
    {
        return Role::includesHei($slugs) && isset($validated['survey_hei_id'])
            ? (int) $validated['survey_hei_id']
            : null;
    }

    /**
     * The office a create or update sets, or null to keep the current one.
     * HEI-only accounts never hold one: their region comes through the HEI.
     * Administrators run the whole system, so they always cover every
     * region, whatever office the form sends.
     *
     * @param  list<string>  $slugs
     * @param  array<string, mixed>  $validated
     * @return array{national_access: bool, survey_region_id: int|null}|null
     */
    private function officeFrom(array $slugs, array $validated): ?array
    {
        if (Role::onlyHei($slugs)) {
            return ['national_access' => false, 'survey_region_id' => null];
        }

        if (in_array('admin', $slugs, true)) {
            return ['national_access' => true, 'survey_region_id' => null];
        }

        if (! array_key_exists('national_access', $validated) && ! array_key_exists('survey_region_id', $validated)) {
            return null;
        }

        $national = (bool) ($validated['national_access'] ?? false);
        $region = $validated['survey_region_id'] ?? null;

        return [
            'national_access' => $national,
            'survey_region_id' => $national || $region === null ? null : (int) $region,
        ];
    }

    /**
     * Only Central Office staff grant national access or place accounts in
     * any region; regional staff may place them only in their own office.
     *
     * @param  array{national_access: bool, survey_region_id: int|null}|null  $office
     */
    private function ensureOfficeIsAssignable(User $actor, ?array $office): void
    {
        if ($office === null || $actor->national_access) {
            return;
        }

        if ($office['national_access']) {
            throw ValidationException::withMessages([
                'national_access' => __('Only Central Office staff can give national access.'),
            ]);
        }

        if ($office['survey_region_id'] !== null && ! $actor->reachesRegion($office['survey_region_id'])) {
            throw ValidationException::withMessages([
                'survey_region_id' => __('You can only place accounts in your own regional office.'),
            ]);
        }
    }
}
