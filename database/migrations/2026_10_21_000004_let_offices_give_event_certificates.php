<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** As RbacSeeder lists them. */
    private const PERMISSIONS = [
        ['name' => 'View certificates and signatories', 'slug' => 'certificates.view', 'group' => 'Certificates'],
        ['name' => 'Create certificates and signatories', 'slug' => 'certificates.create', 'group' => 'Certificates'],
        ['name' => 'Edit certificates and signatories', 'slug' => 'certificates.update', 'group' => 'Certificates'],
        ['name' => 'Delete certificates and signatories', 'slug' => 'certificates.delete', 'group' => 'Certificates'],
        ['name' => 'Release and withdraw event certificates', 'slug' => 'certificates.release', 'group' => 'Certificates'],
    ];

    /** The offices that give GAD event certificates. */
    private const ROLES = ['admin', 'ched-focal'];

    /**
     * Offices design certificates, keep their signatories, and release
     * certificates to the people checked in to their events
     * (docs/certificates.md).
     */
    public function up(): void
    {
        $now = now();
        foreach (self::PERMISSIONS as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $permissions = DB::table('permissions')->whereIn('slug', array_column(self::PERMISSIONS, 'slug'))->pluck('id');

        foreach (DB::table('roles')->whereIn('slug', self::ROLES)->pluck('id') as $role) {
            foreach ($permissions as $permission) {
                DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')->whereIn('slug', array_column(self::PERMISSIONS, 'slug'))->delete();
    }
};
