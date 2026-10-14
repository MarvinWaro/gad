<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** As RbacSeeder lists it. */
    private const PERMISSION = ['name' => 'See who joined GAD events', 'slug' => 'events.view-registrations', 'group' => 'GAD events'];

    /**
     * How many joined an event, and who, is for the staff member who added
     * it and for whoever holds this: Administrators, unless they grant it to
     * another role (GadEventPolicy::viewRegistrations).
     */
    public function up(): void
    {
        $now = now();
        DB::table('permissions')->updateOrInsert(
            ['slug' => self::PERMISSION['slug']],
            [...self::PERMISSION, 'created_at' => $now, 'updated_at' => $now],
        );

        $permission = DB::table('permissions')->where('slug', self::PERMISSION['slug'])->value('id');

        foreach (DB::table('roles')->where('slug', 'admin')->pluck('id') as $role) {
            DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
        }
    }

    public function down(): void
    {
        DB::table('permissions')->where('slug', self::PERMISSION['slug'])->delete();
    }
};
