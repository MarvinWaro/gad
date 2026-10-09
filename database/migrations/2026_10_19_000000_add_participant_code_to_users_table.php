<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Crockford's base32, as App\Support\ParticipantCode uses it. */
    private const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    /**
     * Every account's Virtual ID code, such as "GAD-7K2M-Q9XA", which its QR
     * holds (docs/virtual-id.md). New accounts get theirs when created.
     *
     * Nullable, as users.ulid is: NOT NULL through change() would rebuild the
     * users table on SQLite, whose cascading foreign keys would take the
     * accounts' posts with it.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('participant_code', 13)->nullable()->unique()->after('ulid');
        });

        DB::table('users')->whereNull('participant_code')->select('id')->chunkById(500, function ($users): void {
            foreach ($users as $user) {
                DB::table('users')->where('id', $user->id)->update(['participant_code' => $this->uniqueCode()]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['participant_code']);
            $table->dropColumn('participant_code');
        });
    }

    private function uniqueCode(): string
    {
        do {
            $characters = '';
            for ($index = 0; $index < 8; $index++) {
                $characters .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
            $code = 'GAD-'.substr($characters, 0, 4).'-'.substr($characters, 4);
        } while (DB::table('users')->where('participant_code', $code)->exists());

        return $code;
    }
};
