<?php

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Post;
use App\Models\User;
use App\Services\ActivityRecorder;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Profile HEI']);
    $this->member = User::factory()->create(['name' => 'Profile Member', 'survey_hei_id' => $this->hei->id]);
    $this->member->assignRole('hei-focal');
    $this->other = User::factory()->create(['survey_hei_id' => $this->hei->id]);
});

test('my profile lists only my own posts', function () {
    $mine = Post::query()->create(['user_id' => $this->member->id, 'survey_hei_id' => $this->hei->id, 'body' => 'My seminar']);
    Post::query()->create(['user_id' => $this->other->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Someone else']);

    $this->actingAs($this->member)->get(route('my-profile'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profile/show')
            ->where('institution', 'Fictional Profile HEI')
            ->missing('posts')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('posts.data', 1)
                ->where('posts.data.0.id', $mine->id)));
});

test('my profile shows my own activity, without links to pages I cannot open', function () {
    $recorder = app(ActivityRecorder::class);
    $recorder->record(ActivityAction::Login, ActivityModule::Authentication, actor: $this->member);
    $recorder->record(ActivityAction::Updated, ActivityModule::Users, $this->hei, actor: $this->member);
    $recorder->record(ActivityAction::Login, ActivityModule::Authentication, actor: $this->other);

    $this->actingAs($this->member)->get(route('my-profile'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->has('activity.data', 2)
            ->where('activity.data.0.actor.id', $this->member->id)
            ->where('activity.data.1.actor.id', $this->member->id)
            // An HEI account has no HEI directory to open.
            ->where('activity.data.0.subject.url', null)));
});

test('my own account links to Settings → Profile from my activity', function () {
    app(ActivityRecorder::class)->record(ActivityAction::Updated, ActivityModule::Account, $this->member, actor: $this->member);

    $this->actingAs($this->member)->get(route('my-profile'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('activity.data.0.sentence.before', 'Updated their own account')
            ->where('activity.data.0.subject.url', route('profile.edit'))));
});

test('the old My Profile address still opens it', function () {
    $this->actingAs($this->member)
        ->get('/settings/profile?view=my-profile')
        ->assertRedirect(route('my-profile'));
});

test('guests are sent to log in', function () {
    $this->get(route('my-profile'))->assertRedirect(route('login'));
});
