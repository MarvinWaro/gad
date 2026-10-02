<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Survey responses counted per day, survey, place, respondent group
        // and sex: counts only, never a person. Statistics read these, so
        // they outlive the responses themselves, which are deleted when
        // their retention period ends (App\Models\SurveyResponseTally).
        Schema::create('survey_response_tallies', function (Blueprint $table) {
            $table->id();
            // A hash of the other dimensions. Any of them may be empty, and
            // empty values never collide in a unique index, so the hash is
            // what makes "add one to this row" safe.
            $table->char('key', 40)->unique();
            // The day the response arrived, in Philippine time.
            $table->date('date')->index();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_cluster_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->constrained()->nullOnDelete();
            $table->string('respondent_group', 60)->nullable();
            $table->string('sex', 40)->nullable();
            $table->unsignedInteger('responses')->default(0);
            $table->index(['survey_region_id', 'date']);
            $table->index(['survey_hei_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_response_tallies');
    }
};
