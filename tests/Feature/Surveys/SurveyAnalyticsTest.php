<?php

use App\Models\Survey;
use App\Models\SurveyAnswerTally;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->survey = Survey::query()->where('slug', 'ra-9262')->sole();
    $this->hei = createSurveyHei(['name' => 'Fictional Analytics HEI']);
    $far = SurveyRegion::query()->create(['name' => 'Fictional Far Region', 'is_active' => true]);
    $this->farHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $far->id, 'name' => 'Far', 'is_active' => true])->id,
        'name' => 'Fictional Far HEI',
        'is_active' => true,
    ]);
});

/** @param  array<string, mixed>  $overrides */
function analyticsResponse(SurveyHei $hei, array $overrides = []): SurveyResponse
{
    return SurveyResponse::query()->create([
        'survey_version_id' => test()->survey->versions()->firstOrFail()->id,
        'public_reference' => Str::random(20),
        'age' => 20,
        'sex' => 'female',
        'gender_identity' => 'heterosexual',
        'respondent_group' => 'student',
        'survey_region_id' => $hei->cluster->survey_region_id,
        'survey_cluster_id' => $hei->survey_cluster_id,
        'survey_hei_id' => $hei->id,
        'answers' => [
            'experiences' => ['battery', 'stalking'],
            'perpetrators' => ['battery' => ['teacher'], 'stalking' => ['teacher', 'former-boyfriend']],
            'other_relative_details' => [],
            'answering_for' => 'self',
        ],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
        ...$overrides,
    ]);
}

function analyst(?SurveyRegion $region = null): User
{
    $user = ($region ? User::factory()->regionalOffice($region) : User::factory()->nationalOffice())->create();
    $user->assignRole('admin');

    return $user;
}

/** @return array<string, int> answer (and detail) => count, for one question */
function tallied(string $question): array
{
    return SurveyAnswerTally::query()->where('question', $question)->get()
        ->groupBy(fn (SurveyAnswerTally $row): string => $row->answer.($row->detail !== null ? ':'.$row->detail : ''))
        ->map(fn ($rows): int => (int) $rows->sum('responses'))
        ->sortKeys()
        ->all();
}

test('each answer is counted as it arrives, taken back by a single delete, and kept through the prune', function () {
    $first = analyticsResponse($this->hei);
    analyticsResponse($this->hei, ['age' => 16, 'answers' => ['experiences' => ['none'], 'perpetrators' => [], 'answering_for' => 'minor-under-legal-care']]);

    expect(tallied('experiences'))->toBe(['battery' => 1, 'none' => 1, 'stalking' => 1])
        ->and(tallied('perpetrators'))->toBe(['battery:teacher' => 1, 'stalking:former-boyfriend' => 1, 'stalking:teacher' => 1])
        ->and(tallied('age_band'))->toBe(['18-24' => 1, 'under-18' => 1])
        ->and(tallied('answering_for'))->toBe(['minor-under-legal-care' => 1, 'self' => 1])
        ->and(tallied('gender_identity'))->toBe(['heterosexual' => 2]);

    $first->delete();
    expect(tallied('experiences'))->toBe(['battery' => 0, 'none' => 1, 'stalking' => 0]);

    SurveyResponse::query()->update(['expires_at' => now()->subDay()]);
    $this->artisan('surveys:prune-expired')->assertSuccessful();
    expect(SurveyResponse::query()->count())->toBe(0)
        ->and(tallied('experiences')['none'])->toBe(1);
});

test('the migration counts the responses already kept', function () {
    analyticsResponse($this->hei);
    Schema::drop('survey_answer_tallies');

    (require database_path('migrations/2026_10_09_000000_create_survey_answer_tallies_table.php'))->up();

    expect(tallied('experiences'))->toBe(['battery' => 1, 'stalking' => 1]);
});

test('a survey\'s Summary shows each answer split by sex, with who was responsible', function () {
    foreach (range(1, 4) as $index) {
        analyticsResponse($this->hei);
    }
    analyticsResponse($this->hei, ['sex' => 'male', 'gender_identity' => 'heterosexual', 'answers' => ['experiences' => ['battery'], 'perpetrators' => ['battery' => ['sister-brother']]]]);

    $this->actingAs(analyst())->get(route('admin.surveys.summary', $this->survey))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/surveys/summary')
            ->where('totals.responses', 5)
            ->where('totals.female', 4)
            ->where('totals.heis', 1)
            ->where('suppressed', false)
            ->where('questions.1.key', 'experiences')
            ->where('questions.1.kind', 'matrix')
            ->where('questions.1.options', function ($options) {
                $battery = collect($options)->firstWhere('value', 'battery');

                return $battery['count'] === 5 && $battery['female'] === 4 && $battery['male'] === 1
                    && $battery['label'] === 'Battery (Pananakit)'
                    && $battery['details'][0] === ['value' => 'teacher', 'label' => 'Teacher', 'count' => 4]
                    && collect($options)->firstWhere('value', 'physical-violence')['count'] === 0;
            })
            ->where('questions', fn ($questions) => collect($questions)->pluck('key')->all() === [
                'answering_for', 'experiences', 'sex', 'respondent_group', 'age_band', 'gender_identity',
            ]));
});

test('fewer than five responses in view show totals but no answers', function () {
    foreach (range(1, 4) as $index) {
        analyticsResponse($this->hei);
    }
    analyticsResponse($this->hei, ['sex' => 'male']);
    $analyst = analyst();

    $this->actingAs($analyst)->get(route('admin.surveys.summary', ['survey' => $this->survey, 'sex' => 'male']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('totals.responses', 1)
            ->where('suppressed', true)
            ->where('questions', [])
            ->where('filters.sex', 'male'));

    $this->get(route('admin.surveys.summary', ['survey' => $this->survey, 'respondent_group' => 'student']))
        ->assertInertia(fn (Assert $page) => $page->where('totals.responses', 5)->where('suppressed', false));
});

test('a regional office counts only its own region, and HEI accounts cannot open a Summary', function () {
    foreach (range(1, 5) as $index) {
        analyticsResponse($this->hei);
        analyticsResponse($this->farHei);
    }

    $this->actingAs(analyst($this->hei->cluster->region))->get(route('admin.surveys.summary', $this->survey))
        ->assertInertia(fn (Assert $page) => $page
            ->where('totals.responses', 5)
            ->where('questions.1.options', fn ($options) => collect($options)->firstWhere('value', 'battery')['count'] === 5));

    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');
    $this->actingAs($member)->get(route('admin.surveys.summary', $this->survey))->assertForbidden();
});

test('responses naming no region count only in the overall figures, marked as such', function () {
    foreach (range(1, 5) as $index) {
        analyticsResponse($this->hei);
    }
    analyticsResponse($this->hei, ['survey_region_id' => null, 'survey_cluster_id' => null, 'survey_hei_id' => null]);

    $this->actingAs(analyst($this->hei->cluster->region))->get(route('admin.surveys.summary', $this->survey))
        ->assertInertia(fn (Assert $page) => $page->where('totals.responses', 5));

    $this->actingAs(analyst())->get(route('admin.surveys.summary', $this->survey))
        ->assertInertia(fn (Assert $page) => $page->where('totals.responses', 6));
    $this->get(route('admin.surveys.index'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('insights.places.rows', fn ($rows) => collect($rows)->firstWhere('id', null) === ['id' => null, 'name' => 'Not given', 'responses' => 1])));
});

test('the Surveys page adds insights: totals, each law, who answered and where from', function () {
    foreach (range(1, 3) as $index) {
        analyticsResponse($this->hei);
    }
    analyticsResponse($this->farHei, ['sex' => 'male']);

    $this->actingAs(analyst())->get(route('admin.surveys.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('surveys.data')
            ->where('surveys.per_page', 10)
            ->missing('insights')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->where('insights.kpis.responses.value', 4)
                ->where('insights.places.level', 'region')
                ->where('insights.places.rows.0.responses', 3)
                ->where('insights.laws', fn ($laws) => collect($laws)->firstWhere('code', $this->survey->code)['responses'] === 4)
                ->where('insights.respondents.sexes', fn ($sexes) => collect($sexes)->firstWhere('value', 'female')['responses'] === 3)));

    $this->actingAs(analyst($this->hei->cluster->region))->get(route('admin.surveys.index'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('insights.kpis.responses.value', 3)
            ->where('insights.places.level', 'hei')
            ->where('insights.places.rows.0.name', 'Fictional Analytics HEI')));
});
