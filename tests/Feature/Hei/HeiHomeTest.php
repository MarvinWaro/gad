<?php

use App\Models\GadEvent;
use App\Models\Post;
use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyResponse;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
});

function heiHomeMember(?SurveyHei $hei = null): User
{
    $user = User::factory()->create(['survey_hei_id' => ($hei ?? createSurveyHei())->id]);
    $user->assignRole('hei');

    return $user;
}

function heiSurveyResponse(Survey $survey, SurveyHei $hei): SurveyResponse
{
    return SurveyResponse::query()->create([
        'survey_version_id' => $survey->versions()->firstOrFail()->id,
        'public_reference' => Str::random(20),
        'age' => 20,
        'sex' => 'female',
        'respondent_group' => 'student',
        'survey_region_id' => $hei->cluster->survey_region_id,
        'survey_cluster_id' => $hei->survey_cluster_id,
        'survey_hei_id' => $hei->id,
        'answers' => [],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
    ]);
}

test('HEI users get the HEI home with their institution and the law surveys', function () {
    $hei = createSurveyHei(['name' => 'Notre Dame of Marbel University']);

    $this->actingAs(heiHomeMember($hei))
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('hei/home')
            ->where('hei.name', 'Notre Dame of Marbel University')
            ->where('hei.cluster', 'South Cotabato')
            ->has('surveys', 4)
            ->where('surveys.0.code', 'RA 7877')
            ->where('surveys.3.code', 'RA 11313')
            ->where('surveys.0.is_open', false)
            ->has('comingSoon', 4)
            ->has('posts.data', 0));
});

test('staff keep the standard dashboard', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('dashboard'));
});

test('survey response counts only include the viewer\'s institution', function () {
    $mine = createSurveyHei(['name' => 'Mine']);
    $other = createSurveyHei(['name' => 'Other']);
    $ra7877 = Survey::query()->where('slug', 'ra-7877')->sole();
    $ra9262 = Survey::query()->where('slug', 'ra-9262')->sole();

    heiSurveyResponse($ra7877, $mine);
    heiSurveyResponse($ra7877, $mine);
    heiSurveyResponse($ra9262, $mine);
    heiSurveyResponse($ra7877, $other);

    $this->actingAs(heiHomeMember($mine))
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('surveys.0.responses_from_hei', 2)
            ->where('surveys.1.responses_from_hei', 1)
            ->where('surveys.2.responses_from_hei', 0));
});

test('the calendar shows the requested month, including events that started earlier', function () {
    $spanning = GadEvent::query()->create([
        'title' => '18-Day Campaign', 'category' => 'campaign', 'is_all_day' => true,
        'starts_at' => '2026-09-30 00:00:00', 'ends_at' => '2026-10-02 23:59:59',
    ]);
    $inside = GadEvent::query()->create([
        'title' => 'GAD Training', 'category' => 'training', 'is_all_day' => false,
        'starts_at' => '2026-10-15 09:00:00',
    ]);
    GadEvent::query()->create([
        'title' => 'Next month', 'category' => 'meeting', 'is_all_day' => false,
        'starts_at' => '2026-11-01 09:00:00',
    ]);

    $this->actingAs(heiHomeMember())
        ->get(route('dashboard', ['month' => '2026-10']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('calendar.month', '2026-10')
            ->has('calendar.events', 2)
            ->where('calendar.events.0.id', $spanning->id)
            ->where('calendar.events.1.id', $inside->id)
            ->where('calendar.events.1.starts_at', '2026-10-15T09:00:00'));
});

test('an invalid month falls back to the current month', function () {
    CarbonImmutable::setTestNow('2026-09-24 02:00:00');

    $this->actingAs(heiHomeMember())
        ->get(route('dashboard', ['month' => 'not-a-month']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('calendar.month', '2026-09')
            ->where('calendar.today', '2026-09-24'));

    CarbonImmutable::setTestNow();
});

test('upcoming events include ongoing ones and skip finished ones', function () {
    // 04:00 UTC is 12:00 noon in Manila, the calendar's wall clock.
    CarbonImmutable::setTestNow('2026-10-10 04:00:00');

    GadEvent::query()->create([
        'title' => 'Finished', 'category' => 'meeting', 'is_all_day' => false,
        'starts_at' => '2026-10-01 09:00:00', 'ends_at' => '2026-10-01 11:00:00',
    ]);
    $ongoing = GadEvent::query()->create([
        'title' => 'Ongoing', 'category' => 'campaign', 'is_all_day' => true,
        'starts_at' => '2026-10-09 00:00:00', 'ends_at' => '2026-10-11 23:59:59',
    ]);
    $later = GadEvent::query()->create([
        'title' => 'Later', 'category' => 'training', 'is_all_day' => false,
        'starts_at' => '2026-10-20 09:00:00',
    ]);

    $this->actingAs(heiHomeMember())
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('upcoming', 2)
            ->where('upcoming.0.id', $ongoing->id)
            ->where('upcoming.1.id', $later->id));

    CarbonImmutable::setTestNow();
});

test('the events page lists the month and, separately, what comes after it', function () {
    $inside = GadEvent::query()->create([
        'title' => 'October training', 'category' => 'training', 'is_all_day' => false,
        'starts_at' => '2026-10-15 09:00:00',
    ]);
    $after = GadEvent::query()->create([
        'title' => 'November campaign', 'category' => 'campaign', 'is_all_day' => true,
        'starts_at' => '2026-11-25 00:00:00', 'ends_at' => '2026-12-12 23:59:59',
    ]);

    $this->actingAs(heiHomeMember())
        ->get(route('events.index', ['month' => '2026-10']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('hei/events')
            ->has('calendar.events', 1)
            ->where('calendar.events.0.id', $inside->id)
            ->has('after', 1)
            ->where('after.0.id', $after->id));
});

test('institution names are sent in readable casing alongside the official name', function () {
    $this->actingAs(heiHomeMember(createSurveyHei(['name' => 'ACLC COLLEGE OF MARBEL'])))
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('hei.name', 'ACLC COLLEGE OF MARBEL')
            ->where('hei.display_name', 'ACLC College of Marbel'));
});

test('the placeholder cluster is left out of the greeting', function () {
    $hei = createSurveyHei();
    $hei->cluster->update(['name' => SurveyCluster::UNASSIGNED]);

    $this->actingAs(heiHomeMember($hei))
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('hei.cluster', null));
});

test('the feed shows the newest posts first, ten at a time', function () {
    $author = heiHomeMember();

    foreach (range(1, 12) as $index) {
        Post::query()->create(['user_id' => $author->id, 'body' => "Post {$index}"])
            ->forceFill(['created_at' => now()->addMinutes($index)])
            ->save();
    }

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('posts.data', 10)
            ->where('posts.data.0.body', 'Post 12')
            ->where('posts.data.9.body', 'Post 3'));
});
