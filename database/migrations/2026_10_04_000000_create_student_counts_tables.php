<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CHED's discipline groups, in the order and words of CHED RO XII's
     * enrollment and graduate files (2026-10-03), in title case. Imports add
     * any other group they name (App\Actions\Statistics\ReplaceStudentCounts).
     */
    private const DISCIPLINE_GROUPS = [
        'Agricultural, Forestry, and Fisheries',
        'Architectural and Town-Planning',
        'Business Administration and Related',
        'Criminal Justice Education',
        'Education Science and Teacher Training',
        'Engineering',
        'Fine and Applied Arts',
        'Humanities',
        'IT-Related',
        'Maritime',
        'Mass Communication and Documentation',
        'Mathematics',
        'Medical and Allied',
        'Natural Science',
        'Other Disciplines',
        'Religion and Theology',
        'Service Trades',
        'Social and Behavioral Sciences',
    ];

    private const PERMISSIONS = [
        ['name' => 'View enrollment and graduates', 'slug' => 'student-counts.view', 'group' => 'Enrollment and graduates'],
        ['name' => 'Import enrollment and graduates', 'slug' => 'student-counts.import', 'group' => 'Enrollment and graduates'],
        ['name' => 'Delete enrollment and graduates', 'slug' => 'student-counts.delete', 'group' => 'Enrollment and graduates'],
    ];

    public function up(): void
    {
        Schema::create('discipline_groups', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            $table->unsignedSmallInteger('sort_order');
            $table->timestamps();
        });

        // Sex-disaggregated enrollment and graduates: a region's count of
        // women and men in one discipline group for one academic year. Totals
        // are added up when read, never stored.
        Schema::create('student_counts', function (Blueprint $table) {
            $table->id();
            // App\Enums\StudentCountKind: enrollment or graduates.
            $table->string('kind', 20);
            $table->foreignId('survey_region_id')->constrained()->restrictOnDelete();
            $table->foreignUlid('academic_year_id')->constrained()->restrictOnDelete();
            $table->foreignId('discipline_group_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('male');
            $table->unsignedInteger('female');
            $table->timestamps();
            $table->unique(['kind', 'survey_region_id', 'academic_year_id', 'discipline_group_id'], 'student_counts_place_unique');
            $table->index(['academic_year_id', 'kind']);
        });

        $now = now();
        DB::table('discipline_groups')->insert(array_map(fn (string $name, int $index): array => [
            'name' => $name,
            'sort_order' => $index + 1,
            'created_at' => $now,
            'updated_at' => $now,
        ], self::DISCIPLINE_GROUPS, array_keys(self::DISCIPLINE_GROUPS)));

        foreach (self::PERMISSIONS as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
        if ($adminRoleId !== null) {
            foreach (DB::table('permissions')->whereIn('slug', array_column(self::PERMISSIONS, 'slug'))->pluck('id') as $permissionId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $adminRoleId,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')->whereIn('slug', array_column(self::PERMISSIONS, 'slug'))->delete();
        Schema::dropIfExists('student_counts');
        Schema::dropIfExists('discipline_groups');
    }
};
