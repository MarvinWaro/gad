<?php

namespace Database\Seeders;

use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * One account per role, for trying the app locally. DatabaseSeeder runs this
 * in the local environment only; the password is the admin's, 12345678.
 */
class DemoUserSeeder extends Seeder
{
    /** @var list<array{role: string, name: string, email: string}> */
    private const STAFF = [
        ['role' => 'ched-focal', 'name' => 'Demo CHED Focal', 'email' => 'ched-focal@phlgadis.test'],
        ['role' => 'ched-employee', 'name' => 'Demo CHED Employee', 'email' => 'ched-employee@phlgadis.test'],
    ];

    /** @var list<array{role: string, name: string, email: string}> */
    private const HEI = [
        ['role' => 'hei-focal', 'name' => 'Demo HEI Focal', 'email' => 'hei-focal@phlgadis.test'],
        ['role' => 'hei', 'name' => 'Demo HEI User', 'email' => 'hei@phlgadis.test'],
    ];

    public function run(): void
    {
        // Seed data may name Region XII; the directory seeders fill it.
        $region = SurveyRegion::query()->where('name', 'Regional Office XII')->firstOrFail();
        $hei = SurveyHei::query()
            ->where('is_active', true)
            ->whereHas('cluster', fn ($query) => $query->where('survey_region_id', $region->id))
            ->orderBy('name')
            ->firstOrFail();

        foreach (self::STAFF as $account) {
            $this->account($account, ['survey_region_id' => $region->id, 'national_access' => false]);
        }

        foreach (self::HEI as $account) {
            $this->account($account, ['survey_hei_id' => $hei->id]);
        }
    }

    /**
     * @param  array{role: string, name: string, email: string}  $account
     * @param  array<string, mixed>  $place  The office or HEI the account belongs to.
     */
    private function account(array $account, array $place): void
    {
        // Re-seeding keeps a changed password and place, as for the admin.
        $user = User::query()->firstOrCreate(
            ['email' => $account['email']],
            ['name' => $account['name'], 'password' => '12345678'],
        );

        if ($user->wasRecentlyCreated) {
            $user->forceFill(['email_verified_at' => now(), ...$place])->save();
        }

        $user->assignRole($account['role']);
    }
}
