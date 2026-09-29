<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_regions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_active')->default(true)->index();
            // The regional office's letterhead, printed on its documents.
            // The name above is the office line, e.g. "Regional Office XII".
            $table->string('office_city')->nullable();
            $table->string('office_address')->nullable();
            $table->string('office_email')->nullable();
            $table->string('office_website')->nullable();
            $table->string('office_phone')->nullable();
            $table->timestamps();
        });

        Schema::create('survey_clusters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_region_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->unique(['survey_region_id', 'name']);
        });

        Schema::create('survey_heis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_cluster_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->unique(['survey_cluster_id', 'name']);
        });

        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('law_title');
            $table->string('image_path')->nullable();
            $table->string('status')->default('active')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('survey_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->string('status')->default('draft')->index();
            $table->text('introduction');
            $table->text('privacy_notice');
            $table->text('consent_text');
            $table->unsignedInteger('retention_days')->nullable();
            $table->json('definition');
            $table->timestamp('published_at')->nullable();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['survey_id', 'version']);
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            // A ULID, so admin URLs never reveal how many responses exist.
            // `public_reference` stays random: a ULID encodes its creation
            // time, which must not be handed to an anonymous respondent.
            $table->ulid('id')->primary();
            $table->foreignId('survey_version_id')->constrained()->restrictOnDelete();
            $table->string('public_reference', 32)->unique();
            $table->unsignedTinyInteger('age');
            $table->string('sex', 40)->index();
            $table->string('respondent_group', 60)->index();
            $table->string('respondent_group_other')->nullable();
            // Asked only after a Female or Male answer for sex
            // (App\Support\RespondentDetails). The chosen group's own
            // follow-up answers live in survey_group_answers.
            $table->string('gender_identity', 40)->nullable()->index();
            $table->foreignId('survey_region_id')->constrained()->restrictOnDelete();
            $table->foreignId('survey_cluster_id')->constrained()->restrictOnDelete();
            $table->foreignId('survey_hei_id')->constrained()->restrictOnDelete();
            $table->json('answers');
            $table->timestamp('consent_at');
            $table->timestamp('guardian_confirmed_at')->nullable();
            $table->timestamp('expires_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('survey_versions');
        Schema::dropIfExists('surveys');
        Schema::dropIfExists('survey_heis');
        Schema::dropIfExists('survey_clusters');
        Schema::dropIfExists('survey_regions');
    }
};
