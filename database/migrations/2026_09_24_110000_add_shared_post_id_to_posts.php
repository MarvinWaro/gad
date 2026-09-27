<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // Set when the post is a share of another post. Removing the
            // original removes its shares too, so moderated content never
            // lives on through a repost.
            $table->foreignUlid('shared_post_id')
                ->nullable()
                ->after('feeling')
                ->constrained('posts')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shared_post_id');
        });
    }
};
