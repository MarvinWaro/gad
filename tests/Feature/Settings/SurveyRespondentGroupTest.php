<?php

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyRespondentGroup;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    $this->survey = Survey::query()->where('slug', 'ra-7877')->sole();

    $this->region = SurveyRegion::query()->where('name', 'Region XII')->sole();
    $this->cluster = SurveyCluster::query()->create([
        'survey_region_id' => $this->region->id, 'name' => 'Test Cluster', 'is_active' => true,
    ]);
    $this->hei = SurveyHei::query()->create([
        'survey_cluster_id' => $this->cluster->id, 'name' => 'Test HEI', 'is_active' => true,
    ]);
});

function publishBaseSurvey(): void
{
    test()->survey->draftVersion()->update(['retention_days' => 365]);
    test()->actingAs(test()->admin)
        ->post(route('admin.surveys.publish', test()->survey))
        ->assertSessionHasNoErrors();
}

/** @return array<string, mixed> */
function groupPayload(string $group): array
{
    return [
        'version_id' => test()->survey->refresh()->publishedVersion()->id,
        'age' => 24, 'sex' => 'female', 'respondent_group' => $group,
        'region_id' => test()->region->id, 'cluster_id' => test()->cluster->id,
        'hei_id' => test()->hei->id, 'experiences' => ['none'],
        'perpetrators' => [], 'other_relative_details' => [], 'consent' => true,
    ];
}

test('the three default groups are seeded in order for every survey', function () {
    expect(SurveyRespondentGroup::active()->pluck('value')->all())
        ->toBe(['student', 'alumni', 'employee'])
        ->and(SurveyRespondentGroup::active()->pluck('label')->all())
        ->toBe(['Student', 'Alumni', 'Employee']);
});

test('every survey asks the question from the shared directory', function () {
    foreach (['ra-7877', 'ra-9262', 'ra-9710', 'ra-11313'] as $slug) {
        $question = collect(Survey::query()->where('slug', $slug)->sole()->draftVersion()->definition['sections'])
            ->flatMap(fn ($section) => $section['questions'])
            ->firstWhere('id', 'respondent_group');

        expect($question['type'])->toBe('directory_respondent_group')
            ->and($question)->not->toHaveKey('options');
    }
});

test('the public form receives the active groups in order', function () {
    publishBaseSurvey();

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('directories.respondent_groups', fn ($groups) => $groups->pluck('value')->all() === ['student', 'alumni', 'employee']));
});

test('a deactivated group disappears from the public form and is refused', function () {
    publishBaseSurvey();
    SurveyRespondentGroup::query()->where('value', 'alumni')->update(['is_active' => false]);

    $this->get(route('surveys.show', ['law' => 'ra-7877']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('directories.respondent_groups', fn ($groups) => $groups->pluck('value')->all() === ['student', 'employee']));

    $this->post(route('surveys.responses.store', $this->survey), groupPayload('alumni'))
        ->assertSessionHasErrors('respondent_group');
});

test('an answer is stored against the group value, and survives a rename', function () {
    publishBaseSurvey();

    $this->post(route('surveys.responses.store', $this->survey), groupPayload('alumni'))
        ->assertRedirect()->assertSessionHasNoErrors();

    $group = SurveyRespondentGroup::query()->where('value', 'alumni')->sole();
    $this->actingAs($this->admin)
        ->put(route('settings.survey-directories.update', ['type' => 'respondent-groups', 'id' => $group->id]), [
            'label' => 'Alumnus / Alumna', 'requires_text' => false, 'is_active' => true,
        ])->assertSessionHasNoErrors();

    expect($group->refresh()->value)->toBe('alumni')
        ->and($group->label)->toBe('Alumnus / Alumna')
        ->and(SurveyResponse::query()->sole()->respondent_group)->toBe('alumni');
});

test('a new group is created with a slug derived from its name', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'respondent-groups']), [
            'label' => 'Non-teaching personnel',
        ])->assertRedirect()->assertSessionHasNoErrors();

    $group = SurveyRespondentGroup::query()->where('label', 'Non-teaching personnel')->sole();

    expect($group->value)->toBe('non-teaching-personnel')
        ->and($group->is_active)->toBeTrue()
        ->and($group->requires_text)->toBeFalse();
});

test('a duplicate group name is refused', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'respondent-groups']), ['label' => 'Student'])
        ->assertSessionHasErrors('label');

    expect(SurveyRespondentGroup::query()->count())->toBe(3);
});

test('a group that asks for its own detail requires that detail', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.survey-directories.store', ['type' => 'respondent-groups']), [
            'label' => 'Other', 'requires_text' => true,
        ])->assertSessionHasNoErrors();
    publishBaseSurvey();

    $this->post(route('surveys.responses.store', $this->survey), groupPayload('other'))
        ->assertSessionHasErrors('respondent_group_other');

    $this->post(route('surveys.responses.store', $this->survey), [
        ...groupPayload('other'), 'respondent_group_other' => 'Board member',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(SurveyResponse::query()->sole()->respondent_group_other)->toBe('Board member');
});

test('a group with collected responses cannot be deleted', function () {
    publishBaseSurvey();
    $this->post(route('surveys.responses.store', $this->survey), groupPayload('student'))
        ->assertSessionHasNoErrors();
    $group = SurveyRespondentGroup::query()->where('value', 'student')->sole();

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'respondent-groups', 'id' => $group->id]))
        ->assertSessionHasErrors('directory');

    expect(SurveyRespondentGroup::query()->whereKey($group->id)->exists())->toBeTrue();
});

test('an unused group can be deleted', function () {
    $group = SurveyRespondentGroup::query()->where('value', 'employee')->sole();

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'respondent-groups', 'id' => $group->id]))
        ->assertSessionHasNoErrors();

    expect(SurveyRespondentGroup::query()->count())->toBe(2);
});

test('the settings page ships the directory for its table', function () {
    $this->actingAs($this->admin)->get(route('settings.survey-directories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('respondentGroups', 3)
            ->where('respondentGroups.0.value', 'student')
            ->where('respondentGroups.0.label', 'Student')
            ->where('respondentGroups.0.is_active', true));
});

test('only directory managers can change the groups', function () {
    $focal = User::factory()->create();
    $focal->assignRole('gad-focal-person');

    $this->actingAs($focal)
        ->post(route('settings.survey-directories.store', ['type' => 'respondent-groups']), ['label' => 'Sneaky'])
        ->assertForbidden();

    expect(SurveyRespondentGroup::query()->count())->toBe(3);
});

test('re-seeding never overwrites an edited label', function () {
    SurveyRespondentGroup::query()->where('value', 'student')->update(['label' => 'Enrolled student']);

    $this->seed(SurveySeeder::class);

    expect(SurveyRespondentGroup::query()->where('value', 'student')->sole()->label)
        ->toBe('Enrolled student')
        ->and(SurveyRespondentGroup::query()->count())->toBe(3);
});
