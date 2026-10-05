<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Administrators run the whole system, so each covers every region.
     * Admins given a regional office before 2026-10-07 become Central Office;
     * Settings → Users keeps them that way from now on.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereIn('id', DB::table('role_user')
                ->join('roles', 'roles.id', '=', 'role_user.role_id')
                ->where('roles.slug', 'admin')
                ->select('role_user.user_id'))
            ->update(['national_access' => true, 'survey_region_id' => null]);
    }

    public function down(): void
    {
        // Nothing to restore: the regional offices were not kept.
    }
};
