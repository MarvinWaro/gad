<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The GAD Training and Compliance Surveys (App\Enums\ChecklistType):
        // one answer per HEI, checklist and academic year.
        Schema::create('checklist_responses', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('type', 20);
            $table->foreignId('survey_hei_id')->constrained()->restrictOnDelete();
            // Where the HEI stood when it first answered, so the answer stays
            // with the office it was sent to.
            $table->foreignId('survey_cluster_id')->index()->constrained()->restrictOnDelete();
            $table->foreignId('survey_region_id')->constrained()->restrictOnDelete();
            $table->string('academic_year', 9);
            $table->foreignId('submitted_by')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at');
            $table->timestamps();
            $table->unique(['survey_hei_id', 'type', 'academic_year'], 'checklist_period_unique');
            $table->index(['survey_region_id', 'type', 'academic_year']);
        });
        // One row per checked item; a response without rows checked none.
        Schema::create('checklist_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('checklist_response_id')->constrained()->cascadeOnDelete();
            $table->string('item_key', 50)->index();
            $table->unique(['checklist_response_id', 'item_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_answers');
        Schema::dropIfExists('checklist_responses');
    }
};
