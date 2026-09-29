<?php

namespace App\Support;

use App\Models\MonitoringReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class MonitoringAccess
{
    public static function national(User $user): bool
    {
        self::prime([$user]);

        return request()->attributes->get('monitoring_access_'.$user->id)['national'];
    }

    /** @return list<int> */
    public static function regions(User $user): array
    {
        self::prime([$user]);

        return request()->attributes->get('monitoring_access_'.$user->id)['regions'];
    }

    /** @param array<User> $users */
    public static function prime(array $users): void
    {
        $ids = collect($users)->filter(fn (User $user) => ! request()->attributes->has('monitoring_access_'.$user->id))->pluck('id');
        if ($ids->isEmpty()) {
            return;
        }
        $national = DB::table('monitoring_reviewer_access')->whereIn('user_id', $ids)->pluck('national_access', 'user_id');
        $regions = DB::table('monitoring_reviewer_regions')->whereIn('user_id', $ids)->get()->groupBy('user_id');
        foreach ($ids as $id) {
            request()->attributes->set('monitoring_access_'.$id, [
                'national' => (bool) ($national[$id] ?? false),
                'regions' => ($regions[$id] ?? collect())->pluck('survey_region_id')->map(fn ($region) => (int) $region)->values()->all(),
            ]);
        }
    }

    public static function assigned(User $user): bool
    {
        return self::national($user) || self::regions($user) !== [];
    }

    /**
     * @param  Builder<MonitoringReport>  $query
     * @return Builder<MonitoringReport>
     */
    public static function scope(Builder $query, User $user): Builder
    {
        return self::national($user) ? $query : $query->whereIn('survey_region_id', self::regions($user));
    }
}
