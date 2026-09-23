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
});

/** Set `default` on one question of the RA 7877 draft and return the survey. */
function withDefaultAnswer(string $questionId, ?string $value): Survey
{
    return applyToQuestion($questionId, ['default' => $value]);
}

/** Fix a question to a single choice, as RA 9710 does for sex. */
function withLockedAnswer(string $questionId, string $value, bool $soleOption = true): Survey
{
    $survey = applyToQuestion($questionId, ['default' => $value, 'locked' => true]);

    if (! $soleOption) {
        return $survey;
    }

    $draft = $survey->draftVersion();
    $definition = $draft->definition;
    foreach ($definition['sections'] as $si => $section) {
        foreach ($section['questions'] as $qi => $question) {
            if ($question['id'] === $questionId) {
                $definition['sections'][$si]['questions'][$qi]['options'] = array_values(array_filter(
                    $question['options'],
                    fn (array $option): bool => $option['value'] === $value,
                ));
            }
        }
    }
    $draft->update(['definition' => $definition]);

    return $survey;
}

/** @param array<string, mixed> $attributes */
function applyToQuestion(string $questionId, array $attributes): Survey
{
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $draft = $survey->draftVersion();
    $definition = $draft->definition;

    foreach ($definition['sections'] as $si => $section) {
        foreach ($section['questions'] as $qi => $question) {
            if ($question['id'] !== $questionId) {
                continue;
            }
            foreach ($attributes as $key => $value) {
                if ($value === null) {
                    unset($definition['sections'][$si]['questions'][$qi][$key]);
                } else {
                    $definition['sections'][$si]['questions'][$qi][$key] = $value;
                }
            }
        }
    }
    $draft->update(['definition' => $definition]);

    return $survey;
}

function publishDraft(Survey $survey): void
{
    $region = SurveyRegion::query()->where('name', 'Region XII')->sole();
    $cluster = SurveyCluster::query()->firstOrCreate(
        ['survey_region_id' => $region->id, 'name' => 'Test Cluster'],
        ['is_active' => true],
    );
    SurveyHei::query()->firstOrCreate(
        ['survey_cluster_id' => $cluster->id, 'name' => 'Test HEI'],
        ['is_active' => true],
    );
    $survey->draftVersion()->update(['retention_days' => 365]);

    test()->actingAs(test()->admin)
        ->post(route('admin.surveys.publish', $survey))
        ->assertSessionHasNoErrors();
}

test('a default answer reaches the public form so the choice opens pre-selected', function () {
    $survey = withDefaultAnswer('sex', 'female');
    publishDraft($survey);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(function (Assert $page) {
            $definition = $page->toArray()['props']['survey']['definition'];
            $sex = collect($definition['sections'])
                ->flatMap(fn ($section) => $section['questions'])
                ->firstWhere('id', 'sex');

            expect($sex['default'])->toBe('female');
        });
});

test('a question with no default is unchanged', function () {
    $survey = withDefaultAnswer('sex', null);
    publishDraft($survey);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(function (Assert $page) {
            $definition = $page->toArray()['props']['survey']['definition'];
            $sex = collect($definition['sections'])
                ->flatMap(fn ($section) => $section['questions'])
                ->firstWhere('id', 'sex');

            expect($sex)->not->toHaveKey('default');
        });
});

test('a default that is not one of the choices blocks publication', function () {
    $survey = withDefaultAnswer('sex', 'martian');
    $survey->draftVersion()->update(['retention_days' => 365]);
    $region = SurveyRegion::query()->where('name', 'Region XII')->sole();
    $cluster = SurveyCluster::query()->create([
        'survey_region_id' => $region->id, 'name' => 'Test Cluster', 'is_active' => true,
    ]);
    SurveyHei::query()->create([
        'survey_cluster_id' => $cluster->id, 'name' => 'Test HEI', 'is_active' => true,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.surveys.publish', $survey))
        ->assertSessionHasErrors('definition');

    expect($survey->refresh()->publishedVersion())->toBeNull();
});

test('the builder accepts a default answer and saves it onto the draft', function () {
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $draft = $survey->draftVersion();
    $definition = $draft->definition;
    foreach ($definition['sections'] as $si => $section) {
        foreach ($section['questions'] as $qi => $question) {
            if ($question['id'] === 'sex') {
                $definition['sections'][$si]['questions'][$qi]['default'] = 'female';
            }
        }
    }

    $this->actingAs($this->admin)
        ->put(route('admin.surveys.update', $survey), [
            'title' => $survey->title,
            'law_title' => $survey->law_title,
            'introduction' => $draft->introduction,
            'privacy_notice' => $draft->privacy_notice,
            'consent_text' => $draft->consent_text,
            'retention_days' => 365,
            'definition' => $definition,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $saved = collect($survey->refresh()->draftVersion()->definition['sections'])
        ->flatMap(fn ($section) => $section['questions'])
        ->firstWhere('id', 'sex');

    expect($saved['default'])->toBe('female');
});

test('a default answer can still be changed by the respondent', function () {
    $survey = withDefaultAnswer('sex', 'female');
    publishDraft($survey);
    $version = $survey->refresh()->publishedVersion();
    $region = SurveyRegion::query()->sole();
    $cluster = SurveyCluster::query()->sole();
    $hei = SurveyHei::query()->sole();

    $this->post(route('surveys.responses.store', $survey), [
        'version_id' => $version->id,
        'age' => 30,
        'sex' => 'male',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'cluster_id' => $cluster->id,
        'hei_id' => $hei->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->sex)->toBe('male');
});

test('a locked answer reaches the public form as fixed', function () {
    $survey = withLockedAnswer('sex', 'female');
    publishDraft($survey);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(function (Assert $page) {
            $sex = collect($page->toArray()['props']['survey']['definition']['sections'])
                ->flatMap(fn ($section) => $section['questions'])
                ->firstWhere('id', 'sex');

            expect($sex['locked'])->toBeTrue()
                ->and($sex['default'])->toBe('female')
                // The dropdown offers nothing else to pick.
                ->and(array_column($sex['options'], 'value'))->toBe(['female']);
        });
});

test('a locked answer is accepted when it matches the fixed value', function () {
    $survey = withLockedAnswer('sex', 'female');
    publishDraft($survey);

    $this->post(route('surveys.responses.store', $survey), lockedPayload($survey, 'female'))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->sex)->toBe('female');
});

test('a crafted request cannot store anything but the locked value', function () {
    // The disabled control is a browser hint; this is what actually enforces it.
    $survey = withLockedAnswer('sex', 'female');
    publishDraft($survey);

    $this->post(route('surveys.responses.store', $survey), lockedPayload($survey, 'male'))
        ->assertSessionHasErrors('sex');

    expect(SurveyResponse::query()->count())->toBe(0);
});

test('locking is still enforced when the question keeps every choice', function () {
    $survey = withLockedAnswer('sex', 'female', soleOption: false);
    publishDraft($survey);

    $this->post(route('surveys.responses.store', $survey), lockedPayload($survey, 'male'))
        ->assertSessionHasErrors('sex');
    $this->post(route('surveys.responses.store', $survey), lockedPayload($survey, 'female'))
        ->assertRedirect()
        ->assertSessionHasNoErrors();
});

test('a question locked with no default to lock to blocks publication', function () {
    $survey = applyToQuestion('sex', ['locked' => true, 'default' => null]);
    $survey->draftVersion()->update(['retention_days' => 365]);
    $region = SurveyRegion::query()->where('name', 'Region XII')->sole();
    $cluster = SurveyCluster::query()->create([
        'survey_region_id' => $region->id, 'name' => 'Test Cluster', 'is_active' => true,
    ]);
    SurveyHei::query()->create([
        'survey_cluster_id' => $cluster->id, 'name' => 'Test HEI', 'is_active' => true,
    ]);

    $this->actingAs($this->admin)
        ->post(route('admin.surveys.publish', $survey))
        ->assertSessionHasErrors('definition');

    expect($survey->refresh()->publishedVersion())->toBeNull();
});

/** @return array<string, mixed> */
function lockedPayload(Survey $survey, string $sex): array
{
    return [
        'version_id' => $survey->refresh()->publishedVersion()->id,
        'age' => 28,
        'sex' => $sex,
        'respondent_group' => 'student',
        'region_id' => SurveyRegion::query()->sole()->id,
        'cluster_id' => SurveyCluster::query()->sole()->id,
        'hei_id' => SurveyHei::query()->sole()->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ];
}
