<?php

use App\Enums\UserStatus;
use App\Models\Post;
use App\Models\SurveyHei;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});

function safeguardMember(?SurveyHei $hei = null): User
{
    $user = User::factory()->create([
        'name' => 'Ana Dela Cruz',
        'survey_hei_id' => ($hei ?? createSurveyHei())->id,
    ]);
    $user->assignRole('hei');

    return $user;
}

test('a user who has posted cannot be deleted, and the toast says why', function () {
    $member = safeguardMember();
    $post = Post::query()->create(['user_id' => $member->id, 'survey_hei_id' => $member->survey_hei_id, 'body' => 'Seminar']);
    Post::query()->create(['user_id' => $member->id, 'survey_hei_id' => $member->survey_hei_id, 'body' => 'Forum']);
    $post->comments()->create(['user_id' => $member->id, 'body' => 'Photos to follow.']);

    $this->actingAs($this->admin)
        ->delete(route('settings.users.destroy', $member))
        ->assertRedirect()
        ->assertSessionHas('inertia.flash_data.toast', [
            'type' => 'error',
            'message' => 'Ana Dela Cruz has 2 posts and 1 comment. Deactivate the account instead to keep them.',
        ]);

    expect(User::query()->whereKey($member->id)->exists())->toBeTrue()
        ->and(Post::query()->count())->toBe(2);
});

test('a user with no activity is deleted with a confirmation', function () {
    $member = safeguardMember();

    $this->actingAs($this->admin)
        ->delete(route('settings.users.destroy', $member))
        ->assertSessionHas('inertia.flash_data.toast', ['type' => 'success', 'message' => 'Ana Dela Cruz deleted.']);

    expect(User::query()->whereKey($member->id)->exists())->toBeFalse();
});

test('deleting yourself is refused with a red toast', function () {
    $this->actingAs($this->admin)
        ->delete(route('settings.users.destroy', $this->admin))
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');

    expect(User::query()->whereKey($this->admin->id)->exists())->toBeTrue();
});

test('deactivating an author keeps their posts in the feed, marked', function () {
    $member = safeguardMember();
    $post = Post::query()->create(['user_id' => $member->id, 'survey_hei_id' => $member->survey_hei_id, 'body' => 'Seminar']);
    $post->comments()->create(['user_id' => $member->id, 'body' => 'Thanks, everyone.']);

    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $member), ['status' => 'inactive'])
        ->assertSessionHas(
            'inertia.flash_data.toast.message',
            'Ana Dela Cruz deactivated. Their activity (1 post and 1 comment) stays visible, marked as from a deactivated account.',
        );

    $this->actingAs($this->admin)
        ->get(route('community'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('posts.data', 1)
            ->where('posts.data.0.author.deactivated', true)
            ->where('posts.data.0.comments.0.author.deactivated', true));

    $this->actingAs($this->admin)
        ->patch(route('settings.users.status', $member), ['status' => 'active'])
        ->assertSessionHas('inertia.flash_data.toast.message', 'Ana Dela Cruz reactivated.');
    expect($member->fresh()->status)->toBe(UserStatus::Active);

    $this->actingAs($this->admin)
        ->get(route('community'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('posts.data.0.author.deactivated', false));
});

test('a school with accounts or posts cannot be deleted', function () {
    $hei = createSurveyHei(['name' => 'NOTRE DAME OF MARBEL UNIVERSITY']);
    $member = safeguardMember($hei);
    Post::query()->create(['user_id' => $member->id, 'survey_hei_id' => $hei->id, 'body' => 'Seminar']);

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'heis', 'id' => $hei->id]))
        ->assertSessionHas('inertia.flash_data.toast', [
            'type' => 'error',
            'message' => 'Notre Dame of Marbel University has 1 user account and 1 post. Deactivate it instead.',
        ]);

    expect(SurveyHei::query()->whereKey($hei->id)->exists())->toBeTrue()
        ->and(Post::query()->sole()->survey_hei_id)->toBe($hei->id)
        ->and($member->fresh()->survey_hei_id)->toBe($hei->id);
});

test('an unused school is deleted with a confirmation', function () {
    $hei = createSurveyHei(['name' => 'ACLC COLLEGE OF MARBEL']);

    $this->actingAs($this->admin)
        ->delete(route('settings.survey-directories.destroy', ['type' => 'heis', 'id' => $hei->id]))
        ->assertSessionHas('inertia.flash_data.toast', ['type' => 'success', 'message' => 'ACLC College of Marbel deleted.']);

    expect(SurveyHei::query()->whereKey($hei->id)->exists())->toBeFalse();
});
