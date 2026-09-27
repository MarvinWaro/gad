<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = collect([
            ['name' => 'View carousel slides', 'slug' => 'carousel.view', 'group' => 'Carousel'],
            ['name' => 'Create carousel slides', 'slug' => 'carousel.create', 'group' => 'Carousel'],
            ['name' => 'Update carousel slides', 'slug' => 'carousel.update', 'group' => 'Carousel'],
            ['name' => 'Delete carousel slides', 'slug' => 'carousel.delete', 'group' => 'Carousel'],
            ['name' => 'View users', 'slug' => 'users.view', 'group' => 'User management'],
            ['name' => 'Create users', 'slug' => 'users.create', 'group' => 'User management'],
            ['name' => 'Update users', 'slug' => 'users.update', 'group' => 'User management'],
            ['name' => 'Delete users', 'slug' => 'users.delete', 'group' => 'User management'],
            ['name' => 'View roles and permissions', 'slug' => 'roles.view', 'group' => 'Role management'],
            ['name' => 'Create roles', 'slug' => 'roles.create', 'group' => 'Role management'],
            ['name' => 'Update roles', 'slug' => 'roles.update', 'group' => 'Role management'],
            ['name' => 'Delete roles', 'slug' => 'roles.delete', 'group' => 'Role management'],
            ['name' => 'View surveys', 'slug' => 'surveys.view', 'group' => 'Surveys'],
            ['name' => 'Create surveys', 'slug' => 'surveys.create', 'group' => 'Surveys'],
            ['name' => 'Update survey drafts', 'slug' => 'surveys.update', 'group' => 'Surveys'],
            ['name' => 'Publish surveys', 'slug' => 'surveys.publish', 'group' => 'Surveys'],
            ['name' => 'Delete survey drafts', 'slug' => 'surveys.delete', 'group' => 'Surveys'],
            ['name' => 'View survey responses', 'slug' => 'survey-responses.view', 'group' => 'Survey responses'],
            ['name' => 'Export survey responses', 'slug' => 'survey-responses.export', 'group' => 'Survey responses'],
            ['name' => 'Delete survey responses', 'slug' => 'survey-responses.delete', 'group' => 'Survey responses'],
            ['name' => 'View survey directories', 'slug' => 'survey-directories.view', 'group' => 'Survey directories'],
            ['name' => 'Create survey directories', 'slug' => 'survey-directories.create', 'group' => 'Survey directories'],
            ['name' => 'Update survey directories', 'slug' => 'survey-directories.update', 'group' => 'Survey directories'],
            ['name' => 'Delete survey directories', 'slug' => 'survey-directories.delete', 'group' => 'Survey directories'],
            ['name' => 'View GAD events', 'slug' => 'events.view', 'group' => 'GAD events'],
            ['name' => 'Create GAD events', 'slug' => 'events.create', 'group' => 'GAD events'],
            ['name' => 'Update GAD events', 'slug' => 'events.update', 'group' => 'GAD events'],
            ['name' => 'Delete GAD events', 'slug' => 'events.delete', 'group' => 'GAD events'],
            ['name' => 'Moderate community posts', 'slug' => 'posts.moderate', 'group' => 'Community'],
        ])->mapWithKeys(function (array $attributes): array {
            $permission = Permission::query()->updateOrCreate(
                ['slug' => $attributes['slug']],
                $attributes,
            );

            return [$permission->slug => $permission];
        });

        $roles = collect([
            'admin' => [
                'name' => 'Administrator',
                'description' => 'Full platform administration access.',
                'permissions' => $permissions->keys()->all(),
            ],
            'gad-focal-person' => [
                'name' => 'GAD Focal Person',
                'description' => 'Creates and maintains approved GAD content.',
                'permissions' => [
                    'carousel.view', 'carousel.create', 'carousel.update',
                    'surveys.view', 'surveys.create', 'surveys.update',
                    'events.view', 'events.create', 'events.update',
                ],
            ],
            'hei' => [
                'name' => 'HEI User',
                'description' => 'Registered HEI account. Dashboard only.',
                'permissions' => [],
            ],
        ])->mapWithKeys(function (array $attributes, string $slug) use ($permissions): array {
            $role = Role::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $attributes['name'],
                    'description' => $attributes['description'],
                ],
            );
            $role->permissions()->sync(
                $permissions->only($attributes['permissions'])->pluck('id'),
            );

            return [$slug => $role];
        });

        User::query()
            ->whereDoesntHave('roles')
            ->each(fn (User $user) => $user->roles()->attach($roles['hei']->id));
    }
}
