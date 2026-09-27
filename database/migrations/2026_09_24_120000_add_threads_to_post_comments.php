<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('post_comments', function (Blueprint $table) {
            // Replies sit one level under a top-level comment, like Facebook;
            // removing a comment removes its replies.
            $table->foreignId('parent_id')
                ->nullable()
                ->after('post_id')
                ->constrained('post_comments')
                ->cascadeOnDelete();
            // Whose comment a reply answers, shown as their name before it.
            $table->foreignId('reply_to_user_id')
                ->nullable()
                ->after('user_id')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('post_comments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reply_to_user_id');
            $table->dropConstrainedForeignId('parent_id');
        });
    }
};
