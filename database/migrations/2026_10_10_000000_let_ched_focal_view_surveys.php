<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * A regional GAD focal (CHED Focal) reads the law surveys without changing
     * them: the library, the insights, each survey's Summary and the
     * questionnaire. Individual responses stay with `survey-responses.view`.
     */
    public function up(): void
    {
        $role = DB::table('roles')->where('slug', 'ched-focal')->value('id');
        $permission = DB::table('permissions')->where('slug', 'surveys.view')->value('id');

        if ($role !== null && $permission !== null) {
            DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
        }
    }

    public function down(): void
    {
        DB::table('permission_role')
            ->where('role_id', DB::table('roles')->where('slug', 'ched-focal')->value('id'))
            ->where('permission_id', DB::table('permissions')->where('slug', 'surveys.view')->value('id'))
            ->delete();
    }
};
