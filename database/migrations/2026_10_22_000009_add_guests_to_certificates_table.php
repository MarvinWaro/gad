<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A certificate belongs to an account (`user_id`) or to an event's guest
     * (`gad_event_guest_id`), never both (docs/certificates.md). A guest's is
     * printed by staff; its name and organization are kept on it as for
     * anyone. A guest who holds one can't be removed.
     */
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->foreignUlid('gad_event_guest_id')->nullable()->after('user_id')->constrained()->restrictOnDelete();
            $table->unique(['gad_event_certificate_id', 'gad_event_guest_id']);
        });
    }

    public function down(): void
    {
        DB::table('certificates')->whereNull('user_id')->delete();

        Schema::table('certificates', function (Blueprint $table) {
            $table->dropUnique(['gad_event_certificate_id', 'gad_event_guest_id']);
            $table->dropConstrainedForeignId('gad_event_guest_id');
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
