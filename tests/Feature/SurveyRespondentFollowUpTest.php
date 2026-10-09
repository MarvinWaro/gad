<?php

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyGroupAnswer;
use App\Models\SurveyGroupOption;
use App\Models\SurveyGroupQuestion;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->admin = User::factory()->nationalOffice()->create();
    $this->admin->assignRole('admin');
    $this->survey = Survey::query()->where('slug', 'ra-7877')->sole();

    // A survey publishes only once respondents have an institution to pick.
    $this->region = SurveyRegion::query()->where('name', 'Regional Office XII')->sole();
    $this->cluster = SurveyCluster::query()->create([
        'survey_region_id' => $this->region->id, 'name' => 'Follow-up Cluster', 'is_active' => true,
    ]);
    $this->hei = SurveyHei::query()->create([
        'survey_cluster_id' => $this->cluster->id, 'name' => 'Follow-up HEI', 'is_active' => true,
    ]);

    $this->survey->draftVersion()->update(['retention_days' => 365]);
    $this->actingAs($this->admin)
        ->post(route('admin.surveys.publish', $this->survey))
        ->assertSessionHasNoErrors();
});

/**
 * A complete RA 7877 response from a female alumna, with no follow-up answers
 * of its own; each test adds the ones it is about.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function followUpPayload(array $overrides = []): array
{
    return [
        'version_id' => test()->survey->refresh()->publishedVersion()->id,
        'age' => 24, 'sex' => 'female', 'respondent_group' => 'alumni',
        'region_id' => test()->region->id,
        'hei_id' => test()->hei->id, 'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
        ...$overrides,
    ];
}

/**
 * Civilian → "Occupation", a dropdown with an "Others" choice that asks the
 * respondent to specify, written the way the settings editor sends it.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function occupationQuestion(array $overrides = []): array
{
    return [
        'label' => 'Occupation', 'type' => 'select', 'required' => true,
        'options' => [
            ['value' => 'farmer', 'label' => 'Farmer'],
            ['value' => 'vendor', 'label' => 'Vendor'],
            ['value' => 'others', 'label' => 'Others', 'requires_text' => true],
        ],
        ...$overrides,
    ];
}

/**
 * A stored response's follow-up answers, as question key => chosen value and
 * any specified text, in the questions' order.
 *
 * @return array<string, array{value: string, text?: string}>
 */
function storedAnswers(SurveyResponse $response): array
{
    return $response->groupAnswers()->with(['question', 'option'])->get()
        ->sortBy(fn (SurveyGroupAnswer $answer): int => $answer->question->sort_order)
        ->mapWithKeys(fn (SurveyGroupAnswer $answer): array => [$answer->question->key => [
            'value' => $answer->option->value,
            ...($answer->text !== null ? ['text' => $answer->text] : []),
        ]])
        ->all();
}

function addCivilianGroup(): SurveyRespondentGroup
{
    test()->actingAs(test()->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'respondent-groups']), ['label' => 'Civilian'])
        ->assertSessionHasNoErrors();
    $civilian = SurveyRespondentGroup::query()->where('value', 'civilian')->sole();

    test()->put(route('settings.respondent-groups.follow-ups', $civilian), ['follow_ups' => [occupationQuestion()]])
        ->assertSessionHasNoErrors();

    return $civilian->refresh();
}

test('the public form receives each group\'s follow-up questions and the gender identity choices', function () {
    $this->get(route('surveys.show', ['law' => 'ra-7877']))->assertInertia(fn (Assert $page) => $page
        ->where('directories.respondent_groups.0.value', 'student')
        ->where('directories.respondent_groups.0.follow_ups.0.key', 'student-year')
        ->where('directories.respondent_groups.0.follow_ups.0.options.0', ['value' => '1st-year', 'label' => '1st Year'])
        ->where('directories.respondent_groups.0.follow_ups.1.type', 'radio')
        ->where('directories.respondent_groups.1.follow_ups', [])
        ->where('directories.respondent_groups.2.follow_ups.1.label', 'Status of employment')
        // One list for everyone, its choices never overlapping.
        ->where('respondentDetails.gender_identities', fn ($choices) => collect($choices)->pluck('value')->all() === [
            'cisgender-man', 'cisgender-woman', 'trans-man', 'trans-woman', 'non-binary', 'another', 'prefer-not-to-say',
        ])
        ->where('respondentDetails.gender_identities.0.label', 'Cisgender Man (Lalaki, at lalaki rin noong ipinanganak)'));
});

test('every sex answer, Intersex and Prefer not to say included, is asked the same gender identity list', function (string $sex) {
    $store = route('surveys.responses.store', $this->survey);

    $this->post($store, followUpPayload(['sex' => $sex]))->assertSessionHasErrors('gender_identity');
    // An orientation, or the old "Gender Variant" (an expression), is not an identity.
    $this->post($store, followUpPayload(['sex' => $sex, 'gender_identity' => 'heterosexual']))->assertSessionHasErrors('gender_identity');
    $this->post($store, followUpPayload(['sex' => $sex, 'gender_identity' => 'gender-variant']))->assertSessionHasErrors('gender_identity');
    expect(SurveyResponse::query()->count())->toBe(0);

    foreach (['trans-woman', 'non-binary', 'another'] as $identity) {
        $this->post($store, followUpPayload(['sex' => $sex, 'gender_identity' => $identity]))->assertSessionHasNoErrors();
    }

    expect(SurveyResponse::query()->pluck('gender_identity')->all())
        ->toEqualCanonicalizing(['trans-woman', 'non-binary', 'another']);
})->with(['female', 'male', 'intersex', 'prefer-not-to-say']);

test('sexual orientation is its own optional question, whatever the sex answer', function () {
    $store = route('surveys.responses.store', $this->survey);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))->assertInertia(fn (Assert $page) => $page
        ->where('respondentDetails.sexual_orientations.0', ['value' => 'heterosexual', 'label' => 'Heterosexual (Naaakit sa ibang kasarian)'])
        ->where('respondentDetails.sexual_orientations.4', ['value' => 'another', 'label' => 'Another sexual orientation (Iba pa)'])
        ->where('respondentDetails.sexual_orientations.5.value', 'prefer-not-to-say'));

    $this->post($store, followUpPayload(['gender_identity' => 'cisgender-woman', 'sexual_orientation' => 'cisgender-woman']))->assertSessionHasErrors('sexual_orientation');
    $this->post($store, followUpPayload(['gender_identity' => 'cisgender-woman']))->assertSessionHasNoErrors();
    $this->post($store, followUpPayload(['gender_identity' => 'trans-man', 'sexual_orientation' => 'bisexual']))->assertSessionHasNoErrors();
    $this->post($store, followUpPayload(['sex' => 'intersex', 'gender_identity' => 'non-binary', 'sexual_orientation' => 'gay']))->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->orderBy('id')->pluck('sexual_orientation')->all())->toBe([null, 'bisexual', 'gay']);

    $response = SurveyResponse::query()->where('sexual_orientation', 'bisexual')->sole();
    $this->actingAs($this->admin)->get(route('admin.surveys.responses.show', [$this->survey, $response]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('response.details.Gender identity', 'Trans Man (Lalaki ngunit ipinanganak sa katawan ng isang Babae)')
            ->where('response.details.Sexual orientation', 'Bisexual (Naaakit sa higit sa isang kasarian)'));
});

test('an optional email is kept encrypted and shown only on the page of its response', function () {
    $store = route('surveys.responses.store', $this->survey);
    $answer = ['gender_identity' => 'cisgender-woman'];

    $this->post($store, followUpPayload([...$answer, 'email' => 'not-an-email']))->assertSessionHasErrors('email');
    $this->post($store, followUpPayload($answer))->assertSessionHasNoErrors();
    $this->post($store, followUpPayload([...$answer, 'email' => 'respondent@example.com']))->assertSessionHasNoErrors();

    $response = SurveyResponse::query()->whereNotNull('email')->sole();
    $stored = DB::table('survey_responses')->where('id', $response->id)->value('email');

    expect(SurveyResponse::query()->whereNull('email')->count())->toBe(1)
        ->and($response->email)->toBe('respondent@example.com')
        // Encrypted at rest, and never serialized with the model.
        ->and($stored)->not->toContain('respondent@example.com')
        ->and($response->toArray())->not->toHaveKey('email')
        ->and($response->toJson())->not->toContain('respondent@example.com');

    $this->actingAs($this->admin)->get(route('admin.surveys.responses.show', [$this->survey, $response]))
        ->assertInertia(fn (Assert $page) => $page->where('response.email', 'respondent@example.com'));
    $this->get(route('admin.surveys.responses.index', $this->survey))
        ->assertInertia(fn (Assert $page) => $page->where('responses.data', fn ($rows) => collect($rows)->every(fn ($row) => ! array_key_exists('email', (array) $row))));
    expect($this->get(route('admin.surveys.responses.export', $this->survey))->streamedContent())
        ->not->toContain('respondent@example.com')
        ->toContain('Sex at birth');
});

test('students answer their group\'s questions, and only theirs are kept', function () {
    $store = route('surveys.responses.store', $this->survey);
    $student = ['respondent_group' => 'student', 'gender_identity' => 'cisgender-woman'];

    $this->post($store, followUpPayload($student))
        ->assertSessionHasErrors(['group_answers.student-year', 'group_answers.scholar']);
    $this->post($store, followUpPayload([...$student, 'group_answers' => ['student-year' => '6th-year', 'scholar' => 'maybe']]))
        ->assertSessionHasErrors(['group_answers.student-year', 'group_answers.scholar']);

    $this->post($store, followUpPayload([...$student, 'group_answers' => [
        'student-year' => '3rd-year', 'scholar' => 'yes',
        // Employee questions do not apply to a student, so they are dropped.
        'unit-division' => 'teaching',
    ]]))->assertSessionHasNoErrors();

    expect(storedAnswers(SurveyResponse::query()->sole()))->toBe([
        'student-year' => ['value' => '3rd-year'],
        'scholar' => ['value' => 'yes'],
    ]);
});

test('employees answer theirs', function () {
    $store = route('surveys.responses.store', $this->survey);
    $employee = ['respondent_group' => 'employee', 'gender_identity' => 'cisgender-woman'];

    $this->post($store, followUpPayload($employee))
        ->assertSessionHasErrors(['group_answers.unit-division', 'group_answers.employment-status']);
    $this->post($store, followUpPayload([...$employee, 'group_answers' => [
        'unit-division' => 'non-teaching', 'employment-status' => 'contractual',
    ]]))->assertSessionHasNoErrors();

    expect(storedAnswers(SurveyResponse::query()->sole()))->toBe([
        'unit-division' => ['value' => 'non-teaching'],
        'employment-status' => ['value' => 'contractual'],
    ]);
});

test('a group without follow-ups stores none, whatever is sent', function () {
    $this->post(route('surveys.responses.store', $this->survey), followUpPayload(respondentFollowUps()))
        ->assertSessionHasNoErrors();

    $response = SurveyResponse::query()->sole();
    expect($response->respondent_group)->toBe('alumni')
        ->and($response->gender_identity)->toBe('cisgender-woman')
        ->and($response->groupAnswers()->count())->toBe(0);
});

test('an administrator can give a new group its own question, with an Others choice to specify', function () {
    $civilian = addCivilianGroup();

    expect($civilian->followUps())->toBe([[
        'key' => 'occupation', 'label' => 'Occupation', 'type' => 'select', 'required' => true,
        'options' => [
            ['value' => 'farmer', 'label' => 'Farmer'],
            ['value' => 'vendor', 'label' => 'Vendor'],
            ['value' => 'others', 'label' => 'Others', 'requires_text' => true],
        ],
    ]]);

    $store = route('surveys.responses.store', $this->survey);
    $answer = ['respondent_group' => 'civilian', 'gender_identity' => 'cisgender-woman'];

    $this->post($store, followUpPayload($answer))->assertSessionHasErrors('group_answers.occupation');
    // "Others" opens a box that must be filled in.
    $this->post($store, followUpPayload([...$answer, 'group_answers' => ['occupation' => 'others']]))
        ->assertSessionHasErrors('group_answer_details.occupation');
    $this->post($store, followUpPayload([
        ...$answer,
        'group_answers' => ['occupation' => 'others'],
        'group_answer_details' => ['occupation' => '  Tricycle driver '],
    ]))->assertSessionHasNoErrors();
    // A choice that does not ask to specify keeps no typed text.
    $this->post($store, followUpPayload([
        ...$answer,
        'group_answers' => ['occupation' => 'farmer'],
        'group_answer_details' => ['occupation' => 'ignored'],
    ]))->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->get()->map(fn (SurveyResponse $response): array => storedAnswers($response))->all())->toEqualCanonicalizing([
        ['occupation' => ['value' => 'others', 'text' => 'Tricycle driver']],
        ['occupation' => ['value' => 'farmer']],
    ]);
});

test('saved questions keep their answer keys when renamed, and new ones get their own', function () {
    $civilian = addCivilianGroup();

    $this->put(route('settings.respondent-groups.follow-ups', $civilian), ['follow_ups' => [
        occupationQuestion(['key' => 'occupation', 'label' => 'Main occupation']),
        // A new question that happens to share the old label still gets its own key.
        occupationQuestion(['label' => 'Occupation', 'type' => 'radio', 'required' => false]),
    ]])->assertSessionHasNoErrors();

    $questions = $civilian->refresh()->followUps();
    expect(array_column($questions, 'key'))->toBe(['occupation', 'occupation-2'])
        ->and(array_column($questions, 'label'))->toBe(['Main occupation', 'Occupation'])
        ->and($questions[1]['required'])->toBeFalse();
});

test('follow-up questions are checked before they are saved', function (array $question, string $error) {
    $civilian = addCivilianGroup();

    $this->put(route('settings.respondent-groups.follow-ups', $civilian), ['follow_ups' => [$question]])
        ->assertSessionHasErrors($error);

    expect($civilian->refresh()->followUps()[0]['label'])->toBe('Occupation');
})->with([
    'no label' => [occupationQuestion(['label' => '']), 'follow_ups.0.label'],
    'unknown type' => [occupationQuestion(['type' => 'slider']), 'follow_ups.0.type'],
    'no choices' => [occupationQuestion(['options' => []]), 'follow_ups.0.options'],
    'repeated choice' => [occupationQuestion(['options' => [
        ['value' => 'farmer', 'label' => 'Farmer'],
        ['value' => 'farmer', 'label' => 'Farmer again'],
    ]]), 'follow_ups.0.options'],
    'unsafe choice key' => [occupationQuestion(['options' => [['value' => 'Farmer!', 'label' => 'Farmer']]]), 'follow_ups.0.options.0.value'],
]);

test('activating or deactivating a group keeps its follow-up questions', function () {
    $civilian = addCivilianGroup();

    $this->put(route('settings.survey-directories.update', ['type' => 'respondent-groups', 'id' => $civilian->id]), [
        'label' => 'Civilian', 'requires_text' => false, 'is_active' => false,
    ])->assertSessionHasNoErrors();

    expect($civilian->refresh()->is_active)->toBeFalse()
        ->and($civilian->followUps())->toHaveCount(1);
});

test('only administrators who may edit the directory can change follow-up questions', function () {
    $civilian = addCivilianGroup();
    $member = User::factory()->create();
    $member->assignRole('hei');

    $this->actingAs($member)
        ->put(route('settings.respondent-groups.follow-ups', $civilian), ['follow_ups' => []])
        ->assertForbidden();

    expect($civilian->refresh()->followUps())->toHaveCount(1);
});

test('reviewers see the follow-ups on the response and in the export', function () {
    addCivilianGroup();
    $store = route('surveys.responses.store', $this->survey);
    $this->post($store, followUpPayload([
        'respondent_group' => 'student', 'gender_identity' => 'trans-man',
        'group_answers' => ['student-year' => '3rd-year', 'scholar' => 'yes'],
    ]))->assertSessionHasNoErrors();
    $this->post($store, followUpPayload([
        'respondent_group' => 'civilian', 'gender_identity' => 'cisgender-woman',
        'group_answers' => ['occupation' => 'others'],
        'group_answer_details' => ['occupation' => 'Tricycle driver'],
    ]))->assertSessionHasNoErrors();
    $student = SurveyResponse::query()->where('respondent_group', 'student')->sole();

    $this->get(route('admin.surveys.responses.show', [$this->survey, $student]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('response.details', [
                'Gender identity' => 'Trans Man (Lalaki ngunit ipinanganak sa katawan ng isang Babae)',
                'Student year' => '3rd Year',
                'Are you a scholar?' => 'Yes',
            ])
            // Directory groups are named from the directory.
            ->where('response.answer_labels.respondent_group.student', 'Student'));

    $csv = $this->get(route('admin.surveys.responses.export', $this->survey))->assertOk()->streamedContent();

    expect($csv)->toContain('"Student: Student year","Student: Are you a scholar?"')
        ->and($csv)->toContain('"Civilian: Occupation"')
        ->and($csv)->toContain('"3rd Year",Yes')
        ->and($csv)->toContain('"Others: Tricycle driver"');
});

test('an answered question that is removed is retired: gone from the form, kept on its answers', function () {
    $civilian = addCivilianGroup();
    $this->post(route('surveys.responses.store', $this->survey), followUpPayload([
        'respondent_group' => 'civilian', 'gender_identity' => 'cisgender-woman',
        'group_answers' => ['occupation' => 'vendor'],
    ]))->assertSessionHasNoErrors();

    // The editor sends the list without Occupation, plus a new question.
    $this->put(route('settings.respondent-groups.follow-ups', $civilian), ['follow_ups' => [
        occupationQuestion(['label' => 'Occupation']),
    ]])->assertSessionHasNoErrors();

    $questions = SurveyGroupQuestion::query()->where('survey_respondent_group_id', $civilian->id)->orderBy('id')->get();
    expect($questions->pluck('key')->all())->toBe(['occupation', 'occupation-2'])
        ->and($questions[0]->is_active)->toBeFalse()
        ->and(array_column($civilian->refresh()->followUps(), 'key'))->toBe(['occupation-2']);

    // The old response still reads as it was answered.
    $response = SurveyResponse::query()->sole();
    $this->get(route('admin.surveys.responses.show', [$this->survey, $response]))
        ->assertInertia(fn (Assert $page) => $page->where('response.details.Occupation', 'Vendor'));
    expect($this->get(route('admin.surveys.responses.export', $this->survey))->streamedContent())
        ->toContain('"Civilian: Occupation (retired)"');
});

test('an unanswered question that is removed is deleted with its choices', function () {
    $civilian = addCivilianGroup();

    $this->put(route('settings.respondent-groups.follow-ups', $civilian), ['follow_ups' => []])
        ->assertSessionHasNoErrors();

    expect(SurveyGroupQuestion::query()->where('survey_respondent_group_id', $civilian->id)->count())->toBe(0)
        ->and(SurveyGroupOption::query()->count())->toBe(11);
});

test('a picked choice that is removed is retired: no longer offered, still read on its answers', function () {
    $civilian = addCivilianGroup();
    $store = route('surveys.responses.store', $this->survey);
    $this->post($store, followUpPayload([
        'respondent_group' => 'civilian', 'gender_identity' => 'cisgender-woman',
        'group_answers' => ['occupation' => 'farmer'],
    ]))->assertSessionHasNoErrors();

    $this->put(route('settings.respondent-groups.follow-ups', $civilian), ['follow_ups' => [
        occupationQuestion(['key' => 'occupation', 'options' => [
            ['value' => 'vendor', 'label' => 'Vendor'],
            ['value' => 'others', 'label' => 'Others', 'requires_text' => true],
        ]]),
    ]])->assertSessionHasNoErrors();

    $farmer = SurveyGroupOption::query()->where('value', 'farmer')->sole();
    expect($farmer->is_active)->toBeFalse()
        ->and(array_column($civilian->refresh()->followUps()[0]['options'], 'value'))->toBe(['vendor', 'others']);

    // No longer accepted from respondents…
    $this->post($store, followUpPayload([
        'respondent_group' => 'civilian', 'gender_identity' => 'cisgender-woman',
        'group_answers' => ['occupation' => 'farmer'],
    ]))->assertSessionHasErrors('group_answers.occupation');

    // …but the answer already given still reads "Farmer".
    $response = SurveyResponse::query()->sole();
    $this->get(route('admin.surveys.responses.show', [$this->survey, $response]))
        ->assertInertia(fn (Assert $page) => $page->where('response.details.Occupation', 'Farmer'));
});

test('a response\'s answers are removed with it, including when it expires', function () {
    $this->post(route('surveys.responses.store', $this->survey), followUpPayload([
        'respondent_group' => 'student', 'gender_identity' => 'cisgender-woman',
        'group_answers' => ['student-year' => '1st-year', 'scholar' => 'no'],
    ]))->assertSessionHasNoErrors();
    expect(SurveyGroupAnswer::query()->count())->toBe(2);

    SurveyResponse::query()->update(['expires_at' => now()->subDay()]);
    $this->artisan('surveys:prune-expired')->assertSuccessful();

    expect(SurveyResponse::query()->count())->toBe(0)
        ->and(SurveyGroupAnswer::query()->count())->toBe(0);
});

test('the database only accepts a choice that belongs to the answered question', function () {
    $this->post(route('surveys.responses.store', $this->survey), followUpPayload([
        'respondent_group' => 'student', 'gender_identity' => 'cisgender-woman',
        'group_answers' => ['student-year' => '1st-year', 'scholar' => 'no'],
    ]))->assertSessionHasNoErrors();
    $response = SurveyResponse::query()->sole();
    $studentYear = SurveyGroupQuestion::query()->where('key', 'student-year')->sole();
    $scholarYes = SurveyGroupOption::query()->where('value', 'yes')->sole();

    // "Yes" belongs to "Are you a scholar?", not to "Student year".
    expect(fn () => SurveyGroupAnswer::query()->where('survey_response_id', $response->id)
        ->where('question_id', $studentYear->id)
        ->update(['option_id' => $scholarYes->id]))
        ->toThrow(QueryException::class);
});

test('a choice that has been picked cannot be deleted outright', function () {
    $this->post(route('surveys.responses.store', $this->survey), followUpPayload([
        'respondent_group' => 'student', 'gender_identity' => 'cisgender-woman',
        'group_answers' => ['student-year' => '1st-year', 'scholar' => 'no'],
    ]))->assertSessionHasNoErrors();

    expect(fn () => SurveyGroupOption::query()->where('value', 'no')->delete())
        ->toThrow(QueryException::class);
});
