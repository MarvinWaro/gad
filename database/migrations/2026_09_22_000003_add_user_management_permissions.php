<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $permissions = [
            ['name' => 'View users', 'slug' => 'users.view', 'group' => 'User management'],
            ['name' => 'Create users', 'slug' => 'users.create', 'group' => 'User management'],
            ['name' => 'Update users', 'slug' => 'users.update', 'group' => 'User management'],
            ['name' => 'Delete users', 'slug' => 'users.delete', 'group' => 'User management'],
            ['name' => 'View roles and permissions', 'slug' => 'roles.view', 'group' => 'Role management'],
            ['name' => 'Create roles', 'slug' => 'roles.create', 'group' => 'Role management'],
            ['name' => 'Update roles', 'slug' => 'roles.update', 'group' => 'Role management'],
            ['name' => 'Delete roles', 'slug' => 'roles.delete', 'group' => 'Role management'],
        ];

        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');

        if ($adminRoleId !== null) {
            $permissionIds = DB::table('permissions')
                ->whereIn('slug', array_column($permissions, 'slug'))
                ->pluck('id');

            foreach ($permissionIds as $permissionId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $adminRoleId,
                ]);
            }
        }
    }

    public function down(): void
    {
        $slugs = [
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
        ];

        DB::table('permissions')->whereIn('slug', $slugs)->delete();
    }
};
