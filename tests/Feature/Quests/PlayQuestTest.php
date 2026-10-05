<?php

use App\Actions\Quests\ManageQuest;
use App\Actions\Quests\PlayQuest;
use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\NotificationKind;
use App\Enums\QuestLevel;
use App\Enums\QuestStatus;
use App\Models\ActivityLog;
use App\Models\Badge;
use App\Models\Quest;
use App\Models\QuestChoice;
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
    $this->hei = SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => 'Notre Dame of Marbel University', 'is_active' => true]);
    $this->player = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $this->player->assignRole('hei');
});

/** The correct choice of a question, or its first wrong one. */
function questChoice(Quest $quest, int $position, bool $correct = true): QuestChoice
{
    return $quest->questions()->where('position', $position)->sole()
        ->choices()->where('is_correct', $correct)->orderBy('position')->firstOrFail();
}

/** What the page sends for a choice: the question and the choice's key in the player's attempt. */
function questAnswer(Quest $quest, User $player, QuestChoice $choice): array
{
    $attempt = $quest->attempts()->where('user_id', $player->id)->latest('started_at')->latest('id')->firstOrFail();

    return ['question' => $choice->quest_question_id, 'choice' => $attempt->keyFor($choice->id)];
}

test('players see the open quests of their region and those for every region', function () {
    createQuest($this->region, overrides: ['title' => 'Ours']);
    createQuest(null, overrides: ['title' => 'Everyone\'s']);
    createQuest($this->otherRegion, overrides: ['title' => 'Theirs']);
    createQuest($this->region, QuestStatus::Draft, overrides: ['title' => 'Draft']);
    createQuest($this->region, QuestStatus::Closed, overrides: ['title' => 'Closed']);

    $this->actingAs($this->player)->get(route('quests.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('quests/index')
            ->has('quests.data', 2)
            ->where('quests.data.0.progress', 'new')
            ->where('quests.data.0.questions', 5)
            ->where('achievements', [])
            ->where('canManage', false));
    $titles = collect($this->actingAs($this->player)->get(route('quests.index'))->inertiaProps('quests.data'))->pluck('title')->sort()->values()->all();
    expect($titles)->toBe(['Everyone\'s', 'Ours']);

    $this->actingAs($this->player)->get(route('quests.show', Quest::query()->where('title', 'Theirs')->sole()))->assertForbidden();
    $this->actingAs($this->player)->get(route('quests.show', Quest::query()->where('title', 'Draft')->sole()))->assertForbidden();
});

test('administrators do not play, and a quest\'s author does not play their own', function () {
    $author = User::factory()->regionalOffice($this->region)->create();
    $author->assignRole('ched-focal');
    $colleague = User::factory()->regionalOffice($this->region)->create();
    $colleague->assignRole('ched-focal');
    $admin = User::factory()->regionalOffice($this->region)->create();
    $admin->assignRole('admin');
    $quest = createQuest($this->region, author: $author);

    $this->actingAs($admin)->get(route('quests.index'))->assertForbidden();
    $this->actingAs($admin)->get(route('quests.show', $quest))->assertForbidden();
    $this->actingAs($author)->get(route('quests.show', $quest))->assertForbidden();
    $this->actingAs($author)->post(route('quests.attempts.store', $quest))->assertForbidden();
    $this->actingAs($colleague)->get(route('quests.show', $quest))->assertOk();
});

test('the page never holds a question\'s answer before it is answered', function () {
    $quest = createQuest($this->region);

    $this->actingAs($this->player)->post(route('quests.attempts.store', $quest))->assertRedirect(route('quests.show', $quest));
    $response = $this->actingAs($this->player)->get(route('quests.show', $quest));

    $response->assertInertia(fn (Assert $page) => $page
        ->component('quests/play')
        ->where('attempt.finished', false)
        ->has('attempt.questions', 5)
        ->where('attempt.questions.0.answer', null)
        ->has('attempt.questions.0.choices', 3)
        ->where('can.answer', true)
        ->where('can.start', false));

    $page = json_encode($response->inertiaProps());
    expect($page)->not->toContain('Placeholder explanation')
        ->and($page)->not->toContain('is_correct')
        ->and($page)->not->toContain('"correct"');

    // Choices go by an opaque key, never by their id, which would show the
    // order the author wrote them in (the right answer is often first).
    $choiceIds = QuestChoice::query()->pluck('id')->map(fn (int $id): string => (string) $id)->all();
    foreach ($response->inertiaProps('attempt.questions') as $question) {
        foreach ($question['choices'] as $choice) {
            expect(array_keys($choice))->toBe(['key', 'label'])
                ->and($choice['key'])->toMatch('/^[0-9a-f]{20}$/')
                ->and($choiceIds)->not->toContain($choice['key']);
        }
    }
});

test('answering shows the right choice and why, and the last answer finishes with a badge', function () {
    $quest = createQuest($this->region);
    $this->actingAs($this->player)->post(route('quests.attempts.store', $quest));

    $wrong = questChoice($quest, 1, correct: false);
    $this->actingAs($this->player)
        ->post(route('quests.answers.store', $quest), questAnswer($quest, $this->player, $wrong))
        ->assertRedirect(route('quests.show', $quest));

    $answered = collect($this->actingAs($this->player)->get(route('quests.show', $quest))->inertiaProps('attempt.questions'))
        ->firstWhere('id', $wrong->quest_question_id);
    expect($answered['answer'])->toBe([
        'choice' => questAnswer($quest, $this->player, $wrong)['choice'],
        'correct' => questAnswer($quest, $this->player, questChoice($quest, 1))['choice'],
        'is_correct' => false,
        'explanation' => 'Placeholder explanation 1.',
    ]);

    foreach (range(2, 5) as $position) {
        $this->actingAs($this->player)->post(route('quests.answers.store', $quest), questAnswer($quest, $this->player, questChoice($quest, $position)));
    }

    $this->actingAs($this->player)->get(route('quests.show', $quest))
        ->assertInertia(fn (Assert $page) => $page
            ->where('attempt.finished', true)
            ->where('attempt.score', 4)
            ->where('attempt.level', 'advocate')
            ->where('best.level', 'advocate')
            ->where('best.score', 4)
            ->where('best.total', 5)
            ->where('can.start', false)
            ->where('can.answer', false));

    $log = ActivityLog::query()->where('module', ActivityModule::Quests)->where('action', ActivityAction::Completed)->sole();
    expect($log->user_id)->toBe($this->player->id)
        ->and($log->survey_hei_id)->toBe($this->hei->id)
        ->and($log->properties)->toBe(['score' => 4, 'questions' => 5, 'level' => 'advocate']);
});

test('each player plays once unless retakes are on, and their best attempt counts', function () {
    $quest = createQuest($this->region);
    playQuest($quest, $this->player, 3);

    $this->actingAs($this->player)->post(route('quests.attempts.store', $quest))
        ->assertSessionHasErrors(['quest' => 'You have already played this quest.']);

    app(ManageQuest::class)->setRetakes($quest, true);
    playQuest($quest->refresh(), $this->player, 5);
    playQuest($quest, $this->player, 1);
    app(ManageQuest::class)->setRetakes($quest, false);

    $this->actingAs($this->player)->get(route('quests.show', $quest))
        ->assertInertia(fn (Assert $page) => $page
            ->where('attempt.score', 1)
            ->where('best.level', 'champion')
            ->where('can.start', false));

    $this->actingAs($this->player)->get(route('my-profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('achievements', 1)
            ->where('achievements.0.medal', 'champion')
            ->where('achievements.0.caption', 'Champion')
            ->where('achievements.0.name', 'Placeholder quest')
            ->where('achievements.0.facts', [
                ['label' => 'Score', 'value' => '5 of 5 correct'],
                ['label' => 'Organizer', 'value' => 'Regional Office XII'],
            ]));
});

test('a finish that earns the quest\'s badge, or a higher level of it, is told to the player', function () {
    $quest = createQuest($this->region, overrides: ['title' => 'Safe Spaces Week']);
    $advocate = Badge::query()->where('quest_level', QuestLevel::Advocate)->sole();
    playQuest($quest, $this->player, 4);

    $notice = $this->player->notifications()->sole();
    $entry = $notice->activity;
    expect($notice->kind)->toBe(NotificationKind::BadgeEarned)
        ->and($entry->module)->toBe(ActivityModule::Badges)
        ->and($entry->action)->toBe(ActivityAction::Earned)
        ->and($entry->user_id)->toBe($this->player->id)
        ->and($entry->subject_id)->toBe($advocate->id)
        ->and($entry->survey_hei_id)->toBe($this->hei->id);
    $this->actingAs($this->player)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.actor', null)
        ->assertJsonPath('data.0.sentence', ['before' => 'You earned the', 'subject' => 'Safe Spaces Week Advocate', 'after' => 'badge. See it on your profile.'])
        ->assertJsonPath('data.0.url', route('my-profile', ['tab' => 'badges']));

    // A replay at the same level or below earns nothing new; a higher level does.
    app(ManageQuest::class)->setRetakes($quest, true);
    playQuest($quest, $this->player, 4);
    playQuest($quest, $this->player, 2);
    expect($this->player->notifications()->count())->toBe(1);

    playQuest($quest, $this->player, 5);
    expect($this->player->notifications()->count())->toBe(2)
        ->and(ActivityLog::query()->where('module', ActivityModule::Badges)->latest('id')->first()->subject_label)->toBe('Safe Spaces Week Champion');
});

test('an unfinished attempt carries on where it stopped', function () {
    $quest = createQuest($this->region);
    $game = app(PlayQuest::class);
    $attempt = $game->start($quest, $this->player);
    foreach ([1, 2] as $position) {
        $choice = questChoice($quest, $position);
        $game->answer($quest, $this->player, $choice->quest_question_id, $attempt->keyFor($choice->id));
    }

    $this->actingAs($this->player)->post(route('quests.attempts.store', $quest))->assertSessionHasNoErrors();

    expect($quest->attempts()->count())->toBe(1);
    $questions = $this->actingAs($this->player)->get(route('quests.show', $quest))->inertiaProps('attempt.questions');
    expect(collect($questions)->whereNotNull('answer')->count())->toBe(2);
});

test('an answer must be one of the question\'s own choices, given once', function () {
    $quest = createQuest($this->region);
    $this->actingAs($this->player)->post(route('quests.attempts.store', $quest));
    $first = questChoice($quest, 1);
    $other = questChoice($quest, 2);

    $this->actingAs($this->player)->post(route('quests.answers.store', $quest), [...questAnswer($quest, $this->player, $other), 'question' => $first->quest_question_id])
        ->assertSessionHasErrors('answer');
    // A choice's id is no key.
    $this->actingAs($this->player)->post(route('quests.answers.store', $quest), ['question' => $first->quest_question_id, 'choice' => (string) $first->id])
        ->assertSessionHasErrors('answer');
    $this->actingAs($this->player)->post(route('quests.answers.store', $quest), questAnswer($quest, $this->player, $first))
        ->assertSessionHasNoErrors();
    $this->actingAs($this->player)->post(route('quests.answers.store', $quest), questAnswer($quest, $this->player, $first))
        ->assertSessionHasErrors(['answer' => 'You have already answered this question.']);
});

test('a closed quest keeps the player\'s result but cannot be started or carried on', function () {
    $quest = createQuest($this->region);
    $this->actingAs($this->player)->post(route('quests.attempts.store', $quest));
    app(ManageQuest::class)->close($quest);
    $this->actingAs($this->player)->post(route('quests.answers.store', $quest), questAnswer($quest, $this->player, questChoice($quest, 1)))
        ->assertSessionHasErrors(['quest' => 'This quest is closed.']);
    $this->actingAs($this->player)->get(route('quests.show', $quest))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('quest.status', 'closed')
            ->where('can.start', false)
            ->where('can.answer', false));
    $this->actingAs($this->player)->get(route('quests.index'))
        ->assertInertia(fn (Assert $page) => $page->has('quests.data', 1)->where('quests.data.0.progress', 'in_progress'));
});

test('the HEI home shows the newest open quest and how far the player got', function () {
    createQuest($this->region, overrides: ['title' => 'Older']);
    $this->travel(1)->minute();
    $quest = createQuest($this->region, overrides: ['title' => 'Newest']);

    $this->actingAs($this->player)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('hei/home')
            ->where('quest.title', 'Newest')
            ->where('quest.progress', 'new')
            ->where('quest.best', null));

    playQuest($quest, $this->player, 5);

    $this->actingAs($this->player)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('quest.progress', 'finished')
            ->where('quest.best.level', 'champion'));
});
