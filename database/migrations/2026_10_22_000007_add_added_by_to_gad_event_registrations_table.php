<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Who put someone on an event's list (docs/event-registration.md): the
     * staff member who added them, such as an invitee from another region
     * or a walk-in from the paper sheet. Null when they joined themselves.
     */
    public function up(): void
    {
        Schema::table('gad_event_registrations', function (Blueprint $table) {
            $table->foreignId('added_by')->nullable()->after('survey_hei_id')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('gad_event_registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('added_by');
        });
    }
};
