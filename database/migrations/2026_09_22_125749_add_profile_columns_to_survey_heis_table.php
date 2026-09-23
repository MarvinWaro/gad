<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_heis', function (Blueprint $table) {
            // The Unique Institutional Identifier is CHED's own key for an
            // institution, entered by hand today and filled from the portal's
            // instCode once its API is reachable. It is the stable identity
            // across syncs, so a rename never orphans collected responses.
            $table->string('uii', 40)->nullable()->unique()->after('survey_cluster_id');
            $table->string('ownership', 20)->nullable()->after('name');
            $table->timestamp('portal_synced_at')->nullable()->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('survey_heis', function (Blueprint $table) {
            $table->dropUnique(['uii']);
            $table->dropColumn(['uii', 'ownership', 'portal_synced_at']);
        });
    }
};
