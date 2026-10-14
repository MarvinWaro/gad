<?php

use App\Support\ParticipantCode;
use App\Support\PeopleSearch;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Accounts seeded with model events off (the first administrator, and the
     * local demo accounts) missed what the User model gives every account:
     * the Virtual ID code its QR holds, and the search keys from its name.
     * Without a code, Settings → Virtual ID fails for them.
     */
    public function up(): void
    {
        DB::table('users')
            ->where(fn ($query) => $query->whereNull('participant_code')->orWhere('search_name', ''))
            ->select(['id', 'name', 'participant_code', 'search_name'])
            ->chunkById(500, function ($users): void {
                foreach ($users as $user) {
                    DB::table('users')->where('id', $user->id)->update([
                        ...($user->participant_code === null ? ['participant_code' => ParticipantCode::unique()] : []),
                        ...($user->search_name === '' ? PeopleSearch::keysFor((string) $user->name) : []),
                    ]);
                }
            });
    }

    /** The codes and keys are what every account has, so they stay. */
    public function down(): void {}
};
