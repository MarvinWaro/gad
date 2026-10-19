<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A smaller copy of each post photo for the feed's tiles (PhotoThumbnail);
     * the viewer still opens the photo itself. Null until one is made: the
     * feed then shows the photo. `php artisan posts:thumbnails` makes them
     * for photos posted before.
     */
    public function up(): void
    {
        Schema::table('post_images', function (Blueprint $table) {
            $table->string('thumbnail_path')->nullable()->after('path');
        });
    }

    public function down(): void
    {
        Schema::table('post_images', function (Blueprint $table) {
            $table->dropColumn('thumbnail_path');
        });
    }
};
