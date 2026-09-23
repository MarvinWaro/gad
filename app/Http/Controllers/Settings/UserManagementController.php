<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreManagedUserRequest;
use App\Http\Requests\Settings\UpdateManagedUserRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $actorPermissions = $request->user()->permissionSlugs();

        $users = User::query()
            ->with('roles:id,name,slug')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('roles', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
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

        return Inertia::render('settings/users', [
            'users' => $users,
            'roles' => $roles,
            'filters' => ['search' => $search],
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

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->is($request->user())) {
            throw ValidationException::withMessages([
                'user' => __('You cannot delete your own account from user management.'),
            ]);
        }

        $this->ensureUserIsManageable($request->user(), $user);
        $this->ensureAdministratorRemains($user, []);
        $user->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('User deleted.'),
        ]);

        return to_route('settings.users.index');
    }

    /** @param array<int, int|string> $roleIds */
    private function ensureAdministratorRemains(User $user, array $roleIds): void
    {
        $adminRole = Role::query()->where('slug', 'admin')->first();

        if ($adminRole === null || ! $user->roles()->whereKey($adminRole->id)->exists()) {
            return;
        }

        if (in_array($adminRole->id, array_map('intval', $roleIds), true)) {
            return;
        }

        if ($adminRole->users()->count() <= 1) {
            throw ValidationException::withMessages([
                'role_ids' => __('The system must retain at least one administrator.'),
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
