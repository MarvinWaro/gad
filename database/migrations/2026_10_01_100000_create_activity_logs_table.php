<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Append-only: an entry is never edited, so there is no updated_at.
        // Entries are kept for good; the indexes carry the filters at
        // national volume.
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // Who acted, as they were named then, so the entry outlives the
            // account. For a failed login, the email that was typed.
            $table->string('actor_name');
            // Where it happened: the place of what was acted on when it has
            // one, otherwise the actor's. Kept as it was at the time.
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_cluster_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->string('module', 40);
            $table->string('action', 40);
            $table->string('subject_type', 40)->nullable();
            $table->string('subject_id', 26)->nullable();
            // What was acted on, as it was named then.
            $table->string('subject_label')->nullable();
            $table->json('changes')->nullable();
            $table->json('properties')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
            $table->index(['survey_region_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['module', 'created_at']);
            $table->index(['action', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
        });

        $now = now();
        DB::table('permissions')->updateOrInsert(
            ['slug' => 'activity-logs.view'],
            ['name' => 'View activity logs', 'group' => 'Activity logs', 'created_at' => $now, 'updated_at' => $now],
        );

        $adminRoleId = DB::table('roles')->where('slug', 'admin')->value('id');
        $permissionId = DB::table('permissions')->where('slug', 'activity-logs.view')->value('id');
        if ($adminRoleId !== null && $permissionId !== null) {
            DB::table('permission_role')->insertOrIgnore([
                'permission_id' => $permissionId,
                'role_id' => $adminRoleId,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
        DB::table('permissions')->where('slug', 'activity-logs.view')->delete();
    }
};
