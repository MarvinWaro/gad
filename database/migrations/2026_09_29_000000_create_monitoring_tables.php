<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monitoring_reports', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('survey_hei_id')->constrained()->restrictOnDelete();
            $table->foreignId('survey_cluster_id')->index()->constrained()->restrictOnDelete();
            $table->foreignId('survey_region_id')->constrained()->restrictOnDelete();
            // The HEI's name when the report began: it is printed for signing
            // and must not change if the directory later renames the HEI.
            $table->string('institution_name');
            $table->string('academic_year', 9)->index();
            $table->unsignedTinyInteger('semester');
            $table->string('status')->default('draft')->index();
            $table->unsignedInteger('lock_version')->default(0);
            $table->timestamps();
            $table->unique(['survey_hei_id', 'academic_year', 'semester'], 'monitoring_period_unique');
            $table->index(['survey_region_id', 'status']);
        });
        Schema::create('monitoring_revisions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('monitoring_report_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('number');
            $table->string('template_version');
            $table->text('address')->nullable();
            $table->date('accomplished_on')->nullable();
            $table->string('president_name')->nullable();
            $table->string('focal_person_name')->nullable();
            // Finalizing locks the answers for signing; the hash of what was
            // locked gives the document code printed on the signed copy.
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->char('content_hash', 64)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['monitoring_report_id', 'number']);
        });
        Schema::create('monitoring_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('monitoring_revision_id')->constrained()->cascadeOnDelete();
            $table->string('requirement_key');
            // Up to 20,000 characters, which can exceed MySQL's 64 KB TEXT.
            $table->mediumText('answer');
            $table->unique(['monitoring_revision_id', 'requirement_key']);
        });
        Schema::create('monitoring_attachments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('monitoring_revision_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('original_name');
            $table->unsignedBigInteger('size');
            $table->foreignId('uploaded_by')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
        Schema::create('monitoring_reviews', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('monitoring_revision_id')->index()->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->string('reviewer_name');
            $table->string('decision');
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['monitoring_reviews', 'monitoring_attachments', 'monitoring_answers', 'monitoring_revisions', 'monitoring_reports'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
