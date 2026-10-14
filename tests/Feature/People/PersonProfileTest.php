<?php

use App\Models\Post;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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

test('a profile is addressed by its ULID, never its number', function () {
    expect($this->ana->ulid)->toMatch('/^[0-9a-hjkmnp-tv-z]{26}$/')
        ->and(route('people.show', $this->ana))->toEndWith('/people/'.$this->ana->ulid);

    $this->actingAs($this->reader)->get('/people/'.$this->ana->ulid)->assertOk();
    // Counting through numbers opens nothing, and neither does an unknown ULID.
    $this->actingAs($this->reader)->get('/people/'.$this->ana->id)->assertNotFound();
    $this->actingAs($this->reader)->get('/people/'.strtolower((string) Str::ulid()))->assertNotFound();
    $this->actingAs($this->reader)->post('/people/'.$this->ana->id.'/follow')->assertNotFound();
});

test('the links people are shown with carry their ULID', function () {
    $this->actingAs($this->reader)->get(route('people.show', $this->ana))
        ->assertInertia(fn (Assert $page) => $page
            ->where('person.ulid', $this->ana->ulid)
            ->where('auth.user.ulid', $this->reader->ulid));

    $this->actingAs($this->reader)->getJson(route('search.people', ['q' => 'Ana']))
        ->assertOk()
        ->assertJsonPath('data.0.ulid', $this->ana->ulid);
});

test('the migration gives every existing account its own ULID, leaving ids and links alone', function () {
    Post::query()->create(['user_id' => $this->ana->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Kept']);
    $ids = User::query()->orderBy('id')->pluck('id')->all();
    $migration = require database_path('migrations/2026_10_18_000000_add_ulid_to_users_table.php');

    $migration->down();
    $migration->up();

    $ulids = DB::table('users')->orderBy('id')->pluck('ulid', 'id');
    expect($ulids->keys()->all())->toBe($ids)
        ->and($ulids->unique()->count())->toBe(count($ids))
        ->and($ulids->every(fn (string $ulid): bool => (bool) preg_match('/^[0-9a-hjkmnp-tv-z]{26}$/', $ulid)))->toBeTrue()
        ->and(Post::query()->where('user_id', $this->ana->id)->exists())->toBeTrue();
});
