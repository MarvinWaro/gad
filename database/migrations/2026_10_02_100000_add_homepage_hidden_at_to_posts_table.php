<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // When a moderator kept the post off the public homepage's
            // stories (App\Support\HomepageStories); null while it may appear.
            $table->timestamp('homepage_hidden_at')->nullable()->after('shared_post_id');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('homepage_hidden_at');
        });
    }
};
