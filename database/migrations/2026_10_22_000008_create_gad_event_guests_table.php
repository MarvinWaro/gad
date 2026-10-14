<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guests at an event who have no PHLGADIS account, such as people from
     * other agencies (docs/event-registration.md). Staff add them by name and
     * mark the days they came; they get no Virtual ID, QR or notices.
     *
     * - `gad_event_guests`: who they are, as their certificate prints them.
     *   `sex` takes the profile's choices, for sex-disaggregated counts.
     * - `gad_event_guest_days`: one row per guest per Philippine day attended.
     */
    public function up(): void
    {
        Schema::create('gad_event_guests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('gad_event_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->string('organization', 160);
            $table->string('position', 120)->nullable();
            $table->string('sex', 10)->nullable();
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['gad_event_id', 'name']);
        });

        Schema::create('gad_event_guest_days', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('gad_event_guest_id')->constrained()->cascadeOnDelete();
            $table->date('attended_on');
            $table->foreignId('marked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->unique(['gad_event_guest_id', 'attended_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gad_event_guest_days');
        Schema::dropIfExists('gad_event_guests');
    }
};
