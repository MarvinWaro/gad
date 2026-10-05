<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * A row for each GAD Quest level (App\Enums\QuestLevel), worded as the
     * badges read before, so Settings → Badges can rename them and give them
     * pictures. Who holds them still comes from the quests (docs/badges.md).
     */
    private const LEVELS = [
        ['quest_level' => 'participant', 'name' => 'Participant', 'description' => 'Finished the quest'],
        ['quest_level' => 'advocate', 'name' => 'Advocate', 'description' => 'Scored 80% or higher'],
        ['quest_level' => 'champion', 'name' => 'Champion', 'description' => 'Answered every question correctly'],
    ];

    public function up(): void
    {
        Schema::table('badges', function (Blueprint $table) {
            // App\Enums\QuestLevel; null for every other badge.
            $table->string('quest_level', 12)->nullable()->unique()->after('rule');
        });

        $now = now();
        DB::table('badges')->insert(array_map(fn (array $level): array => [
            ...$level,
            'id' => (string) Str::ulid(),
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], self::LEVELS));
    }

    public function down(): void
    {
        DB::table('badges')->whereNotNull('quest_level')->delete();

        Schema::table('badges', function (Blueprint $table) {
            $table->dropUnique(['quest_level']);
            $table->dropColumn('quest_level');
        });
    }
};
