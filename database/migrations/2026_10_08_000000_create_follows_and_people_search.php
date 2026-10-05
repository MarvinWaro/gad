<?php

use App\Support\PeopleSearch;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Who follows whom: the Following feed and the profile counts.
        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('followed_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('created_at')->nullable();
            $table->unique(['follower_id', 'followed_id']);
            $table->index(['followed_id', 'created_at']);
        });

        // Search keys derived from the name (App\Support\PeopleSearch), kept
        // in step by the User model and never edited directly.
        Schema::table('users', function (Blueprint $table) {
            $table->string('search_name')->default('')->index();
            $table->string('search_sounds')->default('');
        });

        DB::table('users')->select(['id', 'name'])->chunkById(500, function ($users): void {
            foreach ($users as $user) {
                DB::table('users')->where('id', $user->id)->update(PeopleSearch::keysFor((string) $user->name));
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['search_name']);
            $table->dropColumn(['search_name', 'search_sounds']);
        });
        Schema::dropIfExists('follows');
    }
};
