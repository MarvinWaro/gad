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
 *
 * Each group can also ask follow-up questions of its own (Civilian asks
 * "Occupation"), written by administrators. Questions, their choices and the
 * answers to them each get a table, so the answers can be counted with plain
 * SQL and the database itself keeps them consistent.
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

        Schema::create('survey_group_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_respondent_group_id')->constrained()->cascadeOnDelete();
            // Set once from the first label and never changed, so renaming a
            // question keeps the answers already collected against it.
            $table->string('key', 60);
            $table->string('label', 160);
            // How the question is shown: "select" (a dropdown) or "radio".
            $table->string('type', 10);
            $table->boolean('required')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            // A question removed after it was answered is retired rather than
            // deleted: its answers keep their meaning and its key is never
            // handed to another question.
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['survey_respondent_group_id', 'key'], 'survey_group_questions_key_unique');
        });

        Schema::create('survey_group_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('survey_group_questions')->cascadeOnDelete();
            // Like a question's key: set once and never changed.
            $table->string('value', 80);
            $table->string('label', 160);
            // A choice such as "Others" that asks the respondent to specify.
            $table->boolean('requires_text')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            // Retired, like a question, once it has been chosen.
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['question_id', 'value'], 'survey_group_options_value_unique');
            // Lets an answer's (question, choice) pair reference its choice, so
            // a choice can only answer the question it belongs to.
            $table->unique(['question_id', 'id'], 'survey_group_options_question_unique');
        });

        Schema::create('survey_group_answers', function (Blueprint $table) {
            $table->id();
            // Answers go with their response, including when it expires.
            $table->foreignUlid('survey_response_id')->constrained()->cascadeOnDelete();
            // A question or choice that has been answered cannot be deleted;
            // the settings editor retires it instead.
            $table->foreignId('question_id')->constrained('survey_group_questions')->restrictOnDelete();
            $table->unsignedBigInteger('option_id');
            // What the respondent typed for a choice that asks to specify.
            $table->string('text', 160)->nullable();

            $table->unique(['survey_response_id', 'question_id'], 'survey_group_answers_question_unique');
            $table->foreign(['question_id', 'option_id'], 'survey_group_answers_option_foreign')
                ->references(['question_id', 'id'])
                ->on('survey_group_options')
                ->restrictOnDelete();
            $table->index('option_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_group_answers');
        Schema::dropIfExists('survey_group_options');
        Schema::dropIfExists('survey_group_questions');
        Schema::dropIfExists('survey_respondent_groups');
    }
};
