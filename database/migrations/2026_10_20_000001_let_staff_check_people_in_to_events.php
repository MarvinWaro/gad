<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** As RbacSeeder lists it. */
    private const PERMISSION = ['name' => 'Check people in to GAD events', 'slug' => 'events.check-in', 'group' => 'GAD events'];

    /** The staff who run registration tables at GAD events. */
    private const ROLES = ['admin', 'gad-focal-person', 'ched-focal', 'ched-employee'];

    /**
     * Staff check people in at GAD events with the QR scanner: at their own
     * region's events and every region's, the Central Office at any
     * (GadEventPolicy::checkIn).
     */
    public function up(): void
    {
        $now = now();
        DB::table('permissions')->updateOrInsert(
            ['slug' => self::PERMISSION['slug']],
            [...self::PERMISSION, 'created_at' => $now, 'updated_at' => $now],
        );

        $permission = DB::table('permissions')->where('slug', self::PERMISSION['slug'])->value('id');

        foreach (DB::table('roles')->whereIn('slug', self::ROLES)->pluck('id') as $role) {
            DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
        }
    }

    public function down(): void
    {
        DB::table('permissions')->where('slug', self::PERMISSION['slug'])->delete();
    }
};
