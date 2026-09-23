<?php

use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Create an institution, with its region and cluster, for tests that link
 * accounts to an HEI.
 *
 * @param  array<string, mixed>  $attributes
 */
function createSurveyHei(array $attributes = []): SurveyHei
{
    $region = SurveyRegion::query()->firstOrCreate(['name' => 'Regional Office XII'], ['is_active' => true]);
    $cluster = SurveyCluster::query()->firstOrCreate(
        ['survey_region_id' => $region->id, 'name' => 'South Cotabato'],
        ['is_active' => true],
    );

    return SurveyHei::query()->create([
        'survey_cluster_id' => $cluster->id,
        'name' => 'Notre Dame of Marbel University',
        'is_active' => true,
        ...$attributes,
    ]);
}

/**
 * A valid public registration payload.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function registrationPayload(SurveyHei $hei, array $overrides = []): array
{
    return [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'survey_hei_id' => $hei->id,
        'mobile_number' => '0917 123 4567',
        'sex' => 'female',
        'password' => 'password',
        'password_confirmation' => 'password',
        ...$overrides,
    ];
}
