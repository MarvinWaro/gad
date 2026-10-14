<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Joining a GAD event (docs/event-registration.md).
     *
     * - `ulid`: the event's public identifier, for its page (/events/{ulid}),
     *   a link staff can share. `id` stays the key. Nullable, as on users:
     *   GadEvent (HasUlids) fills it on creation, and NOT NULL would rebuild
     *   the table on SQLite, whose cascading foreign keys would take its
     *   check-ins and certificates with it.
     * - `registration_closes_at`: when joining stops, in Philippine
     *   wall-clock time like `starts_at`. Null: open until the event ends.
     */
    public function up(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->ulid('ulid')->nullable()->unique()->after('id');
            $table->dateTime('registration_closes_at')->nullable()->after('ends_at');
        });

        // As HasUlids makes them: lowercase.
        DB::table('gad_events')->whereNull('ulid')->select('id')->chunkById(500, function ($events): void {
            foreach ($events as $event) {
                DB::table('gad_events')->where('id', $event->id)->update(['ulid' => strtolower((string) Str::ulid())]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->dropUnique(['ulid']);
            $table->dropColumn(['ulid', 'registration_closes_at']);
        });
    }
};
