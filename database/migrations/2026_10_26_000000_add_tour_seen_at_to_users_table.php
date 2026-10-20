<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * When the account finished, or closed, the HEI home's guided tour.
     * Null until then: the tour starts by itself on its next visit home.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('tour_seen_at')->nullable()->after('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('tour_seen_at');
        });
    }
};
