<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Someone who missed a day of an event asks for one of its certificates
     * (docs/certificates.md): the kind they want (one of the event's
     * released certificates) and why. Its office's staff approve, which gives
     * it, or decline with a note. One request per person per certificate.
     * `status` is `pending`, `approved` or `declined`.
     */
    public function up(): void
    {
        Schema::create('certificate_requests', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('gad_event_certificate_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 500);
            $table->string('status', 10)->default('pending');
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->string('note', 500)->nullable();
            $table->timestamps();

            $table->unique(['gad_event_certificate_id', 'user_id']);
            $table->index(['gad_event_certificate_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_requests');
    }
};
