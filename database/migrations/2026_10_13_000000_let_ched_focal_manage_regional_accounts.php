<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var list<string> */
    private array $permissions = ['users.view', 'users.create', 'users.update'];

    /**
     * A regional GAD focal (CHED Focal) creates, approves, edits and
     * deactivates their own region's HEI and CHED Employee accounts. The
     * Administrator still provides the CHED Focal accounts, and deletes.
     */
    public function up(): void
    {
        $role = DB::table('roles')->where('slug', 'ched-focal')->value('id');

        if ($role === null) {
            return;
        }

        foreach (DB::table('permissions')->whereIn('slug', $this->permissions)->pluck('id') as $permission) {
            DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
        }
    }

    public function down(): void
    {
        DB::table('permission_role')
            ->where('role_id', DB::table('roles')->where('slug', 'ched-focal')->value('id'))
            ->whereIn('permission_id', DB::table('permissions')->whereIn('slug', $this->permissions)->select('id'))
            ->delete();
    }
};
