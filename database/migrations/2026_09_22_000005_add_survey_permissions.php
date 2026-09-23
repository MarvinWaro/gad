<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $permissions = [
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
        ];
        $now = now();

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $assignments = [
            'admin' => array_column($permissions, 'slug'),
            'gad-focal-person' => ['surveys.view', 'surveys.create', 'surveys.update'],
        ];

        foreach ($assignments as $roleSlug => $slugs) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if ($roleId === null) {
                continue;
            }
            foreach (DB::table('permissions')->whereIn('slug', $slugs)->pluck('id') as $permissionId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')->whereIn('slug', [
            'surveys.view', 'surveys.create', 'surveys.update', 'surveys.publish', 'surveys.delete',
            'survey-responses.view', 'survey-responses.export', 'survey-responses.delete',
            'survey-directories.view', 'survey-directories.create', 'survey-directories.update', 'survey-directories.delete',
        ])->delete();
    }
};
