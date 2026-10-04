<?php

namespace App\Actions\Badges;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Badge;
use App\Models\BadgeAward;
use App\Models\User;
use App\Services\ActivityRecorder;

/**
 * Gives a person the system badges whose rules they now meet: after they
 * post, and for everyone at once from `php artisan badges:award`. A badge
 * is earned once and kept; a badge switched off is not given.
 */
final class AwardEarnedBadges
{
    public function __construct(private readonly ActivityRecorder $activity) {}

    /** @return list<Badge> The badges they earned just now. */
    public function for(User $user): array
    {
        $held = $user->badgeAwards()->pluck('badge_id');
        $earned = [];

        $badges = Badge::query()
            ->whereNotNull('rule')
            ->where('is_active', true)
            ->whereKeyNot($held)
            ->get();

        foreach ($badges as $badge) {
            if ($badge->rule === null || ! $badge->rule->isMetBy($user)) {
                continue;
            }

            // Two requests at once cannot give it twice.
            $inserted = BadgeAward::query()->insertOrIgnore([
                'badge_id' => $badge->id,
                'user_id' => $user->id,
                'awarded_at' => now(),
            ]);

            if ($inserted > 0) {
                $this->activity->record(ActivityAction::Earned, ActivityModule::Badges, $badge, actor: $user);
                $earned[] = $badge;
            }
        }

        return $earned;
    }
}
