<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * The badges people earn by posting (App\Enums\BadgeRule). Their names
     * and descriptions can be changed in Settings → Badges; their rules
     * cannot.
     */
    private const SYSTEM_BADGES = [
        ['rule' => 'community-spark', 'name' => 'Community Spark', 'description' => 'Shared a first photo of GAD work tagged with an SDG or an A.C.H.I.E.V.E. item.'],
        ['rule' => 'visual-storyteller', 'name' => 'Visual Storyteller', 'description' => 'Shared tagged photos of GAD work on five different days.'],
        ['rule' => 'sdg-connector', 'name' => 'SDG Connector', 'description' => 'Shared GAD work supporting five different Sustainable Development Goals.'],
        ['rule' => 'agenda-builder', 'name' => 'Agenda Builder', 'description' => 'Shared GAD work supporting four different items of the A.C.H.I.E.V.E. Agenda.'],
    ];

    private const PERMISSIONS = [
        ['name' => 'View badges and who holds them', 'slug' => 'badges.view', 'group' => 'Badges'],
        ['name' => 'Create badges', 'slug' => 'badges.create', 'group' => 'Badges'],
        ['name' => 'Edit badges and switch them on or off', 'slug' => 'badges.update', 'group' => 'Badges'],
        ['name' => 'Delete badges', 'slug' => 'badges.delete', 'group' => 'Badges'],
        ['name' => 'Award badges by hand', 'slug' => 'badges.award', 'group' => 'Badges'],
    ];

    public function up(): void
    {
        // A badge: earned by its rule (the system badges), or, with no rule,
        // awarded by hand. A custom badge belongs to the office that made it;
        // a badge with no region is national.
        Schema::create('badges', function (Blueprint $table) {
            $table->ulid('id')->primary();
            // App\Enums\BadgeRule; null for a badge awarded by hand.
            $table->string('rule', 30)->nullable()->unique();
            $table->foreignId('survey_region_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('name', 60);
            $table->string('description', 200);
            // An uploaded picture shown instead of the medal.
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Who holds which badge, once each.
        Schema::create('badge_awards', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('badge_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Null: earned by the badge's rule.
            $table->foreignId('awarded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('note', 200)->nullable();
            $table->timestamp('awarded_at');
            $table->unique(['badge_id', 'user_id']);
            $table->index(['user_id', 'awarded_at']);
        });

        $now = now();
        DB::table('badges')->insert(array_map(fn (array $badge): array => [
            ...$badge,
            'id' => (string) Str::ulid(),
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], self::SYSTEM_BADGES));

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
        Schema::dropIfExists('badge_awards');
        Schema::dropIfExists('badges');
    }
};
