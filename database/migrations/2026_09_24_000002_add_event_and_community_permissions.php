<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var array<int, array{name: string, slug: string, group: string}> */
    private array $permissions = [
        ['name' => 'View GAD events', 'slug' => 'events.view', 'group' => 'GAD events'],
        ['name' => 'Create GAD events', 'slug' => 'events.create', 'group' => 'GAD events'],
        ['name' => 'Update GAD events', 'slug' => 'events.update', 'group' => 'GAD events'],
        ['name' => 'Delete GAD events', 'slug' => 'events.delete', 'group' => 'GAD events'],
        ['name' => 'Moderate community posts', 'slug' => 'posts.moderate', 'group' => 'Community'],
    ];

    /** @var array<string, array<int, string>> */
    private array $grants = [
        'admin' => ['events.view', 'events.create', 'events.update', 'events.delete', 'posts.moderate'],
        'gad-focal-person' => ['events.view', 'events.create', 'events.update'],
    ];

    public function up(): void
    {
        $now = now();

        foreach ($this->permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        foreach ($this->grants as $roleSlug => $slugs) {
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
        DB::table('permissions')
            ->whereIn('slug', array_column($this->permissions, 'slug'))
            ->delete();
    }
};
