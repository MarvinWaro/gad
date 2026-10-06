<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A GAD event is for one region's HEIs, or for every region's when it
     * names none. Events already kept belong where their author's office is;
     * the Central Office's stay for every region.
     */
    public function up(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->foreignId('survey_region_id')->nullable()->after('category')->constrained()->restrictOnDelete();
        });

        DB::table('users')
            ->where('national_access', false)
            ->whereNotNull('survey_region_id')
            ->whereIn('id', DB::table('gad_events')->whereNotNull('created_by')->select('created_by'))
            ->orderBy('id')
            ->get(['id', 'survey_region_id'])
            ->each(fn (object $author) => DB::table('gad_events')
                ->where('created_by', $author->id)
                ->update(['survey_region_id' => $author->survey_region_id]));
    }

    public function down(): void
    {
        Schema::table('gad_events', function (Blueprint $table) {
            $table->dropConstrainedForeignId('survey_region_id');
        });
    }
};
