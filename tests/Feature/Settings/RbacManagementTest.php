<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

function managedUserWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('management settings require the matching permissions', function () {
    $admin = managedUserWithRole('admin');
    $focal = managedUserWithRole('gad-focal-person');

    $this->actingAs($admin)
        ->get(route('settings.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/users')
            ->where('permissions.create', true)
            ->where('permissions.update', true)
            ->where('permissions.delete', true));

    $this->actingAs($admin)
        ->get(route('settings.roles.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/roles')
            ->has('permissionGroups')
            ->where('permissions.create', true));

    $this->actingAs($focal)
        ->get(route('settings.users.index'))
        ->assertForbidden();
    $this->actingAs($focal)
        ->get(route('settings.roles.index'))
        ->assertForbidden();
});

test('administrators can create update and delete users with roles', function () {
    $admin = managedUserWithRole('admin');
    $hei = Role::query()->where('slug', 'hei')->sole();
    $focal = Role::query()->where('slug', 'gad-focal-person')->sole();

    $this->actingAs($admin)
        ->post(route('settings.users.store'), [
            'name' => 'Regional User',
            'email' => 'regional@example.test',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role_ids' => [$hei->id],
        ])
        ->assertRedirect(route('settings.users.index'));

    $user = User::query()->where('email', 'regional@example.test')->sole();
    expect($user->hasRole('hei'))->toBeTrue();

    $this->actingAs($admin)
        ->put(route('settings.users.update', $user), [
            'name' => 'Regional Focal Person',
            'email' => 'regional@example.test',
            'password' => '',
            'password_confirmation' => '',
            'role_ids' => [$focal->id],
        ])
        ->assertRedirect(route('settings.users.index'));

    $user->refresh();
    expect($user->name)->toBe('Regional Focal Person')
        ->and($user->hasRole('gad-focal-person'))->toBeTrue()
        ->and($user->hasRole('hei'))->toBeFalse();

    $this->actingAs($admin)
        ->delete(route('settings.users.destroy', $user))
        ->assertRedirect(route('settings.users.index'));

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
});

test('user management protects the current and last administrator accounts', function () {
    $admin = managedUserWithRole('admin');
    $hei = Role::query()->where('slug', 'hei')->sole();

    $this->actingAs($admin)
        ->delete(route('settings.users.destroy', $admin))
        ->assertSessionHasErrors('user');

    $this->actingAs($admin)
        ->put(route('settings.users.update', $admin), [
            'name' => $admin->name,
            'email' => $admin->email,
            'password' => '',
            'password_confirmation' => '',
            'role_ids' => [$hei->id],
        ])
        ->assertSessionHasErrors('role_ids');

    expect($admin->fresh()?->hasRole('admin'))->toBeTrue();
});

test('administrators can create update and delete unassigned roles', function () {
    $admin = managedUserWithRole('admin');
    $viewCarousel = Permission::query()->where('slug', 'carousel.view')->sole();
    $updateCarousel = Permission::query()->where('slug', 'carousel.update')->sole();

    $this->actingAs($admin)
        ->post(route('settings.roles.store'), [
            'name' => 'Content Reviewer',
            'description' => 'Reviews public content.',
            'permission_ids' => [$viewCarousel->id],
        ])
        ->assertRedirect(route('settings.roles.index'));

    $role = Role::query()->where('slug', 'content-reviewer')->sole();
    expect($role->permissions()->pluck('slug')->all())
        ->toBe(['carousel.view']);

    $this->actingAs($admin)
        ->put(route('settings.roles.update', $role), [
            'name' => 'Content Publisher',
            'description' => null,
            'permission_ids' => [$viewCarousel->id, $updateCarousel->id],
        ])
        ->assertRedirect(route('settings.roles.index'));

    expect($role->fresh()?->name)->toBe('Content Publisher')
        ->and($role->permissions()->pluck('slug')->sort()->values()->all())
        ->toBe(['carousel.update', 'carousel.view']);

    $this->actingAs($admin)
        ->delete(route('settings.roles.destroy', $role))
        ->assertRedirect(route('settings.roles.index'));

    $this->assertDatabaseMissing('roles', ['id' => $role->id]);
});

test('roles grant live route access and assigned roles cannot be deleted', function () {
    $admin = managedUserWithRole('admin');
    $permission = Permission::query()->where('slug', 'carousel.view')->sole();
    $role = Role::query()->create([
        'name' => 'Carousel Reader',
        'slug' => 'carousel-reader',
    ]);
    $role->permissions()->attach($permission);
    $reader = User::factory()->create();
    $reader->roles()->attach($role);

    $this->actingAs($reader)
        ->get(route('admin.carousels.index'))
        ->assertOk();

    $this->actingAs($admin)
        ->delete(route('settings.roles.destroy', $role))
        ->assertSessionHasErrors('role');

    $this->assertDatabaseHas('roles', ['id' => $role->id]);
});

test('the administrator role is locked against edits and deletion', function () {
    $admin = managedUserWithRole('admin');
    $adminRole = Role::query()->where('slug', 'admin')->sole();

    $this->actingAs($admin)
        ->put(route('settings.roles.update', $adminRole), [
            'name' => 'Changed Administrator',
            'description' => null,
            'permission_ids' => [],
        ])
        ->assertForbidden();

    $this->actingAs($admin)
        ->delete(route('settings.roles.destroy', $adminRole))
        ->assertForbidden();

    expect($adminRole->fresh()?->name)->toBe('Administrator');
});

test('delegated managers cannot grant access above their own permissions', function () {
    $managerRole = Role::query()->create([
        'name' => 'Delegated Manager',
        'slug' => 'delegated-manager',
    ]);
    $managerRole->permissions()->attach(
        Permission::query()
            ->whereIn('slug', [
                'users.view',
                'users.update',
                'roles.view',
                'roles.create',
            ])
            ->pluck('id'),
    );
    $manager = User::factory()->create();
    $manager->roles()->attach($managerRole);
    $target = User::factory()->create();
    $adminRole = Role::query()->where('slug', 'admin')->sole();
    $deleteCarousel = Permission::query()->where('slug', 'carousel.delete')->sole();

    $this->actingAs($manager)
        ->get(route('settings.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('roles', fn ($roles) => collect($roles)
                ->doesntContain('slug', 'admin')));

    $this->actingAs($manager)
        ->put(route('settings.users.update', $target), [
            'name' => $target->name,
            'email' => $target->email,
            'password' => '',
            'password_confirmation' => '',
            'role_ids' => [$adminRole->id],
        ])
        ->assertSessionHasErrors('role_ids');

    $this->actingAs($manager)
        ->post(route('settings.roles.store'), [
            'name' => 'Escalated Role',
            'description' => null,
            'permission_ids' => [$deleteCarousel->id],
        ])
        ->assertSessionHasErrors('permission_ids');

    $this->assertDatabaseMissing('roles', ['slug' => 'escalated-role']);
    expect($target->fresh()?->roles)->toHaveCount(0);
});
