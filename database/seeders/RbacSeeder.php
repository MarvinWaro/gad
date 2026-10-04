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
            ['name' => 'View academic years', 'slug' => 'academic-years.view', 'group' => 'Academic years'],
            ['name' => 'Create academic years', 'slug' => 'academic-years.create', 'group' => 'Academic years'],
            ['name' => 'Update academic years', 'slug' => 'academic-years.update', 'group' => 'Academic years'],
            ['name' => 'Delete academic years', 'slug' => 'academic-years.delete', 'group' => 'Academic years'],
            ['name' => 'View GAD events', 'slug' => 'events.view', 'group' => 'GAD events'],
            ['name' => 'Create GAD events', 'slug' => 'events.create', 'group' => 'GAD events'],
            ['name' => 'Update GAD events', 'slug' => 'events.update', 'group' => 'GAD events'],
            ['name' => 'Delete GAD events', 'slug' => 'events.delete', 'group' => 'GAD events'],
            ['name' => 'View and post in Gender Mainstreaming', 'slug' => 'posts.view', 'group' => 'Community'],
            ['name' => 'Moderate community posts', 'slug' => 'posts.moderate', 'group' => 'Community'],
            ['name' => 'View site ratings', 'slug' => 'site-ratings.view', 'group' => 'Site ratings'],
            ['name' => 'Export site ratings', 'slug' => 'site-ratings.export', 'group' => 'Site ratings'],
            ['name' => 'Delete site ratings', 'slug' => 'site-ratings.delete', 'group' => 'Site ratings'],
            ['name' => 'Manage the rating button', 'slug' => 'site-ratings.update', 'group' => 'Site ratings'],
            ['name' => 'View website feedback', 'slug' => 'feedback.view', 'group' => 'Website feedback'],
            ['name' => 'Export website feedback', 'slug' => 'feedback.export', 'group' => 'Website feedback'],
            ['name' => 'Delete website feedback', 'slug' => 'feedback.delete', 'group' => 'Website feedback'],
            ['name' => 'Prepare and submit monitoring reports and GAD surveys', 'slug' => 'monitoring.submit', 'group' => 'Monitoring'],
            ['name' => 'View monitoring reports and GAD surveys', 'slug' => 'monitoring.view', 'group' => 'Monitoring'],
            ['name' => 'Review monitoring reports', 'slug' => 'monitoring.review', 'group' => 'Monitoring'],
            ['name' => 'View activity logs', 'slug' => 'activity-logs.view', 'group' => 'Activity logs'],
            ['name' => 'View enrollment and graduates', 'slug' => 'student-counts.view', 'group' => 'Enrollment and graduates'],
            ['name' => 'Import enrollment and graduates', 'slug' => 'student-counts.import', 'group' => 'Enrollment and graduates'],
            ['name' => 'Delete enrollment and graduates', 'slug' => 'student-counts.delete', 'group' => 'Enrollment and graduates'],
            ['name' => 'Play GAD Quest', 'slug' => 'quests.play', 'group' => 'GAD Quest'],
            ['name' => 'View GAD quests and their results', 'slug' => 'quests.view', 'group' => 'GAD Quest'],
            ['name' => 'Create GAD quests', 'slug' => 'quests.create', 'group' => 'GAD Quest'],
            ['name' => 'Edit, open and close GAD quests', 'slug' => 'quests.update', 'group' => 'GAD Quest'],
            ['name' => 'Delete GAD quests', 'slug' => 'quests.delete', 'group' => 'GAD Quest'],
            ['name' => 'View badges and who holds them', 'slug' => 'badges.view', 'group' => 'Badges'],
            ['name' => 'Create badges', 'slug' => 'badges.create', 'group' => 'Badges'],
            ['name' => 'Edit badges and switch them on or off', 'slug' => 'badges.update', 'group' => 'Badges'],
            ['name' => 'Delete badges', 'slug' => 'badges.delete', 'group' => 'Badges'],
            ['name' => 'Award badges by hand', 'slug' => 'badges.award', 'group' => 'Badges'],
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
                    'site-ratings.view',
                    'monitoring.view', 'monitoring.review',
                    'quests.play',
                ],
            ],
            // CHED staff. Each account's office (a region, or the Central
            // Office) decides whose reports it sees.
            'ched-focal' => [
                'name' => 'CHED Focal',
                'description' => 'Reviews the monitoring reports of HEIs in their office\'s region, sees their GAD surveys, posts in Gender Mainstreaming, and writes GAD quests for their region.',
                'permissions' => [
                    'monitoring.view', 'monitoring.review', 'posts.view',
                    'quests.play', 'quests.view', 'quests.create', 'quests.update', 'quests.delete',
                ],
            ],
            'ched-employee' => [
                'name' => 'CHED Employee',
                'description' => 'Views the monitoring reports and GAD surveys of their office\'s region and posts in Gender Mainstreaming.',
                'permissions' => ['monitoring.view', 'posts.view', 'quests.play'],
            ],
            // An HEI's own people (Role::HEI_SLUGS), placed through their HEI.
            'hei' => [
                'name' => 'HEI User',
                'description' => 'Registered HEI account. Dashboard only.',
                'permissions' => ['quests.play'],
            ],
            'hei-focal' => [
                'name' => 'HEI Focal',
                'description' => 'The HEI\'s GAD focal person: everything an HEI user has, plus the monitoring report and the GAD surveys.',
                'permissions' => ['monitoring.submit', 'quests.play'],
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
