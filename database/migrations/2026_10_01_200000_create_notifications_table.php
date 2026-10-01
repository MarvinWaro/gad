<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A notification tells one person about something. When someone did
        // it, the activity log already keeps who, what, where and when, so
        // the notification points at that entry. Only anonymous survey
        // answers, which are never logged, point at their subject instead.
        // Notifications are kept for good, like the activity log.
        Schema::create('notifications', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 40);
            $table->foreignUlid('activity_log_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('subject_type', 40)->nullable();
            $table->string('subject_id', 26)->nullable();
            // How many happened since the person last read it, for notices
            // that group, such as survey answers.
            $table->unsignedInteger('count')->default(1);
            // Newest first; a grouped notice moves up each time it counts up.
            $table->timestamp('notified_at')->useCurrent();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            // One notice per person for each thing that happened.
            $table->unique(['activity_log_id', 'user_id']);
            $table->index(['user_id', 'notified_at']);
            $table->index(['user_id', 'read_at']);
            $table->index(['user_id', 'kind']);
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
