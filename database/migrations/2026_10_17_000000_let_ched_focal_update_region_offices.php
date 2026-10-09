<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** As RbacSeeder lists it. */
    private const PERMISSION = ['name' => 'Update office details', 'slug' => 'region-offices.update', 'group' => 'Regional offices'];

    /**
     * A regional office keeps its own letterhead up to date (Settings →
     * Regions → Office details): its CHED Focal, for their own region only
     * (SurveyRegionPolicy). Administrators, and any role that could change
     * office details through the directory, keep it for the regions they reach.
     */
    public function up(): void
    {
        $now = now();
        DB::table('permissions')->updateOrInsert(
            ['slug' => self::PERMISSION['slug']],
            [...self::PERMISSION, 'created_at' => $now, 'updated_at' => $now],
        );

        $permission = DB::table('permissions')->where('slug', self::PERMISSION['slug'])->value('id');
        $roles = DB::table('roles')->whereIn('slug', ['admin', 'ched-focal'])->pluck('id')
            ->merge(DB::table('permission_role')
                ->where('permission_id', DB::table('permissions')->where('slug', 'survey-directories.update')->value('id'))
                ->pluck('role_id'))
            ->unique();

        foreach ($roles as $role) {
            DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
        }
    }

    public function down(): void
    {
        DB::table('permissions')->where('slug', self::PERMISSION['slug'])->delete();
    }
};
