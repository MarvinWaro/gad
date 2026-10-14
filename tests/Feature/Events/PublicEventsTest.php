<?php

use App\Models\SurveyRegion;
use App\Support\PublicEvents;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    // 01:00 UTC is 9:00 AM in Manila, on Monday, October 12, 2026.
    CarbonImmutable::setTestNow('2026-10-12 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

/**
 * The titles of a list of events, in order.
 *
 * @param  iterable<array<string, mixed>>  $events
 * @return list<string>
 */
function publicEventTitles(iterable $events): array
{
    return collect($events)->pluck('title')->all();
}

test('the public list shows the events staff left public, those on now first, and never a deadline', function () {
    // October 14 to 15.
    certificateEvent('GAD Orientation', $this->xii);
    certificateEvent('Week-long campaign', $this->xii, '2026-10-09 08:00:00', '2026-10-15 17:00:00');
    certificateEvent('National summit', null, '2026-10-20 08:00:00', '2026-10-20 17:00:00');
    certificateEvent('Region IX training', $this->ix, '2026-10-13 08:00:00', null);
    certificateEvent('Staff meeting', $this->xii, '2026-10-13 13:00:00', null)->update(['is_public' => false]);
    certificateEvent('Report deadline', $this->xii, '2026-10-16 17:00:00', null, 'deadline');
    certificateEvent("Last week's forum", $this->xii, '2026-10-05 08:00:00', '2026-10-06 17:00:00');
    certificateEvent('September forum', $this->ix, '2026-09-21 08:00:00', '2026-09-21 17:00:00');
    // Without an end, it is over with its first day.
    certificateEvent("Yesterday's talk", $this->xii, '2026-10-11 09:00:00', null);

    $this->get(route('public-events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('gad-events/index')
            ->where('events.data', fn ($events) => publicEventTitles($events) === ['Week-long campaign', 'Region IX training', 'GAD Orientation', 'National summit'])
            ->where('events.data.0.status', 'ongoing')
            ->where('events.data.1.status', 'upcoming')
            ->where('filters', ['region' => null, 'when' => 'current'])
            ->where('regions', fn ($regions) => collect($regions)->pluck('name')->all() === ['Regional Office IX', 'Regional Office XII']));

    $this->get(route('public-events.index', ['when' => 'past']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('events.data', fn ($events) => publicEventTitles($events) === ["Yesterday's talk", "Last week's forum", 'September forum'])
            ->where('events.data.0.status', 'ended')
            ->where('filters.when', 'past'));
});

test('a region lists its own events and those for every region; one a visitor cannot pick lists them all', function () {
    certificateEvent('GAD Orientation', $this->xii);
    certificateEvent('National summit', null, '2026-10-20 08:00:00', '2026-10-20 17:00:00');
    certificateEvent('Region IX training', $this->ix, '2026-10-13 08:00:00', null);
    $closed = SurveyRegion::query()->create(['name' => 'Regional Office X', 'is_active' => false]);

    $this->get(route('public-events.index', ['region' => $this->xii->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('events.data', fn ($events) => publicEventTitles($events) === ['GAD Orientation', 'National summit'])
            ->where('events.data.0.region', 'Regional Office XII')
            ->where('events.data.1.region', null)
            ->where('filters.region', $this->xii->id)
            ->has('regions', 2));

    foreach ([$closed->id, 999] as $region) {
        $this->get(route('public-events.index', ['region' => $region]))
            ->assertInertia(fn (Assert $page) => $page->has('events.data', 3)->where('filters.region', null));
    }
});

test('the list holds twelve events a page, and its links keep the filters', function () {
    foreach (range(1, PublicEvents::PER_PAGE + 1) as $day) {
        certificateEvent("Forum {$day}", $this->xii, sprintf('2026-11-%02d 08:00:00', $day), null);
    }

    $this->get(route('public-events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('events.data', 12)
            ->where('events.meta.total', 13)
            ->where('events.meta.last_page', 2));
    $this->get(route('public-events.index', ['region' => $this->xii->id, 'page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('events.data', fn ($events) => publicEventTitles($events) === ['Forum 13'])
            ->where('events.links.prev', fn (string $url) => str_contains($url, 'region='.$this->xii->id)));

    // Past the last page: back to it, with the same filters.
    $this->get(route('public-events.index', ['when' => 'past', 'page' => 9]))
        ->assertRedirect(route('public-events.index', ['when' => 'past']));
});

test('the public site says what an event is, never its number, who added it or who joined', function () {
    $event = certificateEvent('GAD Orientation', $this->xii);
    $event->forceFill([
        'created_by' => certificateStaff('ched-focal', $this->xii)->id,
        'description' => 'Bring your GAD plan.',
        'registration_closes_at' => '2026-10-13 17:00:00',
    ])->save();
    joinEvent($event, certificateGuest($this->xii));
    $shown = [
        'ulid' => $event->ulid,
        'title' => 'GAD Orientation',
        'description' => 'Bring your GAD plan.',
        'location' => 'Koronadal City',
        'category' => 'training',
        'starts_at' => '2026-10-14T08:00:00',
        'ends_at' => '2026-10-15T17:00:00',
        'is_all_day' => false,
        'region' => 'Regional Office XII',
        'status' => 'upcoming',
        'registration_open' => true,
        'registration_closes_at' => '2026-10-13T17:00:00',
    ];

    $this->get(route('public-events.index'))
        ->assertInertia(fn (Assert $page) => $page->where('events.data.0', $shown));
    $this->get(route('public-events.show', $event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('gad-events/show')
            ->where('event', $shown)
            ->where('signedIn', false));
});

test('an event\'s public page is for a public event, at its public address', function () {
    $hidden = certificateEvent('Staff meeting', $this->xii);
    $hidden->update(['is_public' => false]);
    $deadline = certificateEvent('Report deadline', $this->xii, category: 'deadline');
    $event = certificateEvent('GAD Orientation', $this->xii);

    foreach ([$hidden, $deadline] as $unlisted) {
        $this->get(route('public-events.show', $unlisted))->assertNotFound();
    }
    $this->get('/gad-events/'.$event->id)->assertNotFound();
    $this->get('/gad-events/'.strtolower((string) Str::ulid()))->assertNotFound();
    $this->get('/gad-events/'.$event->ulid)->assertOk();
});

test('signed in, people who see an event join it on its own page; anyone else reads the public one', function () {
    $event = certificateEvent('GAD Orientation', $this->xii);
    $hidden = certificateEvent('Staff meeting', $this->xii);
    $hidden->update(['is_public' => false]);

    $ours = certificateGuest($this->xii);
    $this->actingAs($ours)->get(route('public-events.show', $event))->assertRedirect(route('events.show', $event));
    // Off the public site, it is still on its region's calendars.
    $this->actingAs($ours)->get(route('public-events.show', $hidden))->assertRedirect(route('events.show', $hidden));

    $theirs = certificateGuest($this->ix);
    $this->actingAs($theirs)->get(route('public-events.show', $event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('gad-events/show')->where('signedIn', true));
    $this->actingAs($theirs)->get(route('public-events.show', $hidden))->assertNotFound();
});

test('the homepage shows the next three events still on, for the region picked', function () {
    certificateEvent('GAD Orientation', $this->xii);
    certificateEvent('Week-long campaign', $this->xii, '2026-10-09 08:00:00', '2026-10-15 17:00:00');
    certificateEvent('National summit', null, '2026-10-20 08:00:00', '2026-10-20 17:00:00');
    certificateEvent('Region IX training', $this->ix, '2026-10-13 08:00:00', null);
    certificateEvent("Last week's forum", $this->xii, '2026-10-05 08:00:00', '2026-10-06 17:00:00');

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('events.region', null)
            ->has('events.regions', 2)
            ->where('events.events', fn ($events) => publicEventTitles($events) === ['Week-long campaign', 'Region IX training', 'GAD Orientation']));

    $this->get(route('home', ['events_region' => $this->ix->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('events.region', $this->ix->id)
            ->where('events.events', fn ($events) => publicEventTitles($events) === ['Region IX training', 'National summit'])
            // Picking a region reloads the events alone.
            ->reloadOnly('events', fn (Assert $reload) => $reload
                ->where('events.region', $this->ix->id)
                ->missing('statistics')
                ->missing('stories')));

    $this->get(route('home', ['events_region' => 999]))
        ->assertInertia(fn (Assert $page) => $page->where('events.region', null)->has('events.events', 3));
});

test('the public events pages are throttled', function () {
    foreach (range(1, 60) as $visit) {
        $this->get(route('public-events.index'))->assertOk();
    }

    $this->get(route('public-events.index'))->assertTooManyRequests();
});
