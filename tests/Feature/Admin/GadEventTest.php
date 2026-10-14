<?php

use App\Models\GadEvent;
use App\Models\GadEventRegistration;
use App\Models\Role;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

/** Staff in a regional office, or the Central Office with none. */
function eventStaff(string $role, ?SurveyRegion $region = null): User
{
    $user = ($region ? User::factory()->regionalOffice($region) : User::factory()->nationalOffice())->create();
    $user->assignRole($role);

    return $user;
}

function eventPayload(array $overrides = []): array
{
    return [
        'title' => 'Regional GAD Focal Persons Training',
        'category' => 'training',
        'is_all_day' => false,
        'starts_at' => '2026-10-02T09:00',
        'ends_at' => '2026-10-02T16:00',
        'location' => 'CHED RO XII, Koronadal City',
        'description' => 'Orientation on the GAD planning and budgeting cycle.',
        ...$overrides,
    ];
}

function eventRegion(string $name): SurveyRegion
{
    return SurveyRegion::query()->create(['name' => $name, 'is_active' => true]);
}

/** An HEI account at an institution in the region. */
function eventMember(SurveyRegion $region): User
{
    $hei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $region->id, 'name' => "{$region->name} cluster", 'is_active' => true])->id,
        'name' => "{$region->name} College",
        'is_active' => true,
    ]);
    $member = User::factory()->create(['survey_hei_id' => $hei->id]);
    $member->assignRole('hei');

    return $member;
}

function regionEvent(string $title, ?SurveyRegion $region): GadEvent
{
    return GadEvent::query()->create([
        'title' => $title, 'category' => 'training', 'is_all_day' => false,
        'starts_at' => '2026-10-15 09:00:00', 'survey_region_id' => $region?->id,
    ]);
}

test('administrators create, update, and delete events', function () {
    $admin = eventStaff('admin');

    $this->actingAs($admin)
        ->post(route('admin.events.store'), eventPayload())
        ->assertRedirect(route('admin.events.index'))
        ->assertSessionHasNoErrors();

    $event = GadEvent::query()->sole();
    expect($event->starts_at->format('Y-m-d H:i'))->toBe('2026-10-02 09:00')
        ->and($event->created_by)->toBe($admin->id);

    $this->actingAs($admin)
        ->put(route('admin.events.update', $event), eventPayload(['title' => 'Updated']))
        ->assertSessionHasNoErrors();
    expect($event->fresh()->title)->toBe('Updated');

    $this->actingAs($admin)
        ->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->has('events.data', 1)
            ->where('permissions.delete', true));

    $this->actingAs($admin)->delete(route('admin.events.destroy', $event))->assertRedirect();
    expect(GadEvent::query()->exists())->toBeFalse();
});

test('all-day events span whole days', function () {
    $this->actingAs(eventStaff('admin'))->post(route('admin.events.store'), eventPayload([
        'is_all_day' => true,
        'starts_at' => '2026-11-25',
        'ends_at' => '2026-12-12',
    ]));

    $event = GadEvent::query()->sole();
    expect($event->starts_at->format('Y-m-d H:i:s'))->toBe('2026-11-25 00:00:00')
        ->and($event->ends_at?->format('Y-m-d H:i:s'))->toBe('2026-12-12 23:59:59');
});

test('staff set when registration closes, never after the event ends, and never on a deadline', function () {
    $admin = eventStaff('admin');

    $this->actingAs($admin)->post(route('admin.events.store'), eventPayload(['registration_closes_at' => '2026-10-01T17:00']))
        ->assertSessionHasNoErrors();
    $event = GadEvent::query()->sole();
    expect($event->registration_closes_at?->format('Y-m-d H:i:s'))->toBe('2026-10-01 17:00:00')
        ->and($event->ulid)->toBeString()->toHaveLength(26)
        ->and($event->toCalendarArray()['registration_closes_at'])->toBe('2026-10-01T17:00:00');

    // After the event ends: refused. On the last day of an all-day event: fine.
    $this->actingAs($admin)->put(route('admin.events.update', $event), eventPayload(['registration_closes_at' => '2026-10-02T16:30']))
        ->assertSessionHasErrors(['registration_closes_at' => 'Registration must close by the time the event ends.']);
    $this->actingAs($admin)->put(route('admin.events.update', $event), eventPayload([
        'is_all_day' => true, 'starts_at' => '2026-10-02', 'ends_at' => '', 'registration_closes_at' => '2026-10-02T21:00',
    ]))->assertSessionHasNoErrors();
    expect($event->fresh()->registration_closes_at?->format('H:i'))->toBe('21:00');

    // Emptied, it stays open until the event ends; a deadline has none.
    $this->actingAs($admin)->put(route('admin.events.update', $event), eventPayload(['registration_closes_at' => '']));
    expect($event->fresh()->registration_closes_at)->toBeNull();
    $this->actingAs($admin)->put(route('admin.events.update', $event), eventPayload(['category' => 'deadline', 'registration_closes_at' => '2026-10-01T17:00']));
    expect($event->fresh()->registration_closes_at)->toBeNull();
});

test('events show on the public website unless staff turn it off, and keep the choice when it is left out', function () {
    $admin = eventStaff('admin');

    $this->actingAs($admin)->post(route('admin.events.store'), eventPayload())->assertSessionHasNoErrors();
    $event = GadEvent::query()->sole();
    expect($event->is_public)->toBeTrue();

    $this->actingAs($admin)->put(route('admin.events.update', $event), eventPayload(['is_public' => false]))->assertSessionHasNoErrors();
    expect($event->fresh()->is_public)->toBeFalse();

    // Left out, as by an older form or another system: it stays as it was.
    $this->actingAs($admin)->put(route('admin.events.update', $event), eventPayload(['title' => 'Renamed']))->assertSessionHasNoErrors();
    expect($event->fresh())->is_public->toBeFalse()->title->toBe('Renamed');

    $this->actingAs($admin)->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page->where('events.data.0.is_public', false));

    // A new event knows it is public before it is read back.
    expect(regionEvent('National summit', null)->isOnPublicSite())->toBeTrue();
});

test('existing events show on the public website', function () {
    $migration = require database_path('migrations/2026_10_22_000003_add_is_public_to_gad_events_table.php');
    $migration->down();

    DB::table('gad_events')->insert(['title' => 'Old training', 'category' => 'training', 'starts_at' => '2026-10-07 08:00:00', 'is_all_day' => false]);
    $migration->up();

    expect(GadEvent::query()->sole()->is_public)->toBeTrue();
});

test('the events table says what is happening now, and lists by where events stand', function () {
    // 01:00 UTC is 9:00 AM in Manila, on Monday, October 12, 2026.
    CarbonImmutable::setTestNow('2026-10-12 01:00:00');
    $admin = eventStaff('admin');
    $make = fn (string $title, string $startsAt, ?string $endsAt) => GadEvent::query()->create([
        'title' => $title, 'category' => 'training', 'is_all_day' => false, 'starts_at' => $startsAt, 'ends_at' => $endsAt,
    ]);
    $make('Week-long campaign', '2026-10-09 08:00:00', '2026-10-15 17:00:00');
    $make('This morning, no end', '2026-10-12 08:00:00', null);
    $make('This afternoon', '2026-10-12 13:00:00', null);
    $make('Last week', '2026-10-05 08:00:00', '2026-10-06 17:00:00');
    $make('Yesterday, no end', '2026-10-11 09:00:00', null);

    $statuses = fn (array $query = []) => collect($this->actingAs($admin)->get(route('admin.events.index', $query))
        ->viewData('page')['props']['events']['data'])->mapWithKeys(fn (array $event): array => [$event['title'] => $event['status']])->all();

    expect($statuses())->toBe([
        'This afternoon' => 'upcoming',
        'This morning, no end' => 'ongoing',
        'Yesterday, no end' => 'ended',
        'Week-long campaign' => 'ongoing',
        'Last week' => 'ended',
    ]);
    expect(array_keys($statuses(['status' => 'ongoing'])))->toBe(['This morning, no end', 'Week-long campaign'])
        ->and(array_keys($statuses(['status' => 'upcoming'])))->toBe(['This afternoon'])
        ->and(array_keys($statuses(['status' => 'ended'])))->toBe(['Yesterday, no end', 'Last week'])
        ->and($statuses(['status' => 'someday']))->toHaveCount(5);

    $this->actingAs($admin)->get(route('admin.events.index', ['status' => 'ended']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('ongoing', 2)
            ->where('filters', ['search' => '', 'status' => 'ended']));
    $this->actingAs($admin)->get(route('admin.events.index', ['search' => 'week']))
        ->assertInertia(fn (Assert $page) => $page->where('ongoing', 1)->has('events.data', 2));

    CarbonImmutable::setTestNow();
});

test('events are validated', function (array $overrides, string $field) {
    $this->actingAs(eventStaff('admin'))
        ->post(route('admin.events.store'), eventPayload($overrides))
        ->assertSessionHasErrors($field);
})->with([
    'missing title' => [['title' => ''], 'title'],
    'unknown category' => [['category' => 'party'], 'category'],
    'ends before it starts' => [['ends_at' => '2026-10-01T09:00'], 'ends_at'],
    'unknown region' => [['region' => 999], 'region'],
    'public is not a yes or no' => [['is_public' => 'maybe'], 'is_public'],
]);

test('GAD focal persons no longer add or edit events, but still check people in', function () {
    $focal = eventStaff('gad-focal-person');
    $event = regionEvent('National summit', null);

    $this->actingAs($focal)->post(route('admin.events.store'), eventPayload())->assertForbidden();
    $this->actingAs($focal)->put(route('admin.events.update', $event), eventPayload(['title' => 'Moved']))->assertForbidden();
    $this->actingAs($focal)->delete(route('admin.events.destroy', $event))->assertForbidden();
    $this->actingAs($focal)->get(route('admin.events.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('permissions', ['create' => false, 'update' => false, 'delete' => false]));

    expect($focal->can('events.check-in'))->toBeTrue()
        ->and($event->fresh()->title)->toBe('National summit');
});

test('HEI users view events but cannot manage them', function () {
    $hei = User::factory()->create();
    $hei->assignRole('hei');

    $this->actingAs($hei)->get(route('admin.events.index'))->assertForbidden();
    $this->actingAs($hei)->post(route('admin.events.store'), eventPayload())->assertForbidden();
    $this->actingAs($hei)->get(route('events.index'))->assertOk();
});

test('a regional office\'s event is for its own region; the Central Office picks one or every region', function () {
    $xii = eventRegion('Regional Office XII');
    $ix = eventRegion('Regional Office IX');

    $this->actingAs(eventStaff('ched-focal', $xii))
        ->post(route('admin.events.store'), eventPayload(['title' => 'Regional', 'region' => $ix->id]))
        ->assertSessionHasNoErrors();
    expect(GadEvent::query()->where('title', 'Regional')->sole()->survey_region_id)->toBe($xii->id);

    $admin = eventStaff('admin');
    $this->actingAs($admin)->post(route('admin.events.store'), eventPayload(['title' => 'For IX', 'region' => $ix->id]));
    $this->actingAs($admin)->post(route('admin.events.store'), eventPayload(['title' => 'National']));

    expect(GadEvent::query()->where('title', 'For IX')->sole()->survey_region_id)->toBe($ix->id)
        ->and(GadEvent::query()->where('title', 'National')->sole()->survey_region_id)->toBeNull();
});

test('HEI users see their own region\'s events and those for every region, never another region\'s', function () {
    CarbonImmutable::setTestNow('2026-10-01 04:00:00');
    $xii = eventRegion('Regional Office XII');
    $ix = eventRegion('Regional Office IX');
    $regional = regionEvent('Region XII training', $xii);
    $national = regionEvent('National campaign', null);
    $ixMember = eventMember($ix);
    $xiiMember = eventMember($xii);

    foreach (['calendar.events', 'upcoming'] as $prop) {
        $this->actingAs($ixMember)->get(route('dashboard', ['month' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page->where($prop, fn ($events) => collect($events)->pluck('id')->all() === [$national->id]));
        $this->actingAs($xiiMember)->get(route('dashboard', ['month' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page->where($prop, fn ($events) => collect($events)->pluck('id')->sort()->values()->all() === [$regional->id, $national->id]));
    }

    $this->actingAs($ixMember)->get(route('events.index', ['month' => '2026-10']))
        ->assertInertia(fn (Assert $page) => $page->where('calendar.events', fn ($events) => collect($events)->pluck('id')->all() === [$national->id]));

    CarbonImmutable::setTestNow();
});

test('regional staff list their region\'s events and every region\'s, and change only their own', function () {
    $xii = eventRegion('Regional Office XII');
    $ix = eventRegion('Regional Office IX');
    $ours = regionEvent('Ours', $xii);
    $national = regionEvent('National', null);
    $theirs = regionEvent('Theirs', $ix);
    $focal = eventStaff('admin', $xii);

    $this->actingAs($focal)->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('events.data', 2)
            ->where('events.data', fn ($events) => collect($events)->mapWithKeys(fn (array $event): array => [
                $event['title'] => [$event['region']['name'] ?? 'All regions', $event['can']['update'], $event['can']['delete']],
            ])->sortKeys()->all() === [
                'National' => ['All regions', false, false],
                'Ours' => ['Regional Office XII', true, true],
            ])
            ->where('nationalAccess', false)
            ->has('regions', 1));

    foreach ([$national, $theirs] as $event) {
        $this->actingAs($focal)->put(route('admin.events.update', $event), eventPayload(['title' => 'Taken']))->assertForbidden();
        $this->actingAs($focal)->delete(route('admin.events.destroy', $event))->assertForbidden();
    }
    $this->actingAs($focal)->put(route('admin.events.update', $ours), eventPayload(['title' => 'Ours, moved']))->assertSessionHasNoErrors();

    expect($national->fresh()->title)->toBe('National')
        ->and($theirs->fresh()->title)->toBe('Theirs')
        ->and($ours->fresh()->title)->toBe('Ours, moved');

    $this->actingAs(eventStaff('admin'))->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page->has('events.data', 3)->where('nationalAccess', true));
});

test('staff without an office cannot add events', function () {
    $officeless = User::factory()->create();
    $officeless->assignRole('ched-focal');

    $this->actingAs($officeless)->post(route('admin.events.store'), eventPayload())->assertForbidden();

    expect(GadEvent::query()->exists())->toBeFalse();
});

test('existing events take their author\'s regional office; the Central Office\'s stay for every region', function () {
    $xii = eventRegion('Regional Office XII');
    $regionalAuthor = eventStaff('gad-focal-person', $xii);
    $centralAuthor = eventStaff('admin');
    $migration = require database_path('migrations/2026_10_15_000000_add_region_to_gad_events_table.php');
    $migration->down();

    DB::table('gad_events')->insert([
        ['title' => 'Regional', 'category' => 'training', 'starts_at' => '2026-10-15 09:00:00', 'is_all_day' => false, 'created_by' => $regionalAuthor->id],
        ['title' => 'Central', 'category' => 'training', 'starts_at' => '2026-10-15 09:00:00', 'is_all_day' => false, 'created_by' => $centralAuthor->id],
    ]);
    $migration->up();

    expect(GadEvent::query()->where('title', 'Regional')->sole()->survey_region_id)->toBe($xii->id)
        ->and(GadEvent::query()->where('title', 'Central')->sole()->survey_region_id)->toBeNull();
});

test('existing events get their page address, and people checked in before Join count as having joined', function () {
    $xii = eventRegion('Regional Office XII');
    $guest = eventMember($xii);
    $other = eventMember(eventRegion('Regional Office IX'));
    $registrations = require database_path('migrations/2026_10_22_000001_create_gad_event_registrations_table.php');
    $addresses = require database_path('migrations/2026_10_22_000000_add_registration_to_gad_events_table.php');
    $registrations->down();
    $addresses->down();

    DB::table('gad_events')->insert(['title' => 'Old training', 'category' => 'training', 'starts_at' => '2026-10-07 08:00:00', 'ends_at' => '2026-10-08 17:00:00', 'is_all_day' => false]);
    $event = DB::table('gad_events')->value('id');
    foreach ([[$guest, '2026-10-07', '2026-10-07 01:05:00'], [$guest, '2026-10-08', '2026-10-08 00:30:00'], [$other, '2026-10-08', '2026-10-08 02:00:00']] as [$person, $day, $at]) {
        DB::table('gad_event_check_ins')->insert([
            'id' => strtolower((string) Str::ulid()), 'gad_event_id' => $event, 'user_id' => $person->id, 'attended_on' => $day,
            'checked_in_at' => $at, 'method' => 'scan', 'survey_region_id' => $person->regionId(), 'survey_hei_id' => $person->survey_hei_id,
        ]);
    }
    $addresses->up();
    $registrations->up();

    expect(GadEvent::query()->sole()->ulid)->toHaveLength(26);
    $joined = GadEventRegistration::query()->orderBy('joined_at')->get();
    expect($joined->pluck('user_id')->all())->toBe([$guest->id, $other->id])
        ->and($joined->firstWhere('user_id', $guest->id)?->joined_at->format('Y-m-d H:i:s'))->toBe('2026-10-07 01:05:00')
        ->and($joined->firstWhere('user_id', $guest->id)?->survey_hei_id)->toBe($guest->survey_hei_id)
        ->and($joined->firstWhere('user_id', $other->id)?->survey_region_id)->toBe($other->regionId());
});

test('the CHED Focal runs its region\'s events by default, without deleting them', function () {
    $focal = eventStaff('ched-focal', eventRegion('Regional Office XII'));
    expect($focal->can('events.view'))->toBeTrue()
        ->and($focal->can('events.create'))->toBeTrue()
        ->and($focal->can('events.update'))->toBeTrue()
        ->and($focal->can('events.delete'))->toBeFalse();

    $migration = require database_path('migrations/2026_10_22_000002_let_ched_focal_manage_events.php');
    $migration->down();
    expect(Role::query()->where('slug', 'ched-focal')->sole()->permissions()->pluck('slug')->intersect(['events.view', 'events.create', 'events.update'])->all())->toBe([])
        ->and(Role::query()->where('slug', 'ched-focal')->sole()->permissions()->where('slug', 'events.check-in')->exists())->toBeTrue();

    $migration->up();
    expect(Role::query()->where('slug', 'ched-focal')->sole()->permissions()->whereIn('slug', ['events.view', 'events.create', 'events.update'])->count())->toBe(3);
});
