<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Whether an event shows on the public website's GAD events page and the
     * homepage (docs/event-registration.md): on unless staff turn it off, as
     * for an internal meeting. Deadlines never show, whatever it says.
     * Existing events become public.
     *
     * The public list reads public events by their start, and finds those
     * still on by their end (GadEvent::scopeNotEndedAt), however many past
     * events there are.
     */
    public function up(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->boolean('is_public')->default(true)->after('category');
            $table->index(['is_public', 'starts_at']);
            $table->index('ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->dropIndex(['ends_at']);
            $table->dropIndex(['is_public', 'starts_at']);
            $table->dropColumn('is_public');
        });
    }
};
