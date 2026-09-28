<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // A PostFeeling value, e.g. "proud"; null when none was chosen.
            $table->string('feeling', 30)->nullable()->after('body');
        });

        Schema::create('post_tags', function (Blueprint $table) {
            $table->foreignUlid('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['post_id', 'user_id']);
        });

        // The Sustainable Development Goals (1–17) a post's activity
        // supports. Indexed by goal for counts across regions and years.
        Schema::create('post_sdgs', function (Blueprint $table) {
            $table->foreignUlid('post_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('sdg');
            $table->primary(['post_id', 'sdg']);
            $table->index('sdg');
        });

        // The A.C.H.I.E.V.E. Agenda items it supports, as App\Enums\AchieveItem
        // codes, e.g. "lifelong-learning".
        Schema::create('post_achieve_items', function (Blueprint $table) {
            $table->foreignUlid('post_id')->constrained()->cascadeOnDelete();
            $table->string('item', 30);
            $table->primary(['post_id', 'item']);
            $table->index('item');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_achieve_items');
        Schema::dropIfExists('post_sdgs');
        Schema::dropIfExists('post_tags');

        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('feeling');
        });
    }
};
