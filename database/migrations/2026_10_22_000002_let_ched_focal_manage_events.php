<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** As RbacSeeder grants them; deleting events stays with the admin. */
    private const PERMISSIONS = ['events.view', 'events.create', 'events.update'];

    /**
     * The CHED Focal runs its region's GAD events: adds and edits them, closes
     * registration and sees who joined (GadEventPolicy keeps it to its own
     * region's events).
     */
    public function up(): void
    {
        $role = DB::table('roles')->where('slug', 'ched-focal')->value('id');

        if ($role === null) {
            return;
        }

        foreach (DB::table('permissions')->whereIn('slug', self::PERMISSIONS)->pluck('id') as $permission) {
            DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
        }
    }

    public function down(): void
    {
        $role = DB::table('roles')->where('slug', 'ched-focal')->value('id');

        DB::table('permission_role')
            ->where('role_id', $role)
            ->whereIn('permission_id', DB::table('permissions')->whereIn('slug', self::PERMISSIONS)->select('id'))
            ->delete();
    }
};
