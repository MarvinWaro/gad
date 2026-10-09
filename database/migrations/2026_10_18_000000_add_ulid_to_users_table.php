<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Each account's public identifier, for its profile address and follow
     * links (/people/{ulid}), so the database number never opens a page and
     * profiles cannot be walked through by counting. `id` stays the key.
     *
     * The column stays nullable: User (HasUlids) fills it on creation, and
     * making it NOT NULL would rebuild the users table on SQLite, whose
     * cascading foreign keys would take the accounts' posts with it.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->ulid('ulid')->nullable()->unique()->after('id');
        });

        // As HasUlids makes them: lowercase.
        DB::table('users')->whereNull('ulid')->select('id')->chunkById(500, function ($users): void {
            foreach ($users as $user) {
                DB::table('users')->where('id', $user->id)->update(['ulid' => strtolower((string) Str::ulid())]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['ulid']);
            $table->dropColumn('ulid');
        });
    }
};
