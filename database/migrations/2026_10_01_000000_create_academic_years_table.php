<?php

use App\Support\AcademicPeriod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->unsignedSmallInteger('start_year')->unique();
            $table->string('label', 9)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        DB::table('academic_years')->insert(array_map(fn (string $label): array => [
            'id' => (string) Str::ulid(),
            'start_year' => (int) substr($label, 0, 4),
            'label' => $label,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], AcademicPeriod::calendarOptions()));

        $permissions = [
            ['name' => 'View academic years', 'slug' => 'academic-years.view', 'group' => 'Academic years'],
            ['name' => 'Create academic years', 'slug' => 'academic-years.create', 'group' => 'Academic years'],
            ['name' => 'Update academic years', 'slug' => 'academic-years.update', 'group' => 'Academic years'],
            ['name' => 'Delete academic years', 'slug' => 'academic-years.delete', 'group' => 'Academic years'],
        ];
        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
        if ($adminRoleId !== null) {
            foreach (DB::table('permissions')->whereIn('slug', array_column($permissions, 'slug'))->pluck('id') as $permissionId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $adminRoleId,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')->whereIn('slug', [
            'academic-years.view', 'academic-years.create', 'academic-years.update', 'academic-years.delete',
        ])->delete();
        Schema::dropIfExists('academic_years');
    }
};
