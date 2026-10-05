<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const PERMISSIONS = [
        ['name' => 'Play GAD Quest', 'slug' => 'quests.play', 'group' => 'GAD Quest'],
        ['name' => 'View GAD quests and their results', 'slug' => 'quests.view', 'group' => 'GAD Quest'],
        ['name' => 'Create GAD quests', 'slug' => 'quests.create', 'group' => 'GAD Quest'],
        ['name' => 'Edit, open and close GAD quests', 'slug' => 'quests.update', 'group' => 'GAD Quest'],
        ['name' => 'Delete GAD quests', 'slug' => 'quests.delete', 'group' => 'GAD Quest'],
    ];

    /**
     * Who gets which, as in RbacSeeder. Administrators hold every permission,
     * but User::playsQuests() keeps them from playing.
     */
    private const GRANTS = [
        'admin' => ['quests.play', 'quests.view', 'quests.create', 'quests.update', 'quests.delete'],
        'ched-focal' => ['quests.play', 'quests.view', 'quests.create', 'quests.update', 'quests.delete'],
        'ched-employee' => ['quests.play'],
        'gad-focal-person' => ['quests.play'],
        'hei' => ['quests.play'],
        'hei-focal' => ['quests.play'],
    ];

    public function up(): void
    {
        // A short quiz written by a regional office (or the Central Office,
        // for every region) for its people to play during a GAD activity.
        Schema::create('quests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            // Null: every region's people may play it.
            $table->foreignId('survey_region_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('title', 120);
            $table->string('description', 500)->nullable();
            // App\Enums\QuestStatus: draft, open or closed.
            $table->string('status', 10)->default('draft');
            $table->boolean('allow_retakes')->default(false);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->index(['survey_region_id', 'status']);
        });

        Schema::create('quest_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('quest_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->string('prompt', 300);
            $table->string('explanation', 600);
            $table->timestamps();
            $table->unique(['quest_id', 'position']);
        });

        Schema::create('quest_choices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quest_question_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('position');
            $table->string('label', 200);
            $table->boolean('is_correct')->default(false);
            $table->unique(['quest_question_id', 'position']);
        });

        // One play of a quest. The score is never stored: it is the number of
        // answers whose choice is correct. The place is where the player was
        // when they played.
        Schema::create('quest_attempts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('quest_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
            $table->index(['quest_id', 'user_id']);
            $table->index(['user_id', 'finished_at']);
        });

        Schema::create('quest_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('quest_attempt_id')->constrained()->cascadeOnDelete();
            $table->foreignId('quest_question_id')->constrained()->restrictOnDelete();
            $table->foreignId('quest_choice_id')->constrained()->restrictOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->unique(['quest_attempt_id', 'quest_question_id']);
        });

        $now = now();
        foreach (self::PERMISSIONS as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $permissionIds = DB::table('permissions')->whereIn('slug', array_column(self::PERMISSIONS, 'slug'))->pluck('id', 'slug');
        $roleIds = DB::table('roles')->whereIn('slug', array_keys(self::GRANTS))->pluck('id', 'slug');
        foreach (self::GRANTS as $role => $slugs) {
            if (! isset($roleIds[$role])) {
                continue;
            }
            foreach ($slugs as $slug) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionIds[$slug],
                    'role_id' => $roleIds[$role],
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')->whereIn('slug', array_column(self::PERMISSIONS, 'slug'))->delete();
        Schema::dropIfExists('quest_answers');
        Schema::dropIfExists('quest_attempts');
        Schema::dropIfExists('quest_choices');
        Schema::dropIfExists('quest_questions');
        Schema::dropIfExists('quests');
    }
};
