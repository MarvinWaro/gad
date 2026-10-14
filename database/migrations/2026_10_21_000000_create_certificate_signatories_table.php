<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The people who sign event certificates, with their e-signature, kept
        // by their office: a region's, or the Central Office's (no region).
        // Removed ones stay, as released certificates still name them, and
        // signature files are never deleted (docs/certificates.md).
        Schema::create('certificate_signatories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 120);
            $table->string('position', 150);
            $table->string('signature_path');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index('survey_region_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_signatories');
    }
};
