<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Who came to a GAD event, once a day: staff scan the person's
        // Virtual ID or type its code (docs/event-check-in.md). The day is
        // the Philippine date, kept so the unique key allows one check-in a
        // day. The place is where the person belonged when checked in.
        Schema::create('gad_event_check_ins', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('gad_event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('attended_on');
            $table->timestamp('checked_in_at');
            $table->foreignId('checked_in_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('method', 10);
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->constrained()->nullOnDelete();
            $table->unique(['gad_event_id', 'user_id', 'attended_on']);
            $table->index(['gad_event_id', 'attended_on', 'checked_in_at']);
            $table->index(['user_id', 'attended_on']);
            $table->index('survey_region_id');
            $table->index('survey_hei_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gad_event_check_ins');
    }
};
