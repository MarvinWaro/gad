<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A certificate's design, to use on GAD events: its kind, background,
        // wording with blanks, extra logos and up to three signatories in the
        // order they sign. Like its signatories, it is a region's or the
        // Central Office's.
        Schema::create('certificate_designs', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('survey_region_id')->nullable()->constrained()->nullOnDelete();
            $table->string('kind', 20);
            $table->string('name', 120);
            $table->string('background', 20);
            $table->text('body');
            $table->json('logo_paths');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('survey_region_id');
        });

        Schema::create('certificate_design_signatory', function (Blueprint $table) {
            $table->foreignUlid('certificate_design_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('certificate_signatory_id')->constrained()->restrictOnDelete();
            $table->unsignedTinyInteger('position');
            $table->primary(['certificate_design_id', 'certificate_signatory_id']);
            $table->unique(['certificate_design_id', 'position'], 'certificate_design_signatory_position_unique');
            $table->index('certificate_signatory_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificate_design_signatory');
        Schema::dropIfExists('certificate_designs');
    }
};
