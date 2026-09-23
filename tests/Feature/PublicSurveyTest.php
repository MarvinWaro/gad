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
    $cluster = SurveyCluster::query()->sole();

    // The public page tells the form which answers may be left blank.
    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('survey.required.hei', 'sometimes')
            ->where('survey.required.region', 'required')
            ->where('survey.required.cluster', 'required'));

    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'cluster_id' => $cluster->id,
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
    $region = SurveyRegion::query()->sole();

    // HEI is optional now, but cluster was left Required.
    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertSessionHasErrors('cluster_id');
});

test('an optional answer that is supplied still has to be real and in scope', function () {
    $survey = publishOptionalHeiRa7877();
    $version = $survey->publishedVersion();
    $region = SurveyRegion::query()->sole();
    $cluster = SurveyCluster::query()->sole();
    $otherCluster = SurveyCluster::query()->create([
        'survey_region_id' => $region->id, 'name' => 'Another Cluster', 'is_active' => true,
    ]);
    $strayHei = SurveyHei::query()->create([
        'survey_cluster_id' => $otherCluster->id, 'name' => 'Stray HEI', 'is_active' => true,
    ]);

    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'cluster_id' => $cluster->id,
        'hei_id' => $strayHei->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertSessionHasErrors('hei_id');
});

test('an HEI cannot be submitted without the cluster that narrows it', function () {
    $survey = publishOptionalHeiRa7877();
    $version = $survey->publishedVersion();
    $region = SurveyRegion::query()->sole();
    $hei = SurveyHei::query()->sole();

    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'hei_id' => $hei->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertSessionHasErrors('cluster_id');
});

test('a response missing its optional institution still renders for reviewers', function () {
    $survey = publishOptionalHeiRa7877();
    $version = $survey->publishedVersion();
    $region = SurveyRegion::query()->sole();
    $cluster = SurveyCluster::query()->sole();
    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $version->id, 'age' => 24, 'sex' => 'female',
        'respondent_group' => 'student', 'region_id' => $region->id,
        'cluster_id' => $cluster->id, 'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ])->assertRedirect();

    $admin = User::factory()->create();
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

test('a region that cannot reach a required cluster is never offered', function () {
    // RA 7877 keeps cluster Required; this region has none, so choosing it
    // would strand the respondent on a disabled, empty dropdown.
    $survey = publishOptionalHeiRa7877();
    SurveyRegion::query()->create(['name' => 'BARMM B', 'is_active' => true]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('directories.regions', 1)
            ->where('directories.regions.0.name', 'Regional Office XII'));
});

test('a region whose clusters are all deactivated drops out of the list too', function () {
    $survey = publishOptionalHeiRa7877();
    SurveyCluster::query()->sole()->update(['is_active' => false]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('directories.regions', 0)
            ->has('directories.clusters', 0));
});

test('when the cluster is optional an empty region stays available', function () {
    $survey = publishRa7877WithOptional(['cluster', 'hei']);
    SurveyRegion::query()->create(['name' => 'BARMM B', 'is_active' => true]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('directories.regions', 2));

    // And the respondent can submit having picked only that region.
    $barmm = SurveyRegion::query()->where('name', 'BARMM B')->sole();
    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $survey->publishedVersion()->id,
        'age' => 24, 'sex' => 'female', 'respondent_group' => 'student',
        'region_id' => $barmm->id, 'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->survey_cluster_id)->toBeNull();
});

test('a cluster with no institutions is still offered while the HEI is optional', function () {
    $survey = publishOptionalHeiRa7877();
    $region = SurveyRegion::query()->sole();
    SurveyCluster::query()->create([
        'survey_region_id' => $region->id, 'name' => 'Empty Cluster', 'is_active' => true,
    ]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->has('directories.clusters', 2));
});

test('making the HEI required withdraws clusters that have no institutions', function () {
    $survey = publishRa7877WithOptional([]);
    $region = SurveyRegion::query()->sole();
    SurveyCluster::query()->create([
        'survey_region_id' => $region->id, 'name' => 'Empty Cluster', 'is_active' => true,
    ]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('directories.clusters', 1)
            ->where('directories.clusters.0.name', 'Test Cluster'));
});
