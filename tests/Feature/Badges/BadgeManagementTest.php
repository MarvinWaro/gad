<?php

use App\Actions\Badges\AwardEarnedBadges;
use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\BadgeRule;
use App\Enums\NotificationKind;
use App\Enums\UserStatus;
use App\Models\ActivityLog;
use App\Models\Badge;
use App\Models\Notification;
use App\Models\Post;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('public');
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->otherRegion = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $cluster = SurveyCluster::query()->create(['survey_region_id' => $this->region->id, 'name' => 'South Cotabato', 'is_active' => true]);
    $otherCluster = SurveyCluster::query()->create(['survey_region_id' => $this->otherRegion->id, 'name' => 'Davao', 'is_active' => true]);
    $this->hei = SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => 'Notre Dame of Marbel University', 'is_active' => true]);
    $this->otherHei = SurveyHei::query()->create(['survey_cluster_id' => $otherCluster->id, 'name' => 'Davao Fixture College', 'is_active' => true]);
    $this->central = User::factory()->nationalOffice()->create();
    $this->central->assignRole('admin');
    $this->regional = User::factory()->regionalOffice($this->region)->create();
    $this->regional->assignRole('admin');
});

function badgeMember(SurveyHei $hei, string $name = 'Ana Dela Cruz'): User
{
    $user = User::factory()->create(['survey_hei_id' => $hei->id, 'name' => $name]);
    $user->assignRole('hei');

    return $user;
}

/** @param array<string, mixed> $overrides */
function customBadge(?SurveyRegion $region, array $overrides = []): Badge
{
    return Badge::query()->create([
        'survey_region_id' => $region?->id,
        'name' => 'Women\'s Month Speaker',
        'description' => 'Spoke at the Women\'s Month forum.',
        'is_active' => true,
        ...$overrides,
    ]);
}

test('administrators open Settings → Badges; other roles do not', function (string $role) {
    $user = User::factory()->regionalOffice($this->region)->create();
    $user->assignRole($role);

    $this->actingAs($user)->get(route('settings.badges.index'))->assertForbidden();
})->with(['ched-focal', 'ched-employee', 'gad-focal-person', 'hei']);

test('the list shows the system badges first, then the office\'s own', function () {
    customBadge($this->region);
    customBadge($this->otherRegion, ['name' => 'Davao Volunteer']);

    $this->actingAs($this->regional)->get(route('settings.badges.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/badges')
            ->has('badges.data', 5)
            ->where('badges.data.0.rule', 'community-spark')
            ->where('badges.data.3.rule', 'agenda-builder')
            ->where('badges.data.0.can.update', false)
            ->where('badges.data.0.can.delete', false)
            ->where('badges.data.4.name', 'Women\'s Month Speaker')
            ->where('badges.data.4.can', ['update' => true, 'delete' => true, 'award' => true]));

    $this->actingAs($this->central)->get(route('settings.badges.index'))
        ->assertInertia(fn (Assert $page) => $page->has('badges.data', 6)->where('badges.data.0.can.update', true));
});

test('a badge is created with a picture, which can be replaced and removed', function () {
    $this->actingAs($this->regional)
        ->post(route('settings.badges.store'), [
            'name' => 'Forum Speaker',
            'description' => 'Spoke at a GAD forum.',
            'is_active' => '1',
            'region' => $this->otherRegion->id,
            'image' => UploadedFile::fake()->image('speaker.png', 256, 256),
        ])
        ->assertRedirect(route('settings.badges.index'));

    $badge = Badge::query()->where('name', 'Forum Speaker')->sole();
    expect($badge->survey_region_id)->toBe($this->region->id)
        ->and($badge->rule)->toBeNull()
        ->and($badge->image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($badge->image_path);
    $first = $badge->image_path;

    $this->actingAs($this->regional)->post(route('settings.badges.update', $badge), [
        '_method' => 'put',
        'name' => 'Forum Speaker',
        'description' => 'Spoke at a GAD forum.',
        'is_active' => '1',
        'image' => UploadedFile::fake()->image('new.webp', 256, 256),
    ])->assertSessionHasNoErrors();
    Storage::disk('public')->assertMissing($first);
    Storage::disk('public')->assertExists($badge->refresh()->image_path);

    $this->actingAs($this->regional)->post(route('settings.badges.update', $badge), [
        '_method' => 'put',
        'name' => 'Forum Speaker',
        'description' => 'Spoke at a GAD forum.',
        'is_active' => '0',
        'remove_image' => '1',
    ])->assertSessionHasNoErrors();
    expect($badge->refresh()->image_path)->toBeNull()
        ->and($badge->is_active)->toBeFalse();
    expect(Storage::disk('public')->allFiles('badges'))->toBe([]);
});

test('SVG and oversized pictures are refused', function () {
    $payload = ['name' => 'Forum Speaker', 'description' => 'Spoke.', 'is_active' => '1'];

    $this->actingAs($this->regional)
        ->post(route('settings.badges.store'), [...$payload, 'image' => UploadedFile::fake()->create('badge.svg', 4, 'image/svg+xml')])
        ->assertSessionHasErrors(['image' => 'Choose a PNG, JPG or WebP picture.']);
    $this->actingAs($this->regional)
        ->post(route('settings.badges.store'), [...$payload, 'image' => UploadedFile::fake()->image('big.png', 2000, 2000)->size(900)])
        ->assertSessionHasErrors(['image' => 'Choose a picture under 512 KB.']);

    expect(Badge::query()->whereNull('rule')->count())->toBe(0);
});

test('system badges are the Central Office\'s to edit, are never deleted, and keep their rule', function () {
    $spark = Badge::query()->where('rule', BadgeRule::CommunitySpark)->sole();
    $payload = ['name' => 'First Spark', 'description' => 'A first tagged photo.', 'is_active' => '1', 'region' => $this->region->id];

    $this->actingAs($this->regional)->put(route('settings.badges.update', $spark), $payload)->assertForbidden();
    $this->actingAs($this->regional)->delete(route('settings.badges.destroy', $spark))->assertForbidden();

    $this->actingAs($this->central)->put(route('settings.badges.update', $spark), $payload)->assertSessionHasNoErrors();
    expect($spark->refresh())
        ->name->toBe('First Spark')
        ->rule->toBe(BadgeRule::CommunitySpark)
        ->survey_region_id->toBeNull();

    $this->actingAs($this->central)->delete(route('settings.badges.destroy', $spark))->assertSessionHasErrors('badge');
    expect(Badge::query()->whereKey($spark->id)->exists())->toBeTrue();
});

test('a regional office cannot touch another region\'s badge', function () {
    $theirs = customBadge($this->otherRegion);

    $this->actingAs($this->regional)->get(route('settings.badges.show', $theirs))->assertForbidden();
    $this->actingAs($this->regional)->patch(route('settings.badges.status', $theirs), ['is_active' => false])->assertForbidden();
    $this->actingAs($this->regional)->delete(route('settings.badges.destroy', $theirs))->assertForbidden();
    $this->actingAs($this->regional)->post(route('settings.badges.awards.store', $theirs), ['user' => badgeMember($this->otherHei)->id])->assertForbidden();
});

test('a custom badge is awarded by hand to people of its region, once, and they are told', function () {
    $badge = customBadge($this->region);
    $ana = badgeMember($this->hei);

    $this->actingAs($this->regional)
        ->post(route('settings.badges.awards.store', $badge), ['user' => $ana->id, 'note' => 'the Women\'s Month forum'])
        ->assertSessionHasNoErrors();

    $award = $badge->awards()->sole();
    expect($award)
        ->user_id->toBe($ana->id)
        ->awarded_by->toBe($this->regional->id)
        ->note->toBe('the Women\'s Month forum');
    $notice = Notification::query()->where('user_id', $ana->id)->sole();
    expect($notice->kind)->toBe(NotificationKind::BadgeAwarded)
        ->and($notice->linkFor($ana))->toBe(route('my-profile', ['tab' => 'badges']));
    expect(ActivityLog::query()->where('module', ActivityModule::Badges)->where('action', ActivityAction::Awarded)->sole())
        ->survey_hei_id->toBe($this->hei->id)
        ->properties->toBe(['recipient' => 'Ana Dela Cruz']);

    $this->actingAs($this->regional)->post(route('settings.badges.awards.store', $badge), ['user' => $ana->id])
        ->assertSessionHasErrors(['user' => 'Ana Dela Cruz already holds this badge.']);
    $this->actingAs($this->regional)->post(route('settings.badges.awards.store', $badge), ['user' => badgeMember($this->otherHei, 'Ben Santos')->id])
        ->assertSessionHasErrors(['user' => 'This badge is for Regional Office XII only.']);

    $badge->update(['is_active' => false]);
    $this->actingAs($this->regional)->post(route('settings.badges.awards.store', $badge), ['user' => badgeMember($this->hei, 'Cara Reyes')->id])
        ->assertSessionHasErrors(['user' => 'Switch this badge on before awarding it.']);

    $spark = Badge::query()->where('rule', BadgeRule::CommunitySpark)->sole();
    $this->actingAs($this->central)->post(route('settings.badges.awards.store', $spark), ['user' => $ana->id])
        ->assertSessionHasErrors(['user' => 'This badge is earned by sharing GAD work, not awarded by hand.']);
});

test('a hand award can be taken back; an earned badge cannot', function () {
    $badge = customBadge($this->region);
    $ana = badgeMember($this->hei);
    $this->actingAs($this->regional)->post(route('settings.badges.awards.store', $badge), ['user' => $ana->id]);

    $this->actingAs($this->regional)
        ->delete(route('settings.badges.awards.destroy', [$badge, $badge->awards()->sole()]))
        ->assertSessionHas('inertia.flash_data.toast.message', 'Women\'s Month Speaker taken back from Ana Dela Cruz.');
    expect($badge->awards()->count())->toBe(0);

    $post = Post::query()->forceCreate(['user_id' => $ana->id, 'survey_hei_id' => $this->hei->id, 'body' => 'GAD work.']);
    $post->images()->create(['path' => 'posts/a.jpg', 'sort_order' => 0]);
    $post->sdgs()->create(['sdg' => 5]);
    app(AwardEarnedBadges::class)->for($ana);
    $spark = Badge::query()->where('rule', BadgeRule::CommunitySpark)->sole();

    $this->actingAs($this->central)
        ->delete(route('settings.badges.awards.destroy', [$spark, $spark->awards()->sole()]))
        ->assertSessionHasErrors('award');
});

test('deleting a custom badge takes it off profiles, with its picture', function () {
    $badge = customBadge($this->region, ['image_path' => UploadedFile::fake()->image('b.png', 128, 128)->store('badges', 'public')]);
    $ana = badgeMember($this->hei);
    $badge->awards()->create(['user_id' => $ana->id, 'awarded_at' => now()]);

    $this->actingAs($this->regional)->delete(route('settings.badges.destroy', $badge))->assertRedirect(route('settings.badges.index'));

    expect($ana->badgeAwards()->count())->toBe(0)
        ->and(Storage::disk('public')->allFiles('badges'))->toBe([]);
});

test('the people search offers only active people of the badge\'s region who do not hold it', function () {
    $badge = customBadge($this->region);
    badgeMember($this->hei, 'Ana Dela Cruz');
    $holder = badgeMember($this->hei, 'Ana Holder');
    $badge->awards()->create(['user_id' => $holder->id, 'awarded_at' => now()]);
    badgeMember($this->otherHei, 'Ana Elsewhere');
    badgeMember($this->hei, 'Ana Inactive')->update(['status' => UserStatus::Inactive]);

    $this->actingAs($this->regional)
        ->getJson(route('settings.badges.people', ['badge' => $badge, 'q' => 'Ana']))
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.name', 'Ana Dela Cruz')
        ->assertJsonPath('0.place', 'Notre Dame of Marbel University');
});

test('My Profile shows badges and GAD Quest badges together, newest first', function () {
    $ana = badgeMember($this->hei);
    $badge = customBadge($this->region);
    $badge->awards()->create(['user_id' => $ana->id, 'awarded_by' => $this->regional->id, 'note' => 'the forum', 'awarded_at' => now()->subDay()]);
    playQuest(createQuest($this->region), $ana, 5);

    $this->actingAs($ana)->get(route('my-profile'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('achievements', 2)
            ->where('achievements.0.medal', 'champion')
            ->where('achievements.0.caption', 'Champion')
            ->where('achievements.1.name', 'Women\'s Month Speaker')
            ->where('achievements.1.medal', 'custom')
            ->where('achievements.1.caption', null)
            ->where('achievements.1.facts', [
                ['label' => 'Organizer', 'value' => 'Regional Office XII'],
                ['label' => 'Awarded by', 'value' => $this->regional->name],
                ['label' => 'For', 'value' => 'the forum'],
            ]));
});
