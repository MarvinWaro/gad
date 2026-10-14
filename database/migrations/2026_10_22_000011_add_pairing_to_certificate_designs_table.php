<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A Certificate of Participation and a Certificate of Appearance made as
     * a pair (docs/certificates.md, decided 2026-10-14): edited on their own,
     * but used on events and released together. The pair is kept once, on
     * the one made from the other; deleting either leaves the other alone.
     */
    public function up(): void
    {
        Schema::table('certificate_designs', function (Blueprint $table) {
            $table->foreignUlid('paired_with_id')->nullable()->unique()->after('kind')
                ->constrained('certificate_designs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('certificate_designs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paired_with_id');
        });
    }
};
