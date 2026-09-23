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
    $this->survey = Survey::query()->where('slug', 'ra-9710')->sole();

    $region = SurveyRegion::query()->where('name', 'Region XII')->sole();
    $this->cluster = SurveyCluster::query()->create([
        'survey_region_id' => $region->id, 'name' => 'Test Cluster', 'is_active' => true,
    ]);
    $this->hei = SurveyHei::query()->create([
        'survey_cluster_id' => $this->cluster->id, 'name' => 'Test HEI', 'is_active' => true,
    ]);
    $this->region = $region;
});

function publishRa9710(): void
{
    test()->survey->draftVersion()->update(['retention_days' => 365]);
    test()->actingAs(test()->admin)
        ->post(route('admin.surveys.publish', test()->survey))
        ->assertSessionHasNoErrors();
}

/** @return array<string, mixed> */
function ra9710Payload(array $overrides = []): array
{
    return [...[
        'version_id' => test()->survey->refresh()->publishedVersion()->id,
        'age' => 26,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => test()->region->id,
        'cluster_id' => test()->cluster->id,
        'hei_id' => test()->hei->id,
        'experiences' => ['expulsion-pregnancy'],
        'perpetrators' => ['expulsion-pregnancy' => ['superior-supervisor']],
        'other_relative_details' => [],
        'consent' => true,
    ], ...$overrides];
}

test('RA 9710 is seeded as a draft covering the Magna Carta of Women', function () {
    expect($this->survey->law_title)->toBe('Magna Carta of Women (Republic Act 9710)')
        ->and($this->survey->status)->toBe('active')
        ->and($this->survey->publishedVersion())->toBeNull()
        ->and($this->survey->draftVersion()->version)->toBe(1);
});

test('its sex question is fixed to female rather than merely defaulted', function () {
    $sex = collect($this->survey->draftVersion()->definition['sections'])
        ->flatMap(fn ($section) => $section['questions'])
        ->firstWhere('id', 'sex');

    expect($sex['locked'])->toBeTrue()
        ->and($sex['default'])->toBe('female')
        ->and($sex['required'])->toBeTrue()
        ->and(array_column($sex['options'], 'value'))->toBe(['female']);
});

test('it passes the publish gate and reaches the public page', function () {
    publishRa9710();

    expect($this->survey->refresh()->publishedVersion()->version)->toBe(1);

    $this->get(route('surveys.show', ['law' => 'ra-9710']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/show')
            ->where('survey.slug', 'ra-9710')
            ->where('survey.code', 'RA 9710'));
});

test('the landing page advertises it only once it is published', function () {
    // The fluent assertion hands the closure a Collection, not an array.
    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('openSurveys', fn ($slugs) => ! $slugs->contains('ra-9710')));

    publishRa9710();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->where('openSurveys', fn ($slugs) => $slugs->contains('ra-9710')));
});

test('a woman can complete it and the fixed answer is stored', function () {
    publishRa9710();

    $this->post(route('surveys.responses.store', $this->survey), ra9710Payload())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $response = SurveyResponse::query()->sole();

    expect($response->sex)->toBe('female')
        ->and($response->respondent_group)->toBe('student')
        ->and($response->answers['experiences'])->toBe(['expulsion-pregnancy'])
        ->and($response->public_reference)->toStartWith('RA9710-');
});

test('a crafted request cannot record any sex but female', function () {
    publishRa9710();

    $this->post(route('surveys.responses.store', $this->survey), ra9710Payload(['sex' => 'male']))
        ->assertSessionHasErrors('sex');

    expect(SurveyResponse::query()->count())->toBe(0);
});

test('it carries the Magna Carta discrimination experiences, not harassment ones', function () {
    $matrix = collect($this->survey->draftVersion()->definition['sections'])
        ->flatMap(fn ($section) => $section['questions'])
        ->firstWhere('type', 'experience_matrix');

    expect(array_column($matrix['options'], 'value'))->toBe([
        'expulsion-pregnancy',
        'restricted-services',
        'unequal-compensation',
        'restricted-promotions',
        'restricted-tasks',
        'restricted-employment',
    ])->and($matrix['none_option']['value'])->toBe('none');
});

test('its respondent groups come from the shared directory, not the questionnaire', function () {
    $group = collect($this->survey->draftVersion()->definition['sections'])
        ->flatMap(fn ($section) => $section['questions'])
        ->firstWhere('id', 'respondent_group');

    expect($group['type'])->toBe('directory_respondent_group')
        ->and($group)->not->toHaveKey('options');

    publishRa9710();

    $this->get(route('surveys.show', ['law' => 'ra-9710']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('directories.respondent_groups', fn ($groups) => $groups
                ->pluck('value')->all() === ['student', 'alumni', 'employee']));
});

test('seeding twice does not duplicate the survey or its draft', function () {
    $this->seed(SurveySeeder::class);

    expect(Survey::query()->where('slug', 'ra-9710')->count())->toBe(1)
        ->and($this->survey->refresh()->versions()->count())->toBe(1);
});
