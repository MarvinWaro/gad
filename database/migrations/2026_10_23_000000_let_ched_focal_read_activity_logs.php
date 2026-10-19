<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * A regional office reads its own region's activity log (Settings →
     * Activity logs), as HEI accounts read their own on their profile:
     * ActivityLog::scopeWithinReachOf keeps a CHED Focal to their region.
     */
    public function up(): void
    {
        $permission = DB::table('permissions')->where('slug', 'activity-logs.view')->value('id');
        $role = DB::table('roles')->where('slug', 'ched-focal')->value('id');

        if ($permission !== null && $role !== null) {
            DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
        }
    }

    public function down(): void
    {
        DB::table('permission_role')
            ->where('permission_id', DB::table('permissions')->where('slug', 'activity-logs.view')->value('id'))
            ->where('role_id', DB::table('roles')->where('slug', 'ched-focal')->value('id'))
            ->delete();
    }
};
