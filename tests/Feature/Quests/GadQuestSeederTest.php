<?php

use App\Actions\Quests\ManageQuest;
use App\Enums\QuestStatus;
use App\Models\Quest;
use App\Models\QuestAttempt;
use App\Models\QuestChoice;
use App\Models\QuestQuestion;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\GadQuestSeeder;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

/** Each question's right answer, as its author means it. */
const STARTER_ANSWERS = [
    'Employment, education or training environments',
    'Yes',
    'Yes, it is economic abuse',
    'The equality of men and women and their right to enjoy equal conditions',
    'Unwanted remarks directed towards a person, such as wolf-whistling or sexist slurs',
];

beforeEach(function () {
    $this->seed([RbacSeeder::class, AdminUserSeeder::class, GadQuestSeeder::class]);
    $this->admin = User::query()->where('email', 'admin@gmail.com')->sole();
    $this->quest = Quest::query()->with('questions.choices')->sole();
});

test('the starter quest is a draft for every region, with five questions of one right answer each', function () {
    expect($this->quest->title)->toBe(GadQuestSeeder::TITLE)
        ->and($this->quest->status)->toBe(QuestStatus::Draft)
        ->and($this->quest->survey_region_id)->toBeNull()
        ->and($this->quest->questions)->toHaveCount(Quest::QUESTIONS);

    foreach ($this->quest->questions->values() as $index => $question) {
        expect($question->choices->count())->toBeGreaterThanOrEqual(Quest::MIN_CHOICES)->toBeLessThanOrEqual(Quest::MAX_CHOICES)
            ->and($question->choices->where('is_correct', true)->pluck('label')->all())->toBe([STARTER_ANSWERS[$index]]);
    }
});

test('seeding again leaves the one starter quest', function () {
    $this->seed(GadQuestSeeder::class);

    expect(Quest::query()->count())->toBe(1);
});

test('the starter quest passes the quest form as it stands', function () {
    $this->actingAs($this->admin)
        ->put(route('quests.manage.update', $this->quest), [
            'title' => $this->quest->title,
            'description' => $this->quest->description,
            'region' => null,
            'questions' => $this->quest->questions->map(fn (QuestQuestion $question): array => [
                'prompt' => $question->prompt,
                'explanation' => $question->explanation,
                'choices' => $question->choices->pluck('label')->all(),
                'correct' => $question->choices->search(fn (QuestChoice $choice): bool => $choice->is_correct),
            ])->all(),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('quests.manage.show', $this->quest));
});

test('the right answers score five of five, and its staff see them marked', function () {
    app(ManageQuest::class)->open($this->quest);
    $region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $cluster = SurveyCluster::query()->create(['survey_region_id' => $region->id, 'name' => 'South Cotabato', 'is_active' => true]);
    $hei = SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => 'NOTRE DAME OF MARBEL UNIVERSITY', 'is_active' => true]);
    $player = User::factory()->create(['survey_hei_id' => $hei->id]);
    $player->assignRole('hei');

    $this->actingAs($player)->post(route('quests.attempts.store', $this->quest))->assertSessionHasNoErrors();
    $attempt = $this->quest->attempts()->sole();
    foreach ($this->quest->questions->values() as $index => $question) {
        $choice = $question->choices->firstWhere('label', STARTER_ANSWERS[$index]);
        $this->actingAs($player)
            ->post(route('quests.answers.store', $this->quest), ['question' => $question->id, 'choice' => $attempt->keyFor($choice->id)])
            ->assertSessionHasNoErrors();
    }

    expect(QuestAttempt::query()->whereKey($attempt->id)->withScore()->sole()->score)->toBe(5);

    $this->actingAs($this->admin)->get(route('quests.manage.show', $this->quest))
        ->assertInertia(function (Assert $page): void {
            foreach (STARTER_ANSWERS as $index => $answer) {
                $page->where("quest.questions.{$index}.choices.0", $answer)
                    ->where("quest.questions.{$index}.correct", 0);
            }
        });
});
