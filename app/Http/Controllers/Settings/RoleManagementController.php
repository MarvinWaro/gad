<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreRoleRequest;
use App\Http\Requests\Settings\UpdateRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RoleManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $actorPermissions = $request->user()->permissionSlugs();

        $roles = Role::query()
            ->with('permissions:id,name,slug,group')
            ->withCount('users')
            ->when($search !== '', fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%"))
            ->orderByRaw("CASE WHEN slug = 'admin' THEN 0 ELSE 1 END")
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role): array => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'users_count' => $role->users_count,
                'permission_ids' => $role->permissions->pluck('id')->values(),
                'permissions_count' => $role->permissions->count(),
                'is_locked' => $role->slug === 'admin',
                'can_manage' => array_diff(
                    $role->permissions->pluck('slug')->all(),
                    $actorPermissions,
                ) === [],
            ]);

        $permissions = Permission::query()
            ->whereIn('slug', $actorPermissions)
            ->orderBy('group')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'group'])
            ->groupBy('group')
            ->map(fn ($items, string $group): array => [
                'group' => $group,
                'permissions' => $items->values(),
            ])
            ->values();

        return Inertia::render('settings/roles', [
            'roles' => $roles,
            'permissionGroups' => $permissions,
            'filters' => ['search' => $search],
            'permissions' => [
                'create' => $request->user()->can('roles.create'),
                'update' => $request->user()->can('roles.update'),
                'delete' => $request->user()->can('roles.delete'),
            ],
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $this->ensurePermissionsAreAssignable($request, $validated['permission_ids']);

        DB::transaction(function () use ($validated): void {
            $role = Role::query()->create([
                'name' => $validated['name'],
                'slug' => $this->uniqueSlug($validated['name']),
                'description' => $validated['description'] ?? null,
            ]);
            $role->permissions()->sync($validated['permission_ids']);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Role created.'),
        ]);

        return to_route('settings.roles.index');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->ensureRoleIsEditable($role);
        $this->ensureRoleIsManageable($request, $role);
        $validated = $request->validated();
        $this->ensurePermissionsAreAssignable($request, $validated['permission_ids']);

        DB::transaction(function () use ($role, $validated): void {
            $role->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);
            $role->permissions()->sync($validated['permission_ids']);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Role updated.'),
        ]);

        return to_route('settings.roles.index');
    }

    public function destroy(Request $request, Role $role): RedirectResponse
    {
        $this->ensureRoleIsEditable($role);
        $this->ensureRoleIsManageable($request, $role);

        if ($role->users()->exists()) {
            throw ValidationException::withMessages([
                'role' => __('Move users to another role before deleting this role.'),
            ]);
        }

        $role->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Role deleted.'),
        ]);

        return to_route('settings.roles.index');
    }

    private function ensureRoleIsEditable(Role $role): void
    {
        abort_if($role->slug === 'admin', 403, 'The Administrator role is system locked.');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'role';
        $slug = $base;
        $suffix = 2;

        while (Role::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    /** @param array<int, int|string> $permissionIds */
    private function ensurePermissionsAreAssignable(Request $request, array $permissionIds): void
    {
        $selectedSlugs = Permission::query()
            ->whereKey($permissionIds)
            ->pluck('slug')
            ->all();

        if (array_diff($selectedSlugs, $request->user()->permissionSlugs()) !== []) {
            throw ValidationException::withMessages([
                'permission_ids' => __('You cannot grant permissions above your own access.'),
            ]);
        }
    }

    private function ensureRoleIsManageable(Request $request, Role $role): void
    {
        $role->loadMissing('permissions:id,slug');

        if (array_diff(
            $role->permissions->pluck('slug')->all(),
            $request->user()->permissionSlugs(),
        ) !== []) {
            throw ValidationException::withMessages([
                'role' => __('You cannot manage a role with permissions above your own access.'),
            ]);
        }
    }
}
