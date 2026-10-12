<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A certificate given to someone checked in to the event. Its number
        // is random, so the public verify page can't be walked through. The
        // name, affiliation and place are as they were when it was given.
        Schema::create('certificates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('gad_event_certificate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('number', 14)->unique();
            $table->string('name');
            $table->string('affiliation')->nullable();
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('issued_at');
            $table->timestamp('withdrawn_at')->nullable();
            $table->foreignId('withdrawn_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unique(['gad_event_certificate_id', 'user_id']);
            $table->index(['user_id', 'issued_at']);
            $table->index('survey_region_id');
            $table->index('survey_hei_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
