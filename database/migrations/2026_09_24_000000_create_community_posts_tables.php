<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            // A ULID, not a counter: post links are shared, and a sequential
            // id would reveal how many posts exist and invite guessing others.
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // The author's institution when they posted, so a post keeps its
            // HEI even if the account later moves. Null for CHED staff.
            $table->foreignId('survey_hei_id')->nullable()->constrained('survey_heis')->nullOnDelete();
            $table->text('body')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('post_images', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('post_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            // The photo as people see it (EXIF rotation applied), so the feed
            // can give it the right shape before it loads. Null if unreadable.
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('post_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // A code from App\Enums\PostReaction: heart, care or clap.
            $table->string('type', 16);
            $table->timestamps();
            // One reaction per person; choosing another replaces it.
            $table->unique(['post_id', 'user_id']);
            $table->index(['post_id', 'type']);
        });

        Schema::create('post_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_comments');
        Schema::dropIfExists('post_reactions');
        Schema::dropIfExists('post_images');
        Schema::dropIfExists('posts');
    }
};
