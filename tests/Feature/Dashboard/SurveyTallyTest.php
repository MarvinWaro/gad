<?php

use App\Models\Survey;
use App\Models\SurveyHei;
use App\Models\SurveyResponse;
use App\Models\SurveyResponseTally;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
});

/** @param  array<string, mixed>  $overrides */
function talliedResponse(?SurveyHei $hei, array $overrides = []): SurveyResponse
{
    return SurveyResponse::query()->create([
        'survey_version_id' => Survey::query()->where('slug', 'ra-7877')->firstOrFail()->versions()->firstOrFail()->id,
        'public_reference' => Str::random(20),
        'age' => 20,
        'sex' => 'female',
        'respondent_group' => 'student',
        'survey_region_id' => $hei?->cluster->survey_region_id,
        'survey_cluster_id' => $hei?->survey_cluster_id,
        'survey_hei_id' => $hei?->id,
        'answers' => [],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
        ...$overrides,
    ]);
}

test('responses add themselves to their day, and a single delete takes one back', function () {
    $hei = createSurveyHei();
    $first = talliedResponse($hei);
    talliedResponse($hei);
    talliedResponse($hei, ['sex' => 'male']);

    expect(SurveyResponseTally::query()->count())->toBe(2)
        ->and(SurveyResponseTally::query()->where('sex', 'female')->value('responses'))->toBe(2);

    // An administrator deleting one response, one at a time.
    $first->delete();

    expect(SurveyResponseTally::query()->where('sex', 'female')->value('responses'))->toBe(1)
        ->and((int) SurveyResponseTally::query()->sum('responses'))->toBe(2);
});

test('the retention prune deletes responses but keeps them counted', function () {
    $hei = createSurveyHei();
    talliedResponse($hei, ['expires_at' => now()->subDay()]);
    talliedResponse($hei, ['expires_at' => now()->subDay()]);

    $this->artisan('surveys:prune-expired')->assertSuccessful();

    expect(SurveyResponse::query()->count())->toBe(0)
        ->and((int) SurveyResponseTally::query()->sum('responses'))->toBe(2);
});

test('answers left out still share one row instead of a row each', function () {
    talliedResponse(null, ['sex' => null, 'respondent_group' => null]);
    talliedResponse(null, ['sex' => null, 'respondent_group' => null]);

    $tally = SurveyResponseTally::query()->sole();

    expect($tally->responses)->toBe(2)
        ->and($tally->survey_region_id)->toBeNull()
        ->and($tally->sex)->toBeNull();
});

test('a response counts on its Philippine day', function () {
    // 01:30 on 1 August in Manila is still 31 July in UTC.
    $this->travelTo(CarbonImmutable::parse('2026-07-31 17:30:00', 'UTC'));

    talliedResponse(createSurveyHei());

    expect(SurveyResponseTally::query()->sole()->date)->toStartWith('2026-08-01');
});
