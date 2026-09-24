<?php

namespace App\Http\Controllers\Settings;

use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreManagedUserRequest;
use App\Http\Requests\Settings\UpdateManagedUserRequest;
use App\Models\Role;
use App\Models\SurveyHei;
use App\Models\User;
use App\Support\CountPhrase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = UserStatus::tryFrom((string) $request->query('status', ''));
        $actorPermissions = $request->user()->permissionSlugs();
        $canEdit = $request->user()->can('users.create') || $request->user()->can('users.update');

        $users = User::query()
            ->with(['roles:id,name,slug', 'hei:id,name'])
            ->when($status !== null, fn ($query) => $query->where('status', $status))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('roles', fn ($query) => $query->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('hei', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
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
                'sex' => $user->sex,
                'status' => $user->status->value,
                'roles' => $user->roles->map->only(['id', 'name', 'slug'])->values(),
                'created_at' => $user->created_at?->toISOString(),
                'is_current_user' => $user->is($request->user()),
                'can_manage' => array_diff($user->permissionSlugs(), $actorPermissions) === [],
            ]);

        $roles = Role::query()
            ->with('permissions:id,slug')
            ->orderBy('name')
            ->get()
            ->filter(fn (Role $role): bool => array_diff(
                $role->permissions->pluck('slug')->all(),
                $actorPermissions,
            ) === [])
            ->map->only(['id', 'name', 'slug'])
            ->values();

        $counts = User::query()
            ->toBase()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return Inertia::render('settings/users', [
            'users' => $users,
            'roles' => $roles,
            // Active institutions, plus any inactive one still linked to an
            // account so editing that account keeps its current selection.
            'heis' => $canEdit
                ? SurveyHei::query()
                    ->where('is_active', true)
                    ->orWhereIn('id', User::query()->whereNotNull('survey_hei_id')->select('survey_hei_id'))
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'statusCounts' => collect(UserStatus::cases())
                ->mapWithKeys(fn (UserStatus $case): array => [$case->value => (int) ($counts[$case->value] ?? 0)]),
            'filters' => ['search' => $search, 'status' => $status->value ?? ''],
            'permissions' => [
                'create' => $request->user()->can('users.create'),
                'update' => $request->user()->can('users.update'),
                'delete' => $request->user()->can('users.delete'),
            ],
        ]);
    }

    public function store(StoreManagedUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $this->ensureRolesAreAssignable($request->user(), $validated['role_ids']);

        DB::transaction(function () use ($validated): void {
            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'survey_hei_id' => $validated['survey_hei_id'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'sex' => $validated['sex'] ?? null,
                'status' => UserStatus::Active,
                'email_verified_at' => now(),
            ]);

            $user->roles()->sync($validated['role_ids']);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User created.'),
        ]);

        return to_route('settings.users.index');
    }

    public function update(UpdateManagedUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $this->ensureUserIsManageable($request->user(), $user);
        $this->ensureRolesAreAssignable($request->user(), $validated['role_ids']);
        $this->ensureAdministratorRemains($user, $validated['role_ids']);

        DB::transaction(function () use ($user, $validated): void {
            $attributes = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'survey_hei_id' => $validated['survey_hei_id'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'sex' => $validated['sex'] ?? null,
            ];

            if (! empty($validated['password'])) {
                $attributes['password'] = $validated['password'];
            }

            $user->update($attributes);
            $user->roles()->sync($validated['role_ids']);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User updated.'),
        ]);

        return to_route('settings.users.index');
    }

    public function updateStatus(Request $request, User $user): RedirectResponse
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

        $user->update(['status' => $status]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $message,
        ]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
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
        $activity = $this->activityCounts($user);

        if (array_sum($activity) > 0) {
            return $this->refuse(__(':name has :activity. Deactivate the account instead to keep them.', [
                'name' => $user->name,
                'activity' => CountPhrase::of($activity),
            ]));
        }

        $user->delete();

        Inertia::flash('toast', [
            'type' => 'success',
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
    }
}
