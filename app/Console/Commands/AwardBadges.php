<?php

namespace App\Console\Commands;

use App\Actions\Badges\AwardEarnedBadges;
use App\Models\User;
use Illuminate\Console\Command;

class AwardBadges extends Command
{
    protected $signature = 'badges:award';

    protected $description = 'Give everyone who has posted the badges their posts already earn (after launch, or after a badge is switched back on)';

    public function handle(AwardEarnedBadges $awarder): int
    {
        $given = 0;

        User::query()
            ->whereHas('posts')
            ->chunkById(200, function ($users) use ($awarder, &$given): void {
                foreach ($users as $user) {
                    $given += count($awarder->for($user));
                }
            });

        $this->info("Gave {$given} badges.");

        return self::SUCCESS;
    }
}
