<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When staff cancelled an event (docs/event-registration.md), a moment in
     * UTC; null while it is on. Its list of who joined stays, nobody joins
     * or checks in, and no certificate goes out. Restoring clears it.
     */
    public function up(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable()->after('registration_closes_at');
        });
    }

    public function down(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->dropColumn('cancelled_at');
        });
    }
};
