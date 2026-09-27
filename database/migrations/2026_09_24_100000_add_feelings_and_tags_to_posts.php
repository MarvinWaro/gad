<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            // A PostFeeling value, e.g. "proud"; null when none was chosen.
            $table->string('feeling', 30)->nullable()->after('body');
        });

        Schema::create('post_tags', function (Blueprint $table) {
            $table->foreignUlid('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['post_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_tags');

        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn('feeling');
        });
    }
};
