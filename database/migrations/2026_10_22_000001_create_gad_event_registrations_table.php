<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Who joined a GAD event before it, once each (docs/event-registration.md).
        // Only they are checked in and given its certificates. The place is
        // where the person belonged when they joined.
        Schema::create('gad_event_registrations', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('gad_event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('joined_at');
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('survey_hei_id')->nullable()->constrained()->nullOnDelete();
            $table->unique(['gad_event_id', 'user_id']);
            $table->index(['gad_event_id', 'joined_at']);
            $table->index(['user_id', 'joined_at']);
            $table->index('survey_region_id');
            $table->index('survey_hei_id');
        });

        // People checked in before Join existed came as walk-ins. They count
        // as having joined, from their first check-in, so the certificates
        // still to be released reach them.
        DB::table('gad_event_check_ins')
            ->selectRaw('gad_event_id, user_id, min(checked_in_at) as joined_at')
            ->groupBy('gad_event_id', 'user_id')
            ->orderBy('gad_event_id')
            ->orderBy('user_id')
            ->chunk(500, function ($people): void {
                $rows = [];

                foreach ($people as $person) {
                    $first = DB::table('gad_event_check_ins')
                        ->where('gad_event_id', $person->gad_event_id)
                        ->where('user_id', $person->user_id)
                        ->orderBy('checked_in_at')
                        ->first(['survey_region_id', 'survey_hei_id']);

                    $rows[] = [
                        'id' => strtolower((string) Str::ulid()),
                        'gad_event_id' => $person->gad_event_id,
                        'user_id' => $person->user_id,
                        'joined_at' => $person->joined_at,
                        'survey_region_id' => $first?->survey_region_id,
                        'survey_hei_id' => $first?->survey_hei_id,
                    ];
                }

                DB::table('gad_event_registrations')->insertOrIgnore($rows);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('gad_event_registrations');
    }
};
