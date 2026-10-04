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

/**
 * Publish RA 7877 with the HEI question's Required box unticked, which is the
 * configuration the builder produces when an editor turns that answer off.
 */
function publishOptionalHeiRa7877(): Survey
{
    return publishRa7877WithOptional(['hei']);
}

/**
 * Publish RA 7877 with the Required box unticked on the named questions.
 *
 * @param  list<string>  $optional
 */
function publishRa7877WithOptional(array $optional): Survey
{
    $region = SurveyRegion::query()->where('name', 'Regional Office XII')->sole();
    $cluster = SurveyCluster::query()->create([
        'survey_region_id' => $region->id, 'name' => 'Test Cluster', 'is_active' => true,
    ]);
    SurveyHei::query()->create([
        'survey_cluster_id' => $cluster->id, 'name' => 'Test HEI', 'is_active' => true,
    ]);

    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $draft = $survey->draftVersion();
    $definition = $draft->definition;
    foreach ($definition['sections'] as $sectionIndex => $section) {
        foreach ($section['questions'] as $questionIndex => $question) {
            if (in_array($question['id'], $optional, true)) {
                $definition['sections'][$sectionIndex]['questions'][$questionIndex]['required'] = false;
            }
        }
    }
    $draft->update([
        'retention_days' => 365, 'definition' => $definition,
        'status' => 'published', 'published_at' => now(),
    ]);
    $survey->versions()->create([
        'version' => 2, 'status' => 'draft', 'introduction' => $draft->introduction,
        'privacy_notice' => $draft->privacy_notice, 'consent_text' => $draft->consent_text,
        'retention_days' => 365, 'definition' => $definition,
    ]);

    return $survey->refresh();
}

test('each know your rights survey has a public placeholder page', function (string $law) {
    $this->get(route('surveys.show', ['law' => $law]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('surveys/show')
            ->where('lawSlug', $law));
})->with([
    'RA 7877' => 'ra-7877',
    'RA 9262' => 'ra-9262',
    'RA 9710' => 'ra-9710',
    'RA 11313' => 'ra-11313',
]);

test('unknown survey law routes return not found', function () {
    $this->get('/surveys/not-a-law')->assertNotFound();
});

test('unchecking Required on a question really makes that answer optional', function () {
    $survey = publishOptionalHeiRa7877();
    $version = $survey->publishedVersion();
    $region = SurveyRegion::query()->sole();

    // The public page tells the form which answers may be left blank. The
    // definition still has a Cluster question, but it is never asked.
    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('survey.required.hei', 'sometimes')
            ->where('survey.required.region', 'required')
            ->missing('survey.required.cluster'));

    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->survey_hei_id)->toBeNull();
});

test('a question left Required still has to be answered', function () {
    $survey = publishOptionalHeiRa7877();
    $version = $survey->publishedVersion();

    // HEI is optional now, but region was left Required.
    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertSessionHasErrors('region_id');
});

test('an optional answer that is supplied still has to be real and in scope', function () {
    $survey = publishOptionalHeiRa7877();
    $version = $survey->publishedVersion();
    $region = SurveyRegion::query()->sole();
    $elsewhere = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $strayHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::holdingFor($elsewhere->id)->id, 'name' => 'Stray HEI', 'is_active' => true,
    ]);

    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'hei_id' => $strayHei->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertSessionHasErrors('hei_id');
});

test('an HEI cannot be submitted without the region that narrows it', function () {
    $survey = publishRa7877WithOptional(['region', 'hei']);
    $version = $survey->publishedVersion();
    $hei = SurveyHei::query()->sole();

    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'hei_id' => $hei->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertSessionHasErrors('region_id');
});

test('the institution decides the cluster a response is filed under', function () {
    $survey = publishOptionalHeiRa7877();
    $hei = SurveyHei::query()->sole();

    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $survey->publishedVersion()->id,
        'age' => 24, 'sex' => 'female', 'respondent_group' => 'student',
        'region_id' => SurveyRegion::query()->sole()->id, 'hei_id' => $hei->id,
        'experiences' => ['none'], 'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->survey_cluster_id)->toBe($hei->survey_cluster_id);
});

test('a response missing its optional institution still renders for reviewers', function () {
    $survey = publishOptionalHeiRa7877();
    $version = $survey->publishedVersion();
    $region = SurveyRegion::query()->sole();
    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $version->id, 'age' => 24, 'sex' => 'female',
        'respondent_group' => 'student', 'region_id' => $region->id,
        'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ])->assertRedirect();

    $admin = User::factory()->nationalOffice()->create();
    $admin->assignRole('admin');
    $response = SurveyResponse::query()->sole();

    $this->actingAs($admin)->get(route('admin.surveys.responses.index', $survey))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('responses.data.0.hei', 'Not provided'));

    $this->actingAs($admin)
        ->get(route('admin.surveys.responses.show', [$survey, $response]))
        ->assertOk();

    $this->actingAs($admin)->get(route('admin.surveys.responses.export', $survey))
        ->assertOk();
});

test('the survey never asks for a cluster: each institution carries its region', function () {
    publishOptionalHeiRa7877();
    $hei = SurveyHei::query()->sole();

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->missing('directories.clusters')
            ->where('directories.heis', [[
                'id' => $hei->id,
                'name' => 'Test HEI',
                'survey_region_id' => SurveyRegion::query()->sole()->id,
            ]]));
});

test('a region with no institutions is never offered while the HEI is required', function () {
    // Choosing it would strand the respondent on a disabled, empty dropdown.
    publishRa7877WithOptional([]);
    SurveyRegion::query()->create(['name' => 'BARMM B', 'is_active' => true]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('directories.regions', 1)
            ->where('directories.regions.0.name', 'Regional Office XII'));
});

test('a region whose institutions are all deactivated drops out of the list too', function () {
    publishRa7877WithOptional([]);
    SurveyHei::query()->sole()->update(['is_active' => false]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('directories.regions', 0)
            ->has('directories.heis', 0));
});

test('when the HEI is optional an empty region stays available', function () {
    $survey = publishOptionalHeiRa7877();
    SurveyRegion::query()->create(['name' => 'BARMM B', 'is_active' => true]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('directories.regions', 2));

    // And the respondent can submit having picked only that region.
    $barmm = SurveyRegion::query()->where('name', 'BARMM B')->sole();
    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $survey->publishedVersion()->id,
        'age' => 24, 'sex' => 'female', 'respondent_group' => 'student',
        'region_id' => $barmm->id, 'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->survey_cluster_id)->toBeNull();
});

/** A response to RA 7877 from Region XII, as a respondent sends it. */
function regionXiiResponse(Survey $survey): SurveyResponse
{
    test()->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $survey->publishedVersion()->id, 'age' => 24, 'sex' => 'female',
        'respondent_group' => 'student', 'region_id' => SurveyRegion::query()->where('name', 'Regional Office XII')->value('id'),
        'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ])->assertRedirect();

    return SurveyResponse::query()->latest()->firstOrFail();
}

test('a regional office reads only its own region\'s survey responses', function () {
    $survey = publishOptionalHeiRa7877();
    $response = regionXiiResponse($survey);
    $elsewhere = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $outsider = User::factory()->regionalOffice($elsewhere)->create();
    $outsider->assignRole('admin');
    $insider = User::factory()->regionalOffice($response->survey_region_id)->create();
    $insider->assignRole('admin');

    $this->actingAs($outsider)->get(route('admin.surveys.responses.index', $survey))
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 0));
    $this->actingAs($outsider)->get(route('admin.surveys.responses.show', [$survey, $response]))->assertNotFound();
    expect($this->actingAs($outsider)->get(route('admin.surveys.responses.export', $survey))->streamedContent())
        ->not->toContain($response->public_reference);
    $this->actingAs($outsider)->delete(route('admin.surveys.responses.destroy', [$survey, $response]))->assertNotFound();

    $this->actingAs($insider)->get(route('admin.surveys.responses.index', $survey))
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 1));
    $this->actingAs($insider)->get(route('admin.surveys.responses.show', [$survey, $response]))->assertOk();
});

test('the CSV export never hands a spreadsheet a formula', function () {
    $survey = publishOptionalHeiRa7877();
    regionXiiResponse($survey)->forceFill(['respondent_group' => 'other', 'respondent_group_other' => '=1+1'])->save();
    $admin = User::factory()->nationalOffice()->create();
    $admin->assignRole('admin');

    $csv = $this->actingAs($admin)->get(route('admin.surveys.responses.export', $survey))->streamedContent();

    expect($csv)->toContain("'=1+1")->not->toContain(',=1+1');
});
