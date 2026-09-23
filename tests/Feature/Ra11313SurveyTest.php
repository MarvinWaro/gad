<?php

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    $this->survey = Survey::query()->where('slug', 'ra-11313')->sole();

    $this->region = SurveyRegion::query()->where('name', 'Region XII')->sole();
    $this->cluster = SurveyCluster::query()->create([
        'survey_region_id' => $this->region->id, 'name' => 'Test Cluster', 'is_active' => true,
    ]);
    $this->hei = SurveyHei::query()->create([
        'survey_cluster_id' => $this->cluster->id, 'name' => 'Test HEI', 'is_active' => true,
    ]);
});

function publishRa11313(): void
{
    test()->survey->draftVersion()->update(['retention_days' => 365]);
    test()->actingAs(test()->admin)
        ->post(route('admin.surveys.publish', test()->survey))
        ->assertSessionHasNoErrors();
}

/** @return array<string, mixed> */
function ra11313Payload(array $overrides = []): array
{
    return [...[
        'version_id' => test()->survey->refresh()->publishedVersion()->id,
        'age' => 21,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => test()->region->id,
        'cluster_id' => test()->cluster->id,
        'hei_id' => test()->hei->id,
        'experiences' => ['catcalling'],
        'perpetrators' => ['catcalling' => ['teacher']],
        'other_relative_details' => [],
        'selections' => ['locations' => ['school', 'online']],
        'consent' => true,
    ], ...$overrides];
}

test('RA 11313 seeds as a draft for the Safe Spaces Act', function () {
    expect($this->survey->law_title)->toBe('Safe Spaces Act (Republic Act 11313)')
        ->and($this->survey->status)->toBe('active')
        ->and($this->survey->publishedVersion())->toBeNull()
        ->and($this->survey->draftVersion()->version)->toBe(1);
});

test('its sex question offers exactly the two supplied choices', function () {
    $sex = collect($this->survey->draftVersion()->definition['sections'])
        ->flatMap(fn ($section) => $section['questions'])
        ->firstWhere('id', 'sex');

    expect(array_column($sex['options'], 'value'))->toBe(['female', 'male'])
        ->and($sex)->not->toHaveKey('locked');
});

test('it asks where the harassment happened as a check-all-that-apply question', function () {
    $locations = collect($this->survey->draftVersion()->definition['sections'])
        ->flatMap(fn ($section) => $section['questions'])
        ->firstWhere('id', 'locations');

    expect($locations['type'])->toBe('multi_select')
        ->and($locations['required'])->toBeTrue()
        ->and(array_column($locations['options'], 'value'))->toBe([
            'school', 'church', 'restaurant', 'mall',
            'transportation-terminal', 'public-utility-vehicle', 'online',
        ]);
});

test('it passes the publish gate and reaches the public page', function () {
    publishRa11313();

    expect($this->survey->refresh()->publishedVersion()->version)->toBe(1);

    $this->get(route('surveys.show', ['law' => 'ra-11313']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/show')
            ->where('survey.slug', 'ra-11313')
            ->where('survey.code', 'RA 11313'));
});

test('a submission records the chosen locations alongside the experiences', function () {
    publishRa11313();

    $this->post(route('surveys.responses.store', $this->survey), ra11313Payload())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $response = SurveyResponse::query()->sole();

    expect($response->answers['selections']['locations'])->toBe(['school', 'online'])
        ->and($response->answers['experiences'])->toBe(['catcalling'])
        ->and($response->public_reference)->toStartWith('RA11313-');
});

test('the locations question must be answered because it is required', function () {
    publishRa11313();

    $this->post(route('surveys.responses.store', $this->survey), ra11313Payload([
        'selections' => ['locations' => []],
    ]))->assertSessionHasErrors('selections.locations');

    expect(SurveyResponse::query()->count())->toBe(0);
});

test('a location outside the questionnaire is rejected', function () {
    publishRa11313();

    $this->post(route('surveys.responses.store', $this->survey), ra11313Payload([
        'selections' => ['locations' => ['school', 'outer-space']],
    ]))->assertSessionHasErrors('selections.locations.1');

    expect(SurveyResponse::query()->count())->toBe(0);
});

test('duplicate locations are rejected rather than double-counted', function () {
    publishRa11313();

    $this->post(route('surveys.responses.store', $this->survey), ra11313Payload([
        'selections' => ['locations' => ['school', 'school']],
    ]))->assertSessionHasErrors('selections.locations.1');
});

test('the locations reach the reviewer views and the export', function () {
    publishRa11313();
    $this->post(route('surveys.responses.store', $this->survey), ra11313Payload())
        ->assertSessionHasNoErrors();
    $response = SurveyResponse::query()->sole();

    $this->actingAs($this->admin)
        ->get(route('admin.surveys.responses.show', [$this->survey, $response]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('response.answers.selections.locations', ['school', 'online'])
            ->where('response.answer_labels.selections.locations.label', 'Where did you experience these sexual harassments?')
            ->where('response.answer_labels.selections.locations.options.school', 'School'));

    $csv = $this->actingAs($this->admin)
        ->get(route('admin.surveys.responses.export', $this->survey))
        ->streamedContent();

    expect($csv)->toContain('Where did you experience these sexual harassments?')
        ->and($csv)->toContain('school; online');
});

test('surveys without a check-all-that-apply question are unaffected', function () {
    $ra7877 = Survey::query()->where('slug', 'ra-7877')->sole();
    $ra7877->draftVersion()->update(['retention_days' => 365]);
    $this->actingAs($this->admin)->post(route('admin.surveys.publish', $ra7877))
        ->assertSessionHasNoErrors();

    $this->post(route('surveys.responses.store', $ra7877), [
        'version_id' => $ra7877->refresh()->publishedVersion()->id,
        'age' => 33, 'sex' => 'male', 'respondent_group' => 'student',
        'region_id' => $this->region->id, 'cluster_id' => $this->cluster->id,
        'hei_id' => $this->hei->id, 'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->answers)->not->toHaveKey('selections');
});

test('seeding twice does not duplicate RA 11313', function () {
    $this->seed(SurveySeeder::class);

    expect(Survey::query()->where('slug', 'ra-11313')->count())->toBe(1)
        ->and($this->survey->refresh()->versions()->count())->toBe(1);
});
