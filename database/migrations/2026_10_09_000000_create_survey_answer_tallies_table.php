<?php

use App\Models\SurveyAnswerTally;
use App\Models\SurveyResponse;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Answers counted per day, survey, place, respondent group and sex:
        // counts only, never a person. A survey's Summary reads these, so its
        // charts outlive the responses (App\Models\SurveyAnswerTally).
        Schema::create('survey_answer_tallies', function (Blueprint $table) {
            $table->id();
            // A hash of the other dimensions, as on survey_response_tallies.
            $table->char('key', 40)->unique();
            // The day the response arrived, in Philippine time.
            $table->date('date');
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->constrained()->nullOnDelete();
            $table->string('respondent_group', 60)->nullable();
            $table->string('sex', 40)->nullable();
            $table->string('question', 60);
            $table->string('answer', 80);
            $table->string('detail', 80)->nullable();
            $table->unsignedInteger('responses')->default(0);
            $table->index(['survey_id', 'question', 'date']);
            $table->index(['survey_region_id', 'date']);
        });

        // The responses already kept count as if they had just arrived.
        SurveyResponse::query()->chunkById(500, function ($responses): void {
            foreach ($responses as $response) {
                SurveyAnswerTally::add($response);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_answer_tallies');
    }
};
