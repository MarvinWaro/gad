<?php

use App\Models\Post;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Profile HEI']);
    $this->ana = User::factory()->create(['name' => 'Ana Dela Cruz', 'survey_hei_id' => $this->hei->id]);
    $this->ana->assignRole('hei-focal');
    $this->reader = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $this->reader->assignRole('hei');
});

test('a member opens someone else\'s profile: their posts and badges, never their email, roles or activity', function () {
    Post::query()->create(['user_id' => $this->ana->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Ana\'s seminar']);
    Post::query()->create(['user_id' => $this->reader->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Someone else']);

    $this->actingAs($this->reader)->get(route('people.show', $this->ana))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profile/show')
            ->where('own', false)
            ->where('person.name', 'Ana Dela Cruz')
            ->where('person.affiliation', 'Fictional Profile HEI')
            ->where('person.can_follow', true)
            ->where('person.deactivated', false)
            ->missing('person.email')
            ->missing('person.roles')
            ->missing('activity')
            ->where('achievements', [])
            ->where('toEarn', [])
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('posts.data', 1)
                ->where('posts.data.0.body', 'Ana\'s seminar')));
});

test('your own address leads to My Profile, keeping the tab asked for', function () {
    $this->actingAs($this->ana)->get(route('people.show', ['person' => $this->ana, 'tab' => 'badges']))
        ->assertRedirect(route('my-profile', ['tab' => 'badges']));
});

test('an account waiting for approval has no profile; a deactivated one shows it cannot be followed', function () {
    $pending = User::factory()->pending()->create();
    $gone = User::factory()->inactive()->create();

    $this->actingAs($this->reader)->get(route('people.show', $pending))->assertNotFound();
    $this->getJson(route('people.followers', $pending))->assertNotFound();
    $this->get(route('people.show', $gone))
        ->assertInertia(fn (Assert $page) => $page
            ->where('person.deactivated', true)
            ->where('person.can_follow', false));
});

test('CHED staff are placed by their office', function () {
    $staff = User::factory()->regionalOffice($this->hei->cluster->region)->create(['name' => 'Regional Staff']);
    $central = User::factory()->nationalOffice()->create();

    $this->actingAs($this->reader)->get(route('people.show', $staff))
        ->assertInertia(fn (Assert $page) => $page->where('person.affiliation', 'CHED Regional Office XII'));
    $this->get(route('people.show', $central))
        ->assertInertia(fn (Assert $page) => $page->where('person.affiliation', 'CHED Central Office'));
});

test('guests are sent to log in', function () {
    $this->get(route('people.show', $this->ana))->assertRedirect(route('login'));
    $this->postJson(route('people.follow', $this->ana))->assertUnauthorized();
});
