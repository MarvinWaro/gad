<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('survey_hei_id')->nullable()->after('email')->constrained('survey_heis')->nullOnDelete();
            $table->string('mobile_number', 11)->nullable()->after('survey_hei_id');
            $table->string('sex', 6)->nullable()->after('mobile_number');
            // Existing and admin-created accounts are active; public
            // registrations set pending explicitly and wait for approval.
            $table->string('status', 20)->default('active')->index()->after('sex');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('survey_hei_id');
            $table->dropIndex(['status']);
            $table->dropColumn(['mobile_number', 'sex', 'status']);
        });
    }
};
