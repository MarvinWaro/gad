<?php

use App\Actions\Quests\ManageQuest;
use App\Enums\QuestLevel;
use App\Models\Badge;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('public');
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->otherRegion = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $this->hei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $this->region->id, 'name' => 'South Cotabato', 'is_active' => true])->id,
        'name' => 'Notre Dame of Marbel University',
        'is_active' => true,
    ]);
    $this->otherHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $this->otherRegion->id, 'name' => 'Davao', 'is_active' => true])->id,
        'name' => 'Davao Fixture College',
        'is_active' => true,
    ]);
    $this->central = User::factory()->nationalOffice()->create();
    $this->central->assignRole('admin');
    $this->champion = Badge::query()->where('quest_level', QuestLevel::Champion)->sole();
});

function questLevelPlayer(SurveyHei $hei, string $name): User
{
    $user = User::factory()->create(['survey_hei_id' => $hei->id, 'name' => $name]);
    $user->assignRole('hei');

    return $user;
}

test('the GAD Quest levels follow the earned badges, and stay on, undeleted and unawarded', function () {
    $this->actingAs($this->central)->get(route('settings.badges.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('badges.data.4.name', 'Participant')
            ->where('badges.data.4.criterion', 'Finishing a GAD Quest')
            ->where('badges.data.5.criterion', 'Scoring 80% or more in a GAD Quest')
            ->where('badges.data.6.criterion', 'Every answer right in a GAD Quest')
            ->where('badges.data.6.medal', 'champion')
            ->where('badges.data.6.region', null)
            ->where('badges.data.6.can', ['update' => true, 'switch' => false, 'delete' => false, 'award' => false]));

    $this->actingAs($this->central)->patch(route('settings.badges.status', $this->champion), ['is_active' => false])
        ->assertSessionHasErrors(['badge' => 'GAD Quest badges come with every finished quest, so they stay on.']);
    $this->actingAs($this->central)->delete(route('settings.badges.destroy', $this->champion))
        ->assertSessionHasErrors(['badge' => 'GAD Quest badges come with every finished quest, so they cannot be deleted.']);
    $this->actingAs($this->central)->post(route('settings.badges.awards.store', $this->champion), ['user' => questLevelPlayer($this->hei, 'Ana Dela Cruz')->id])
        ->assertSessionHasErrors(['user' => 'This badge is earned by finishing a GAD Quest, not awarded by hand.']);
    // Saving the form never switches it off either.
    $this->actingAs($this->central)->put(route('settings.badges.update', $this->champion), [
        'name' => 'Champion',
        'description' => 'Answered every question correctly',
        'is_active' => '0',
    ])->assertSessionHasNoErrors();

    expect($this->champion->refresh()->is_active)->toBeTrue()
        ->and($this->champion->awards()->count())->toBe(0);
});

test('a level\'s new name, description and picture show on every quest badge of that level', function () {
    $quest = createQuest(null, overrides: ['title' => 'Safe Spaces Week']);
    $ana = questLevelPlayer($this->hei, 'Ana Dela Cruz');
    playQuest($quest, $ana, 5);

    $this->actingAs($this->central)->post(route('settings.badges.update', $this->champion), [
        '_method' => 'put',
        'name' => 'GAD Champion',
        'description' => 'Every answer right, every time.',
        'is_active' => '1',
        'image' => UploadedFile::fake()->image('champion.webp', 256, 256),
    ])->assertSessionHasNoErrors();
    $image = $this->champion->refresh()->image;
    expect($image)->not->toBeNull();

    $this->actingAs($ana)->get(route('my-profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('achievements.0.name', 'Safe Spaces Week')
            ->where('achievements.0.caption', 'GAD Champion')
            ->where('achievements.0.description', 'Every answer right, every time.')
            ->where('achievements.0.image', $image)
            ->where('questLevels.2', ['level' => 'champion', 'name' => 'GAD Champion', 'image' => $image]));
    $this->actingAs($ana)->get(route('quests.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('quests.data.0.best.level_label', 'GAD Champion')
            ->where('quests.data.0.best.meaning', 'Every answer right, every time.')
            ->where('quests.data.0.best.image', $image));
    $this->actingAs($this->central)->get(route('quests.manage.show', $quest))
        ->assertInertia(fn (Assert $page) => $page
            ->where('participants.data.0.level_label', 'GAD Champion')
            ->where('participants.data.0.image', $image));
});

test('each level counts the people holding it in any quest, and lists them with those quests', function () {
    $first = createQuest(null, overrides: ['title' => 'Safe Spaces Week']);
    $second = createQuest(null, overrides: ['title' => 'Women\'s Month']);
    $ana = questLevelPlayer($this->hei, 'Ana Dela Cruz');
    $ben = questLevelPlayer($this->otherHei, 'Ben Santos');
    playQuest($first, $ana, 5);
    $this->travel(5)->minutes();
    playQuest($second, $ana, 5);
    playQuest($first, $ben, 4);
    // A replay counts by the best finish, once: Ben stays an Advocate.
    app(ManageQuest::class)->setRetakes($first, true);
    playQuest($first, $ben, 2);

    $this->actingAs($this->central)->get(route('settings.badges.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('badges.data.4.holders', 0)
            ->where('badges.data.5.holders', 1)
            ->where('badges.data.6.holders', 1));

    $this->actingAs($this->central)->get(route('settings.badges.show', $this->champion))
        ->assertInertia(fn (Assert $page) => $page
            ->where('badge.holders', 1)
            ->where('holders.meta.total', 1)
            ->where('holders.data.0.person.name', 'Ana Dela Cruz')
            ->where('holders.data.0.person.place', 'Notre Dame of Marbel University')
            ->where('holders.data.0.awarded_by', null)
            ->where('holders.data.0.note', 'Women\'s Month, Safe Spaces Week'));

    // A regional office sees its own region's holders; a search matches names.
    $regional = User::factory()->regionalOffice($this->region)->create();
    $regional->assignRole('admin');
    $advocate = Badge::query()->where('quest_level', QuestLevel::Advocate)->sole();
    $this->actingAs($regional)->get(route('settings.badges.show', $advocate))
        ->assertInertia(fn (Assert $page) => $page->where('holders.meta.total', 0));
    $this->actingAs($this->central)->get(route('settings.badges.show', ['badge' => $advocate, 'search' => 'Ben']))
        ->assertInertia(fn (Assert $page) => $page->where('holders.data.0.person.name', 'Ben Santos'));
    $this->actingAs($this->central)->get(route('settings.badges.show', ['badge' => $advocate, 'search' => 'Ana']))
        ->assertInertia(fn (Assert $page) => $page->where('holders.meta.total', 0));
});

test('the level SQL counts as fromScore() does', function () {
    foreach (range(0, 10) as $total) {
        foreach (range(0, $total) as $correct) {
            $level = DB::selectOne('select '.QuestLevel::sql((string) $correct, (string) $total).' as level')->level;

            expect($level)->toBe(QuestLevel::fromScore($correct, $total)->value, "{$correct} of {$total}");
        }
    }
});
