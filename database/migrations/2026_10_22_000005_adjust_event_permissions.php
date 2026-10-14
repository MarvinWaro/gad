<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** What each role gains (+) or gives up (-), as RbacSeeder grants them. */
    private const CHANGES = [
        'ched-focal' => ['+' => ['events.view-registrations']],
        'gad-focal-person' => ['-' => ['events.create', 'events.update']],
    ];

    /**
     * GAD events belong to the CHED Focal of each region and to the Admin
     * (docs/event-registration.md, decided 2026-10-14): the CHED Focal sees
     * who joined its region's events, and GAD Focal Persons no longer add or
     * edit events. They keep checking people in.
     */
    public function up(): void
    {
        $this->apply('+', '-');
    }

    public function down(): void
    {
        $this->apply('-', '+');
    }

    /** Grants the `$grant` side of each change and takes back the `$revoke` side. */
    private function apply(string $grant, string $revoke): void
    {
        foreach (self::CHANGES as $slug => $change) {
            $role = DB::table('roles')->where('slug', $slug)->value('id');

            if ($role === null) {
                continue;
            }

            foreach (DB::table('permissions')->whereIn('slug', $change[$grant] ?? [])->pluck('id') as $permission) {
                DB::table('permission_role')->insertOrIgnore(['permission_id' => $permission, 'role_id' => $role]);
            }

            DB::table('permission_role')
                ->where('role_id', $role)
                ->whereIn('permission_id', DB::table('permissions')->whereIn('slug', $change[$revoke] ?? [])->select('id'))
                ->delete();
        }
    }
};
