<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Respondent groups were baked into each survey's questionnaire, so adding one
 * meant editing every law's definition. They become a shared directory here,
 * managed like Regions, Clusters and HEIs.
 *
 * Responses keep storing the group's `value`, not its id: survey_responses
 * already holds that string and renaming a group must not orphan the answers
 * collected against it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('survey_respondent_groups', function (Blueprint $table) {
            $table->id();
            $table->string('value', 60)->unique();
            $table->string('label', 120);
            // Marks a catch-all entry such as "Other", which asks the
            // respondent to type what the list does not cover.
            $table->boolean('requires_text')->default(false);
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedSmallInteger('sort_order')->default(0)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_respondent_groups');
    }
};
