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
});

function surveyUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function configureSurveyDirectories(): array
{
    $region = SurveyRegion::query()->where('name', 'Regional Office XII')->sole();
    $cluster = SurveyCluster::query()->create(['survey_region_id' => $region->id, 'name' => 'Test Cluster', 'is_active' => true]);
    $hei = SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => 'Test HEI', 'is_active' => true]);

    return [$region, $cluster, $hei];
}

function publishRa7877(): Survey
{
    configureSurveyDirectories();
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $draft = $survey->draftVersion();
    $draft->update(['retention_days' => 365, 'status' => 'published', 'published_at' => now()]);
    $survey->versions()->create([
        'version' => 2,
        'status' => 'draft',
        'introduction' => $draft->introduction,
        'privacy_notice' => $draft->privacy_notice,
        'consent_text' => $draft->consent_text,
        'retention_days' => 365,
        'definition' => $draft->definition,
    ]);

    return $survey->refresh();
}

test('survey permissions separate content, publication, directories, and responses', function () {
    $admin = surveyUser('admin');
    $focal = surveyUser('gad-focal-person');
    $hei = surveyUser('hei');

    expect($admin->can('surveys.publish'))->toBeTrue()
        ->and($admin->can('survey-responses.view'))->toBeTrue()
        ->and($focal->can('surveys.update'))->toBeTrue()
        ->and($focal->can('surveys.publish'))->toBeFalse()
        ->and($focal->can('survey-responses.view'))->toBeFalse()
        ->and($hei->can('surveys.view'))->toBeFalse();

    $this->actingAs($focal)->get(route('admin.surveys.index'))->assertOk();
    $this->actingAs($focal)->get(route('settings.regions.index'))->assertForbidden();
    $this->actingAs($hei)->get(route('admin.surveys.index'))->assertForbidden();
});

test('RA 7877 starts as a draft and publication requires directories and retention', function () {
    $admin = surveyUser('admin');
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();

    expect($survey->draftVersion())->not->toBeNull()
        ->and($survey->publishedVersion())->toBeNull();

    $this->actingAs($admin)->post(route('admin.surveys.publish', $survey))
        ->assertSessionHasErrors(['retention_days', 'directories']);

    [$region, $cluster, $hei] = configureSurveyDirectories();
    $survey->draftVersion()->update(['retention_days' => 365]);
    $this->actingAs($admin)->post(route('admin.surveys.publish', $survey))->assertRedirect();

    expect($survey->refresh()->publishedVersion()?->version)->toBe(1)
        ->and($survey->draftVersion()?->version)->toBe(2)
        ->and($region->is_active)->toBeTrue()
        ->and($cluster->is_active)->toBeTrue()
        ->and($hei->is_active)->toBeTrue();
});

test('the builder names every publish blocker before the editor clicks publish', function () {
    $admin = surveyUser('admin');
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();

    $this->actingAs($admin)->get(route('admin.surveys.edit', $survey))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/surveys/edit')
            ->has('readiness', 4)
            ->where('readiness.0.key', 'notices')
            ->where('readiness.0.passed', true)
            ->where('readiness.1.key', 'retention')
            ->where('readiness.1.passed', false)
            ->where('readiness.2.key', 'directories')
            ->where('readiness.2.passed', false)
            ->where('readiness.3.key', 'definition')
            ->where('readiness.3.passed', true)
            ->where('survey.published_version', null)
            ->where('survey.public_url', null));
});

test('clearing the blockers publishes the draft and opens the survey to the public', function () {
    $admin = surveyUser('admin');
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    configureSurveyDirectories();
    $survey->draftVersion()->update(['retention_days' => 365]);

    $this->actingAs($admin)->get(route('admin.surveys.edit', $survey))
        ->assertInertia(fn (Assert $page) => $page
            ->where('readiness.1.passed', true)
            ->where('readiness.2.passed', true));

    $this->actingAs($admin)->post(route('admin.surveys.publish', $survey))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('survey.version', 1));

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('openSurveys', ['ra-7877']));

    $this->actingAs($admin)->get(route('admin.surveys.edit', $survey))
        ->assertInertia(fn (Assert $page) => $page
            ->where('draft.version', 2)
            ->where('survey.published_version', 1)
            ->where('survey.public_url', route('surveys.show', ['law' => 'ra-7877'])));
});

test('publication rejects invalid question keys and incomplete directory chains', function () {
    $admin = surveyUser('admin');
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $draft = $survey->draftVersion();
    $definition = $draft->definition;
    $definition['sections'][1]['questions'][0]['id'] = 'age';
    $draft->update(['retention_days' => 365, 'definition' => $definition]);

    SurveyCluster::query()->create([
        'survey_region_id' => SurveyRegion::query()->sole()->id,
        'name' => 'Inactive cluster',
        'is_active' => false,
    ]);

    $this->actingAs($admin)->post(route('admin.surveys.publish', $survey))
        ->assertSessionHasErrors(['definition', 'directories']);
});

test('published surveys are archived instead of deleted', function () {
    $admin = surveyUser('admin');
    $survey = publishRa7877();

    $this->actingAs($admin)->delete(route('admin.surveys.destroy', $survey))
        ->assertSessionHasErrors('survey');
    $this->actingAs($admin)->patch(route('admin.surveys.archive', $survey))->assertRedirect();

    expect($survey->refresh()->status)->toBe('archived')
        ->and($survey->publishedVersion())->not->toBeNull();
});

test('draft surveys render a restrained unavailable public state', function () {
    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/show')
            ->where('survey', null)
            ->where('lawSlug', 'ra-7877'));
});

test('public page receives only the immutable published version', function () {
    $survey = publishRa7877();
    $publishedIntroduction = $survey->publishedVersion()->introduction;
    $survey->draftVersion()->update(['introduction' => 'Unpublished replacement copy.']);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/show')
            ->where('survey.version', 1)
            ->where('survey.introduction', $publishedIntroduction)
            ->has('directories.regions', 1)
            ->has('directories.clusters', 1)
            ->has('directories.heis', 1));
});

test('anonymous responses validate conditional answers and store no direct identifiers', function () {
    $survey = publishRa7877();
    [$region] = [SurveyRegion::query()->sole()];
    $cluster = SurveyCluster::query()->sole();
    $hei = SurveyHei::query()->sole();
    $version = $survey->publishedVersion();

    $payload = [
        'version_id' => $version->id,
        'age' => 22,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'cluster_id' => $cluster->id,
        'hei_id' => $hei->id,
        'experiences' => ['catcalling'],
        'perpetrators' => ['catcalling' => ['supervisor']],
        'other_relative_details' => [],
        'consent' => true,
        'guardian_consent' => false,
    ];

    $this->post(route('surveys.responses.store', $survey), [...$payload, 'perpetrators' => []])
        ->assertSessionHasErrors('perpetrators.catcalling');
    $this->post(route('surveys.responses.store', $survey), [...$payload, 'experiences' => ['none', 'catcalling']])
        ->assertSessionHasErrors('experiences');
    $this->post(route('surveys.responses.store', $survey), [
        ...$payload,
        'perpetrators' => ['catcalling' => ['other-relative']],
    ])->assertSessionHasErrors('other_relative_details.catcalling');
    $this->post(route('surveys.responses.store', $survey), $payload)->assertRedirect(route('surveys.show', ['law' => 'ra-7877']));

    $response = SurveyResponse::query()->sole();
    expect($response->public_reference)->toStartWith('RA7877-')
        ->and($response->expires_at->isSameDay(now()->addDays(365)))->toBeTrue()
        ->and($response->answers['experiences'])->toBe(['catcalling'])
        ->and(array_keys($response->getAttributes()))->not->toContain('email', 'name', 'ip_address', 'user_agent');
});

test('respondents under eighteen require guardian confirmation', function () {
    $survey = publishRa7877();
    $version = $survey->publishedVersion();
    $region = SurveyRegion::query()->sole();
    $cluster = SurveyCluster::query()->sole();
    $hei = SurveyHei::query()->sole();

    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $version->id, 'age' => 17, 'sex' => 'prefer-not-to-say',
        'respondent_group' => 'student', 'region_id' => $region->id,
        'cluster_id' => $cluster->id, 'hei_id' => $hei->id,
        'experiences' => ['none'], 'perpetrators' => [],
        'other_relative_details' => [], 'consent' => true,
    ])->assertSessionHasErrors('guardian_consent');
});

test('expired survey responses are pruned by the retention command', function () {
    $survey = publishRa7877();
    [$region, $cluster, $hei] = [SurveyRegion::query()->sole(), SurveyCluster::query()->sole(), SurveyHei::query()->sole()];
    SurveyResponse::query()->create([
        'survey_version_id' => $survey->publishedVersion()->id,
        'public_reference' => 'RA7877-EXPIRED01', 'age' => 25, 'sex' => 'female',
        'respondent_group' => 'student', 'survey_region_id' => $region->id,
        'survey_cluster_id' => $cluster->id, 'survey_hei_id' => $hei->id,
        'answers' => ['experiences' => ['none']], 'consent_at' => now()->subYear(),
        'expires_at' => now()->subDay(),
    ]);

    $this->artisan('surveys:prune-expired')->assertSuccessful();
    $this->assertDatabaseEmpty('survey_responses');
});
