<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<int, array{name: string, slug: string, group: string}> */
    private array $permissions = [
        ['name' => 'View website feedback', 'slug' => 'feedback.view', 'group' => 'Website feedback'],
        ['name' => 'Export website feedback', 'slug' => 'feedback.export', 'group' => 'Website feedback'],
        ['name' => 'Delete website feedback', 'slug' => 'feedback.delete', 'group' => 'Website feedback'],
    ];

    public function up(): void
    {
        // What visitors send through the public feedback form (/feedback),
        // which replaced the old system's Google Form. The visitor's name,
        // email and place are optional; no IP address, browser details or
        // account is kept.
        Schema::create('site_feedback', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('type', 16)->index();
            $table->text('feedback');
            $table->text('suggestions')->nullable();
            // One nullable score per rated question (App\Support\FeedbackQuestions):
            // the two four-choice questions, then the 1-to-5 scales.
            foreach ([
                'reading_ease', 'information_clarity',
                'terms_consistent', 'messages_consistent', 'prompts_clear', 'progress_informed', 'aesthetically_pleasing',
                'navigation_ease', 'exploring_ease', 'user_friendliness',
            ] as $column) {
                $table->unsignedTinyInteger($column)->nullable();
            }
            $table->string('email')->nullable();
            $table->string('name', 160)->nullable();
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_cluster_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index('created_at');
            $table->index(['survey_region_id', 'created_at']);
        });

        $now = now();

        foreach ($this->permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        // The administrators who run PHLGADIS read it; other roles can be
        // given it in Settings → Roles.
        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');

        if ($adminRoleId !== null) {
            foreach (DB::table('permissions')->whereIn('slug', array_column($this->permissions, 'slug'))->pluck('id') as $permissionId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $adminRoleId,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')
            ->whereIn('slug', array_column($this->permissions, 'slug'))
            ->delete();

        Schema::dropIfExists('site_feedback');
    }
};
