<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A design used on a GAD event, one of each kind. Once released it
        // keeps what its certificates print (the design, signatories, office
        // and event as they were) in `snapshot`, so later changes never
        // rewrite a certificate already given out.
        Schema::create('gad_event_certificates', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('gad_event_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('certificate_design_id')->constrained()->restrictOnDelete();
            $table->timestamp('released_at')->nullable();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('snapshot')->nullable();
            $table->timestamps();
            $table->unique(['gad_event_id', 'certificate_design_id']);
            $table->index('certificate_design_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gad_event_certificates');
    }
};
