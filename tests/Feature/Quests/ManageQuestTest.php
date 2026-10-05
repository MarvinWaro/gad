<?php

use App\Actions\Quests\PlayQuest;
use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\QuestStatus;
use App\Models\ActivityLog;
use App\Models\Quest;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->otherRegion = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $cluster = SurveyCluster::query()->create(['survey_region_id' => $this->region->id, 'name' => 'South Cotabato', 'is_active' => true]);
    $this->hei = SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => 'NOTRE DAME OF MARBEL UNIVERSITY', 'is_active' => true]);
    $this->focal = User::factory()->regionalOffice($this->region)->create();
    $this->focal->assignRole('ched-focal');
});

function questPlayer(SurveyHei $hei, ?string $sex = null): User
{
    $user = User::factory()->create(['survey_hei_id' => $hei->id, 'sex' => $sex]);
    $user->assignRole('hei');

    return $user;
}

test('a CHED Focal writes a quest for their own region as a draft', function () {
    $response = $this->actingAs($this->focal)
        ->post(route('quests.manage.store'), [...questPayload(['title' => 'Safe Spaces Week']), 'region' => $this->otherRegion->id]);

    $quest = Quest::query()->sole();
    $response->assertRedirect(route('quests.manage.show', $quest));

    expect($quest->survey_region_id)->toBe($this->region->id)
        ->and($quest->status)->toBe(QuestStatus::Draft)
        ->and($quest->created_by)->toBe($this->focal->id)
        ->and($quest->questions()->count())->toBe(5);

    $first = $quest->questions()->with('choices')->first();
    expect($first->choices->pluck('label')->all())->toBe(['Right answer 1', 'Wrong answer 1', 'Other wrong answer 1'])
        ->and($first->choices->where('is_correct', true)->pluck('label')->all())->toBe(['Right answer 1']);

    expect(ActivityLog::query()->where('module', ActivityModule::Quests)->where('action', ActivityAction::Created)->sole()->survey_region_id)
        ->toBe($this->region->id);
});

test('the Central Office picks a region, or none for every region', function () {
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('ched-focal');

    $this->actingAs($central)->post(route('quests.manage.store'), [...questPayload(['title' => 'For XI']), 'region' => $this->otherRegion->id]);
    $this->actingAs($central)->post(route('quests.manage.store'), questPayload(['title' => 'For everyone']));

    expect(Quest::query()->where('title', 'For XI')->value('survey_region_id'))->toBe($this->otherRegion->id)
        ->and(Quest::query()->where('title', 'For everyone')->value('survey_region_id'))->toBeNull();
});

test('a quest has exactly five questions, each with 2 to 4 different choices and a correct one', function () {
    $payload = questPayload();
    $fewer = [...$payload, 'questions' => array_slice($payload['questions'], 0, 4)];
    $broken = $payload;
    $broken['questions'][0]['correct'] = 3;
    $broken['questions'][1]['choices'] = ['Yes', 'yes'];
    $broken['questions'][2]['choices'] = ['Only one'];
    $broken['questions'][3]['choices'] = ['A', 'B', 'C', 'D', 'E'];
    $broken['questions'][4]['choices'] = ['Yes', ''];
    $broken['questions'][4]['prompt'] = '';

    $this->actingAs($this->focal)->post(route('quests.manage.store'), $fewer)
        ->assertSessionHasErrors(['questions' => 'A quest has exactly 5 questions.']);
    $this->actingAs($this->focal)->post(route('quests.manage.store'), $broken)
        ->assertSessionHasErrors([
            'questions.0.correct' => 'Mark the correct choice for question 1.',
            'questions.1.choices' => 'Question 2 offers the same choice twice.',
            'questions.2.choices' => 'Give question 3 at least 2 choices.',
            'questions.3.choices' => 'Give question 4 at most 4 choices.',
            'questions.4.choices.1' => 'Fill in choice B of question 5, or remove it.',
            'questions.4.prompt' => 'Write question 5.',
        ])
        ->assertSessionDoesntHaveErrors('questions.4.correct');

    expect(Quest::query()->count())->toBe(0);
});

test('a question saved before its correct choice is marked asks for the mark', function () {
    // The form leaves a new question unmarked rather than defaulting to A.
    $payload = questPayload();
    $payload['questions'][2]['correct'] = null;

    $this->actingAs($this->focal)->post(route('quests.manage.store'), $payload)
        ->assertSessionHasErrors(['questions.2.correct' => 'Mark the correct choice for question 3.']);

    expect(session('errors')->first('questions.2.correct'))->toBe('Mark the correct choice for question 3.')
        ->and(Quest::query()->count())->toBe(0);
});

test('only administrators and CHED Focals write quests', function (string $role) {
    $user = User::factory()->regionalOffice($this->region)->create();
    $user->assignRole($role);

    $this->actingAs($user)->get(route('quests.manage.create'))->assertForbidden();
    $this->actingAs($user)->get(route('quests.manage.index'))->assertForbidden();
    $this->actingAs($user)->post(route('quests.manage.store'), questPayload())->assertForbidden();
})->with(['gad-focal-person', 'ched-employee', 'hei', 'hei-focal']);

test('an administrator with an office writes quests too', function () {
    $admin = User::factory()->regionalOffice($this->region)->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get(route('quests.manage.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quests/manage/edit')
            ->where('quest', null)
            ->where('limits.questions', 5)
            ->where('canPlay', false));
});

test('a CHED Focal cannot run another region\'s quest, or one for every region', function () {
    foreach ([createQuest($this->otherRegion), createQuest(null)] as $quest) {
        $this->actingAs($this->focal)->get(route('quests.manage.show', $quest))->assertForbidden();
        $this->actingAs($this->focal)->get(route('quests.manage.edit', $quest))->assertForbidden();
        $this->actingAs($this->focal)->put(route('quests.manage.update', $quest), questPayload())->assertForbidden();
        $this->actingAs($this->focal)->patch(route('quests.manage.status', $quest), ['status' => 'closed'])->assertForbidden();
        $this->actingAs($this->focal)->delete(route('quests.manage.destroy', $quest))->assertForbidden();
    }

    expect(Quest::query()->where('status', QuestStatus::Open)->count())->toBe(2);
});

test('the list shows a regional office its own region\'s quests and the Central Office all of them', function () {
    createQuest($this->region, overrides: ['title' => 'Ours']);
    createQuest($this->otherRegion, overrides: ['title' => 'Theirs']);
    createQuest(null, overrides: ['title' => 'Everyone\'s']);
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('ched-focal');

    $this->actingAs($this->focal)->get(route('quests.manage.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('quests/manage/index')
            ->has('quests.data', 1)
            ->where('quests.data.0.title', 'Ours')
            ->missing('quests.data.0.questions'));

    $this->actingAs($central)->get(route('quests.manage.index'))
        ->assertInertia(fn (Assert $page) => $page->has('quests.data', 3));
    $this->actingAs($central)->get(route('quests.manage.index', ['region' => $this->otherRegion->id]))
        ->assertInertia(fn (Assert $page) => $page->has('quests.data', 1)->where('quests.data.0.title', 'Theirs'));
});

test('the questions and region lock once someone has played; the title can still change', function () {
    $quest = createQuest($this->region, author: $this->focal);
    playQuest($quest, questPlayer($this->hei), 3);

    $changed = questPayload(['title' => 'Renamed']);
    $changed['questions'][0]['prompt'] = 'A new question?';

    $this->actingAs($this->focal)->put(route('quests.manage.update', $quest), $changed)
        ->assertSessionHasErrors('questions');
    expect($quest->refresh()->title)->toBe('Placeholder quest')
        ->and($quest->questions()->first()->prompt)->toBe('Placeholder question 1?');

    $this->actingAs($this->focal)->put(route('quests.manage.update', $quest), questPayload(['title' => 'Renamed']))
        ->assertRedirect(route('quests.manage.show', $quest));
    expect($quest->refresh()->title)->toBe('Renamed');

    $this->actingAs($this->focal)->get(route('quests.manage.edit', $quest))
        ->assertInertia(fn (Assert $page) => $page->where('quest.played', true)->where('quest.questions.0.correct', 0));
});

test('an unplayed quest\'s questions can be rewritten', function () {
    $quest = createQuest($this->region, QuestStatus::Draft, $this->focal);
    $changed = questPayload();
    $changed['questions'][4] = ['prompt' => 'True or false?', 'explanation' => 'Because.', 'choices' => ['True', 'False'], 'correct' => 1];

    $this->actingAs($this->focal)->put(route('quests.manage.update', $quest), $changed)->assertSessionHasNoErrors();

    $last = $quest->questions()->with('choices')->get()->last();
    expect($last->prompt)->toBe('True or false?')
        ->and($last->choices->where('is_correct', true)->pluck('label')->all())->toBe(['False']);
    expect(ActivityLog::query()->where('action', ActivityAction::Updated)->sole()->changes)->toBe(['questions' => [null, 'Edited']]);
});

test('opening, closing and retakes are each logged', function () {
    $quest = createQuest($this->region, QuestStatus::Draft, $this->focal);

    $this->actingAs($this->focal)->patch(route('quests.manage.status', $quest), ['status' => 'open'])->assertRedirect();
    expect($quest->refresh()->status)->toBe(QuestStatus::Open)->and($quest->published_at)->not->toBeNull();

    $this->actingAs($this->focal)->patch(route('quests.manage.status', $quest), ['status' => 'closed']);
    expect($quest->refresh()->status)->toBe(QuestStatus::Closed);

    $this->actingAs($this->focal)->patch(route('quests.manage.status', $quest), ['status' => 'open']);
    $this->actingAs($this->focal)->patch(route('quests.manage.retakes', $quest), ['allow_retakes' => true]);
    expect($quest->refresh()->status)->toBe(QuestStatus::Open)->and($quest->allow_retakes)->toBeTrue();

    $this->actingAs($this->focal)->patch(route('quests.manage.status', $quest), ['status' => 'draft'])
        ->assertSessionHasErrors('status');

    expect(ActivityLog::query()->where('module', ActivityModule::Quests)->where('user_id', $this->focal->id)->orderBy('id')->pluck('action')->all())
        ->toBe([ActivityAction::Published, ActivityAction::Closed, ActivityAction::Published, ActivityAction::Updated]);
});

test('a played quest cannot be deleted; an unplayed one can', function () {
    $played = createQuest($this->region, author: $this->focal);
    playQuest($played, questPlayer($this->hei), 5);
    $unplayed = createQuest($this->region, QuestStatus::Draft, $this->focal);

    $this->actingAs($this->focal)->delete(route('quests.manage.destroy', $played))->assertSessionHasErrors('quest');
    $this->actingAs($this->focal)->delete(route('quests.manage.destroy', $unplayed))->assertRedirect(route('quests.manage.index'));

    expect(Quest::query()->pluck('id')->all())->toBe([$played->id]);
});

test('results count each player once, by their best finished attempt, and by sex', function () {
    $quest = createQuest($this->region, author: $this->focal);
    $quest->update(['allow_retakes' => true]);
    $staff = User::factory()->regionalOffice($this->region)->create(['name' => 'Staff Player']);
    $staff->assignRole('ched-employee');

    playQuest($quest, questPlayer($this->hei, 'female'), 5);
    $male = questPlayer($this->hei, 'male');
    playQuest($quest, $male, 3);
    playQuest($quest, $male, 4);
    playQuest($quest, $staff, 2);
    app(PlayQuest::class)->start($quest, questPlayer($this->hei, 'female'));

    $this->actingAs($this->focal)->get(route('quests.manage.show', $quest))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quests/manage/show')
            ->where('summary.players', 4)
            ->where('summary.completed', 3)
            ->where('summary.perfect', 1)
            ->where('summary.average', 73)
            ->where('summary.by_sex', ['female' => 1, 'male' => 1, 'not_stated' => 1])
            ->has('participants.data', 4)
            ->where('participants.data.0.best', 5)
            ->where('participants.data.0.level', 'champion')
            ->where('participants.data.0.place', 'Notre Dame of Marbel University')
            ->where('participants.data.1.best', 4)
            ->where('participants.data.1.attempts', 2)
            ->where('participants.data.1.level', 'advocate')
            ->where('participants.data.2.name', 'Staff Player')
            ->where('participants.data.2.place', 'Regional Office XII')
            ->where('participants.data.3.best', null)
            ->has('heis', 1)
            ->where('quest.questions.0.correct', 0));
});
