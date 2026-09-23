<?php

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Support\Ra7877SurveyDefinition;
use App\Support\Ra9262SurveyDefinition;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->withoutMiddleware(ThrottleRequests::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    $this->survey = Survey::query()->where('slug', 'ra-9262')->sole();
    $this->region = SurveyRegion::query()->sole();
    $this->cluster = SurveyCluster::query()->create(['name' => 'Test Cluster', 'survey_region_id' => $this->region->id, 'is_active' => true]);
    $this->hei = SurveyHei::query()->create(['name' => 'Test HEI', 'survey_cluster_id' => $this->cluster->id, 'is_active' => true]);
    $this->publish = function (): void {
        $this->survey->draftVersion()->update(['retention_days' => 365]);
        $this->actingAs($this->admin)->post(route('admin.surveys.publish', $this->survey))->assertSessionHasNoErrors();
    };
    $this->payload = fn (): array => [
        'version_id' => $this->survey->publishedVersion()->id,
        'answering_for' => 'self', 'age' => 22, 'sex' => 'female', 'respondent_group' => 'student',
        'region_id' => $this->region->id, 'cluster_id' => $this->cluster->id, 'hei_id' => $this->hei->id,
        'experiences' => ['physical-violence'], 'perpetrators' => ['physical-violence' => ['teacher']],
        'other_relative_details' => [], 'consent' => true,
    ];
});

test('RA 9262 seeds only a draft with the supplied questionnaire and stable keys', function () {
    $definition = $this->survey->draftVersion()->definition;
    $matrix = $definition['sections'][1]['questions'][0];
    expect($this->survey->publishedVersion())->toBeNull()
        ->and($matrix['options'])->toHaveCount(21)
        ->and($matrix['perpetrator_options'])->toHaveCount(16)
        ->and(array_column($matrix['options'], 'value'))->toBe([
            'physical-violence', 'battery', 'fear-of-physical-harm', 'attempted-physical-harm',
            'sexual-violence', 'acts-of-lasciviousness', 'sexual-remarks', 'sexual-body-attacks',
            'forced-obscene-material', 'forced-conjugal-cohabitation', 'forced-sexual-activity',
            'psychological-violence', 'emotional-anguish', 'public-humiliation', 'witnessing-family-abuse',
            'stalking', 'cyber-harassment', 'economic-abuse', 'employment-control', 'financial-control', 'property-destruction',
        ])
        ->and($matrix['perpetrator_options'][8]['requires_text'])->toBeTrue()
        // All four enabling laws are seeded now, each as its own draft.
        ->and(Survey::query()->pluck('slug')->sort()->values()->all())
        ->toBe(['ra-11313', 'ra-7877', 'ra-9262', 'ra-9710']);
    $this->get('/surveys/ra-9262')->assertInertia(fn (Assert $page) => $page->where('survey', null));
});

test('repeat seeding preserves edits, archived status, published definitions and responses', function () {
    ($this->publish)();
    $this->post(route('surveys.responses.store', $this->survey), ($this->payload)())->assertSessionHasNoErrors();
    $original = $this->survey->publishedVersion()->getAttributes();
    $answer = SurveyResponse::query()->sole()->getAttributes();
    $this->survey->update(['title' => 'Edited title', 'status' => 'archived']);
    $this->survey->draftVersion()->update(['introduction' => 'Keep this draft']);
    $this->seed(SurveySeeder::class);
    expect($this->survey->fresh()->title)->toBe('Edited title')
        ->and($this->survey->fresh()->status)->toBe('archived')
        ->and($this->survey->publishedVersion()->getAttributes())->toBe($original)
        ->and($this->survey->draftVersion()->introduction)->toBe('Keep this draft')
        ->and(SurveyResponse::query()->sole()->getAttributes())->toBe($answer);
});

test('initial RA 9262 retention copies published RA 7877 only', function () {
    $this->survey->versions()->delete();
    $this->survey->delete();
    $ra7877 = Survey::query()->where('slug', 'ra-7877')->sole();
    $ra7877->draftVersion()->update(['status' => 'published', 'published_at' => now(), 'retention_days' => 730]);
    $this->seed(SurveySeeder::class);
    expect(Survey::query()->where('slug', 'ra-9262')->sole()->draftVersion()->retention_days)->toBe(730);
});

test('readiness and publication open RA 9262 without changing RA 7877', function () {
    $before = Survey::query()->where('slug', 'ra-7877')->sole()->draftVersion()->getAttributes();
    $this->actingAs($this->admin)->post(route('admin.surveys.publish', $this->survey))->assertSessionHasErrors('retention_days');
    ($this->publish)();
    $this->get('/surveys/ra-9262')->assertInertia(fn (Assert $page) => $page
        ->where('survey.version', 1)->where('survey.required.answering_for', 'required')
        ->has('survey.definition.sections.1.questions.0.options', 21));
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('openSurveys', ['ra-9262']));
    expect($this->survey->draftVersion()->version)->toBe(2)
        ->and(Survey::query()->where('slug', 'ra-7877')->sole()->draftVersion()->getAttributes())->toBe($before);
    $this->survey->draftVersion()->update(['definition' => ['sections' => []]]);
    expect($this->survey->publishedVersion()->definition)->toBe(Ra9262SurveyDefinition::make());
});

test('RA 9262 stores anonymous self and minor responses', function (string $answeringFor, int $age) {
    ($this->publish)();
    $this->post(route('surveys.responses.store', $this->survey), [
        ...($this->payload)(), 'answering_for' => $answeringFor, 'age' => $age, 'guardian_consent' => $age < 18,
        'email' => 'must-not-be-stored@example.com',
    ])->assertSessionHasNoErrors()->assertRedirect('/surveys/ra-9262');
    $response = SurveyResponse::query()->sole();
    expect($response->public_reference)->toStartWith('RA9262-')
        ->and($response->answers['answering_for'])->toBe($answeringFor)
        ->and($response->age)->toBe($age)
        ->and($response->guardian_confirmed_at !== null)->toBe($age < 18)
        ->and($response->toJson())->not->toContain('must-not-be-stored');
})->with([['self', 22], ['self', 17], ['minor-under-legal-care', 15]]);

test('RA 9262 validates required and conditional answers', function (array $changes, string $error) {
    ($this->publish)();
    $this->post(route('surveys.responses.store', $this->survey), [...($this->payload)(), ...$changes])->assertSessionHasErrors($error);
    $this->assertDatabaseEmpty('survey_responses');
})->with([
    'missing answering for' => [['answering_for' => ''], 'answering_for'],
    'invalid answering for' => [['answering_for' => 'someone-else'], 'answering_for'],
    'adult entered as minor' => [['answering_for' => 'minor-under-legal-care', 'age' => 18, 'guardian_consent' => true], 'age'],
    'minor consent missing' => [['answering_for' => 'minor-under-legal-care', 'age' => 15], 'guardian_consent'],
    'self minor consent missing' => [['age' => 16], 'guardian_consent'],
    'missing age' => [['age' => null], 'age'],
    'non-integer age' => [['age' => 15.5], 'age'],
    'empty experiences' => [['experiences' => []], 'experiences'],
    'none mixed with experience' => [['experiences' => ['none', 'physical-violence']], 'experiences'],
    'missing perpetrator' => [['perpetrators' => []], 'perpetrators.physical-violence'],
    'missing specified relative' => [['perpetrators' => ['physical-violence' => ['other-relative']]], 'other_relative_details.physical-violence'],
    'stale version' => [['version_id' => -1], 'version_id'],
    'invalid directory' => [['hei_id' => -1], 'hei_id'],
]);

test('none answers discard unrelated perpetrator details', function () {
    ($this->publish)();
    $this->post(route('surveys.responses.store', $this->survey), [...($this->payload)(), 'experiences' => ['none']])->assertSessionHasNoErrors();
    expect(SurveyResponse::query()->sole()->answers)->toBe([
        'experiences' => ['none'], 'perpetrators' => [], 'other_relative_details' => [], 'answering_for' => 'self',
    ]);
});

test('minor proxy age is required even when the general age question is optional', function () {
    $definition = $this->survey->draftVersion()->definition;
    $definition['sections'][0]['questions'][1]['required'] = false;
    $this->survey->draftVersion()->update(['definition' => $definition]);
    ($this->publish)();
    $payload = [...($this->payload)(), 'answering_for' => 'minor-under-legal-care', 'guardian_consent' => true];
    unset($payload['age']);
    $this->post(route('surveys.responses.store', $this->survey), $payload)->assertSessionHasErrors('age');
});

test('definition flags, age limits and custom none and text choices drive submission', function () {
    $definition = $this->survey->draftVersion()->definition;
    $definition['sections'][0]['questions'][0]['required'] = false;
    $definition['sections'][0]['questions'][1]['max'] = 50;
    $matrix = &$definition['sections'][1]['questions'][0];
    $matrix['none_option']['value'] = 'no-experience';
    $matrix['perpetrator_options'][8]['value'] = 'another-person';
    $this->survey->draftVersion()->update(['definition' => $definition]);
    ($this->publish)();
    $this->post(route('surveys.responses.store', $this->survey), [...($this->payload)(), 'age' => 51])->assertSessionHasErrors('age');
    $this->post(route('surveys.responses.store', $this->survey), [...($this->payload)(), 'perpetrators' => ['physical-violence' => ['another-person']]])->assertSessionHasErrors('other_relative_details.physical-violence');
    $this->post(route('surveys.responses.store', $this->survey), [...($this->payload)(), 'answering_for' => null, 'experiences' => ['no-experience']])->assertSessionHasNoErrors();
});

test('readiness rejects unsupported answer contracts and multiple text choices', function (string $case) {
    $definition = $this->survey->draftVersion()->definition;
    if ($case === 'missing') {
        array_shift($definition['sections'][0]['questions']);
    } elseif ($case === 'text') {
        $definition['sections'][1]['questions'][0]['perpetrator_options'][0]['requires_text'] = true;
    } else {
        $definition['sections'][1]['questions'][0]['none_option']['value'] = 'physical-violence';
    }
    $this->survey->draftVersion()->update(['definition' => $definition, 'retention_days' => 365]);
    $this->actingAs($this->admin)->post(route('admin.surveys.publish', $this->survey))->assertSessionHasErrors('definition');
    expect($this->survey->publishedVersion())->toBeNull();
})->with(['missing', 'text', 'none']);

test('a survey without a matrix accepts respondent details without experience answers', function () {
    $definition = Ra7877SurveyDefinition::make();
    array_pop($definition['sections']);
    $this->survey->draftVersion()->update(['definition' => $definition, 'retention_days' => 365, 'status' => 'published', 'published_at' => now()]);
    // A non-registered survey can use only respondent questions.
    $this->survey->update(['slug' => 'matrix-free', 'code' => 'CUSTOM']);
    $this->post(route('surveys.responses.store', $this->survey), [...($this->payload)(), 'experiences' => [], 'perpetrators' => []])->assertSessionHasNoErrors();
    expect(SurveyResponse::query()->sole()->answers)->toBe(['experiences' => [], 'perpetrators' => [], 'other_relative_details' => []]);
});

test('admin response list, frozen labels and CSV include RA 9262 answers and specified details', function () {
    ($this->publish)();
    $this->post(route('surveys.responses.store', $this->survey), [
        ...($this->payload)(), 'answering_for' => 'minor-under-legal-care', 'age' => 15, 'guardian_consent' => true,
        'perpetrators' => ['physical-violence' => ['other-relative']],
        'other_relative_details' => ['physical-violence' => '  Aunt  '],
    ])->assertSessionHasNoErrors();
    $response = SurveyResponse::query()->sole();
    $definition = $this->survey->draftVersion()->definition;
    $definition['sections'][1]['questions'][0]['options'][0]['label'] = 'Changed draft label';
    $this->survey->draftVersion()->update(['definition' => $definition]);
    $this->get(route('admin.surveys.responses.index', $this->survey))->assertInertia(fn (Assert $page) => $page->has('responses.data', 1));
    $this->get(route('admin.surveys.responses.show', [$this->survey, $response]))->assertInertia(fn (Assert $page) => $page
        ->where('response.answers.answering_for', 'minor-under-legal-care')
        ->where('response.answer_labels.experiences.physical-violence', 'Physical Violence (Pisikal na Karahasan)')
        ->where('response.answer_labels.answering_for.minor-under-legal-care', 'Minor under my legal care'));
    $csv = $this->get(route('admin.surveys.responses.export', $this->survey))->assertOk()->streamedContent();
    expect($csv)->toContain($response->public_reference, 'Answering for', 'Minor under my legal care', 'physical-violence: Aunt');
    $other = Survey::query()->where('slug', 'ra-7877')->sole();
    $this->get(route('admin.surveys.responses.index', $other))->assertInertia(fn (Assert $page) => $page->has('responses.data', 0));
    $this->get(route('admin.surveys.responses.show', [$other, $response]))->assertNotFound();
    expect($this->get(route('admin.surveys.responses.export', $other))->streamedContent())->not->toContain($response->public_reference);
});
