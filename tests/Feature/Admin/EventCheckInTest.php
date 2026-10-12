<?php

use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    // 01:00 UTC is 9:00 AM in Manila, on Thursday, October 15, 2026.
    CarbonImmutable::setTestNow('2026-10-15 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

/** Staff in a regional office, or the Central Office with none. */
function checkInStaff(string $role, ?SurveyRegion $region = null): User
{
    $staff = ($region ? User::factory()->regionalOffice($region) : User::factory()->nationalOffice())->create();
    $staff->assignRole($role);

    return $staff;
}

/**
 * Someone at an HEI in the region, as their Virtual ID names them.
 *
 * @param  array<string, mixed>  $attributes
 */
function checkInGuest(SurveyRegion $region, array $attributes = [], string $role = 'hei'): User
{
    $cluster = SurveyCluster::query()->firstOrCreate(
        ['survey_region_id' => $region->id, 'name' => "{$region->name} cluster"],
        ['is_active' => true],
    );
    $hei = SurveyHei::query()->firstOrCreate(
        ['name' => "{$region->name} College"],
        ['survey_cluster_id' => $cluster->id, 'is_active' => true],
    );
    $guest = User::factory()->create(['survey_hei_id' => $hei->id, ...$attributes]);
    $guest->assignRole($role);

    return $guest;
}

/** An event, in Philippine wall-clock time like every event. */
function checkInEvent(string $title, ?SurveyRegion $region, string $startsAt = '2026-10-15 08:00:00', ?string $endsAt = '2026-10-15 17:00:00', string $category = 'training'): GadEvent
{
    return GadEvent::query()->create([
        'title' => $title,
        'category' => $category,
        'is_all_day' => false,
        'starts_at' => $startsAt,
        'ends_at' => $endsAt,
        'survey_region_id' => $region?->id,
    ]);
}

/** @return array{code: string, method: string} */
function checkInPayload(User $guest, string $method = 'scan'): array
{
    return ['code' => $guest->participant_code, 'method' => $method];
}

test('the scanner lists only today\'s events the staff member can check people in to', function () {
    $staff = checkInStaff('ched-employee', $this->xii);
    $ours = checkInEvent('Region XII training', $this->xii);
    checkInEvent('National summit', null, '2026-10-15 13:00:00', null);
    checkInEvent('Three-day writeshop', $this->xii, '2026-10-14 08:00:00', '2026-10-16 17:00:00');
    $theirs = checkInEvent('Region IX training', $this->ix);
    checkInEvent('Yesterday\'s training', $this->xii, '2026-10-14 08:00:00', '2026-10-14 17:00:00');
    checkInEvent('Tomorrow\'s training', $this->xii, '2026-10-16 08:00:00', '2026-10-16 17:00:00');
    checkInEvent('Report deadline', $this->xii, '2026-10-15 00:00:00', '2026-10-15 23:59:59', 'deadline');

    $this->actingAs($staff)->get(route('admin.scanner'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/scanner')
            ->where('events', fn ($events) => collect($events)->pluck('title')->all() === ['Three-day writeshop', 'Region XII training', 'National summit'])
            ->where('events.0.region', 'Regional Office XII')
            ->where('events.2.region', null)
            ->where('events.2.starts_at', '2026-10-15T13:00:00')
            ->where('event', null)
            ->where('checkedIn', 0));

    $this->actingAs($staff)->get(route('admin.scanner', ['event' => $ours->id]))
        ->assertInertia(fn (Assert $page) => $page->where('event', $ours->id));
    // Another region's event in the address picks nothing.
    $this->actingAs($staff)->get(route('admin.scanner', ['event' => $theirs->id]))
        ->assertInertia(fn (Assert $page) => $page->where('event', null));
});

test('with only one event today, it is picked already, with its count', function () {
    $staff = checkInStaff('ched-focal', $this->ix);
    $event = checkInEvent('Region IX training', $this->ix);
    GadEventCheckIn::query()->create([
        'gad_event_id' => $event->id, 'user_id' => checkInGuest($this->ix)->id,
        'attended_on' => '2026-10-15', 'checked_in_by' => $staff->id, 'method' => 'scan',
    ]);

    $this->actingAs($staff)->get(route('admin.scanner'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('events', 1)
            ->where('event', $event->id)
            ->where('checkedIn', 1));
});

test('scanning a Virtual ID checks the person in, once a day', function () {
    $staff = checkInStaff('ched-focal', $this->xii);
    $event = checkInEvent('Three-day writeshop', $this->xii, '2026-10-15 08:00:00', '2026-10-17 17:00:00');
    $guest = checkInGuest($this->xii, ['name' => 'Ana Dela Cruz'], 'hei-focal');

    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), checkInPayload($guest))
        ->assertCreated()
        ->assertJsonPath('status', 'checked_in')
        ->assertJsonPath('count', 1)
        ->assertJsonPath('check_in.person.name', 'Ana Dela Cruz')
        ->assertJsonPath('check_in.person.affiliation', 'Regional Office XII College')
        ->assertJsonPath('check_in.person.region', 'Regional Office XII')
        ->assertJsonPath('check_in.person.roles', ['HEI Focal'])
        ->assertJsonPath('check_in.person.avatar', null)
        ->assertJsonPath('check_in.method', 'scan')
        ->assertJsonPath('check_in.checked_in_by', $staff->name)
        ->assertJsonPath('check_in.checked_in_at', '2026-10-15T01:00:00Z');

    expect(GadEventCheckIn::query()->sole())
        ->attended_on->toBe('2026-10-15')
        ->user_id->toBe($guest->id)
        ->checked_in_by->toBe($staff->id)
        ->survey_region_id->toBe($this->xii->id)
        ->survey_hei_id->toBe($guest->survey_hei_id);

    // Later the same day the first check-in stands, however it is sent.
    CarbonImmutable::setTestNow('2026-10-15 06:30:00');
    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), checkInPayload($guest, 'typed'))
        ->assertOk()
        ->assertJsonPath('status', 'already_checked_in')
        ->assertJsonPath('check_in.checked_in_at', '2026-10-15T01:00:00Z')
        ->assertJsonPath('check_in.method', 'scan')
        ->assertJsonPath('check_in.checked_in_by', $staff->name)
        ->assertJsonPath('count', 1);
    expect(GadEventCheckIn::query()->count())->toBe(1);

    // 23:30 UTC is 7:30 AM on the 16th in Manila: the writeshop's second day.
    CarbonImmutable::setTestNow('2026-10-15 23:30:00');
    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), checkInPayload($guest))
        ->assertCreated()
        ->assertJsonPath('count', 1);
    expect(GadEventCheckIn::query()->orderBy('attended_on')->pluck('attended_on')->all())->toBe(['2026-10-15', '2026-10-16']);
});

test('a typed code is forgiving about case, spaces, dashes and look-alike letters', function () {
    $staff = checkInStaff('ched-employee', $this->xii);
    $event = checkInEvent('Region XII training', $this->xii);
    $guest = checkInGuest($this->xii);
    $guest->forceFill(['participant_code' => 'GAD-10K2-M0XA'])->save();

    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), ['code' => 'gad 1ok2 moxa', 'method' => 'typed'])
        ->assertCreated()
        ->assertJsonPath('check_in.method', 'typed');
    foreach (['GAD-10K2-M0XA', ' 10K2-M0XA ', 'gadlok2m0xa', 'GAD-IOK2-MOXA'] as $typed) {
        $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), ['code' => $typed, 'method' => 'typed'])
            ->assertOk()
            ->assertJsonPath('status', 'already_checked_in');
    }

    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), ['code' => 'hello', 'method' => 'typed'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['code' => "That isn't a Participant ID. They look like GAD-7K2M-Q9XA."]);
    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), ['code' => 'GAD-10K2-M0XA', 'method' => 'photo'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('method');
});

test('unknown, pending and deactivated accounts are turned away with a reason', function () {
    $staff = checkInStaff('ched-employee', $this->xii);
    $event = checkInEvent('Region XII training', $this->xii);
    $pending = checkInGuest($this->xii, ['status' => 'pending']);
    $inactive = checkInGuest($this->xii, ['status' => 'inactive']);

    foreach ([
        'GAD-ZZZZ-ZZZZ' => 'No account has this Participant ID. Check the code and try again.',
        $pending->participant_code => "This account is still waiting for approval, so it can't be checked in yet.",
        $inactive->participant_code => "This account has been deactivated, so it can't be checked in.",
    ] as $code => $reason) {
        $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), ['code' => $code, 'method' => 'typed'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['code' => $reason]);
    }

    expect(GadEventCheckIn::query()->exists())->toBeFalse();
});

test('check-in runs only on the event\'s own days, and never at a deadline', function () {
    $staff = checkInStaff('ched-employee', $this->xii);
    $guest = checkInGuest($this->xii);

    foreach ([
        checkInEvent('Yesterday\'s training', $this->xii, '2026-10-14 08:00:00', '2026-10-14 17:00:00'),
        checkInEvent('Tomorrow\'s training', $this->xii, '2026-10-16 08:00:00', null),
    ] as $closed) {
        $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $closed), checkInPayload($guest))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['event' => 'Check-in for this event is open only on its own days.']);
    }

    $deadline = checkInEvent('Report deadline', $this->xii, '2026-10-15 00:00:00', '2026-10-15 23:59:59', 'deadline');
    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $deadline), checkInPayload($guest))->assertForbidden();

    // An event with no end time stays open for the rest of its day.
    CarbonImmutable::setTestNow('2026-10-15 15:30:00');
    $evening = checkInEvent('Evening forum', $this->xii, '2026-10-15 18:00:00', null);
    $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $evening), checkInPayload($guest))->assertCreated();

    expect(GadEventCheckIn::query()->count())->toBe(1);
});

test('regional staff check people in at their region\'s events and every region\'s; the Central Office at any', function () {
    $regional = checkInStaff('ched-employee', $this->xii);
    $national = checkInStaff('admin');
    $theirs = checkInEvent('Region IX training', $this->ix);
    $everyone = checkInEvent('National summit', null);
    // People come from anywhere: a Region IX guest at a national event.
    $guest = checkInGuest($this->ix);

    $this->actingAs($regional)->postJson(route('admin.events.check-ins.store', $theirs), checkInPayload($guest))->assertForbidden();
    $this->actingAs($regional)->getJson(route('admin.events.check-ins.index', $theirs))->assertForbidden();
    $this->actingAs($regional)->postJson(route('admin.events.check-ins.store', $everyone), checkInPayload($guest))->assertCreated();
    $this->actingAs($national)->postJson(route('admin.events.check-ins.store', $theirs), checkInPayload($guest))->assertCreated();

    expect(GadEventCheckIn::query()->where('survey_region_id', $this->ix->id)->count())->toBe(2);
});

test('only staff who check people in may open the scanner', function () {
    $event = checkInEvent('Region XII training', $this->xii);

    foreach (['hei', 'hei-focal'] as $role) {
        $member = checkInGuest($this->xii, [], $role);

        $this->actingAs($member)->get(route('admin.scanner'))->assertForbidden();
        $this->actingAs($member)->getJson(route('admin.events.check-ins.index', $event))->assertForbidden();
        $this->actingAs($member)->postJson(route('admin.events.check-ins.store', $event), checkInPayload($member))->assertForbidden();
    }

    foreach ([
        checkInStaff('ched-focal', $this->xii),
        checkInStaff('ched-employee', $this->xii),
        checkInStaff('gad-focal-person', $this->xii),
        checkInStaff('admin'),
    ] as $staff) {
        $this->actingAs($staff)->get(route('admin.scanner'))->assertOk();
        $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), checkInPayload(checkInGuest($this->xii)))->assertCreated();
    }
    expect(GadEventCheckIn::query()->count())->toBe(4);
});

test('the Recent list holds today\'s check-ins at that event, newest first, a page at a time, and nothing private', function () {
    $staff = checkInStaff('ched-focal', $this->xii);
    $event = checkInEvent('Three-day writeshop', $this->xii, '2026-10-14 08:00:00', '2026-10-16 17:00:00');
    $other = checkInEvent('Region XII meeting', $this->xii);
    $yesterday = checkInGuest($this->xii, ['name' => 'Came Yesterday']);
    GadEventCheckIn::query()->create([
        'gad_event_id' => $event->id, 'user_id' => $yesterday->id,
        'attended_on' => '2026-10-14', 'checked_in_by' => $staff->id, 'method' => 'scan',
    ]);
    GadEventCheckIn::query()->create([
        'gad_event_id' => $other->id, 'user_id' => $yesterday->id,
        'attended_on' => '2026-10-15', 'checked_in_by' => $staff->id, 'method' => 'scan',
    ]);
    foreach (range(1, 21) as $minute) {
        CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-10-15 01:00:00')->addMinutes($minute));
        $this->actingAs($staff)->postJson(route('admin.events.check-ins.store', $event), checkInPayload(checkInGuest($this->xii, ['name' => "Guest {$minute}"])))->assertCreated();
    }

    $first = $this->actingAs($staff)->getJson(route('admin.events.check-ins.index', $event))
        ->assertOk()
        ->assertJsonCount(20, 'data')
        ->assertJsonPath('count', 21)
        ->assertJsonPath('data.0.person.name', 'Guest 21')
        ->assertJsonPath('data.19.person.name', 'Guest 2')
        ->assertJsonPath('data.0.checked_in_at', '2026-10-15T01:21:00Z')
        ->assertJsonMissingPath('data.0.person.email')
        ->assertJsonMissingPath('data.0.person.participant_code')
        ->assertJsonMissingPath('data.0.person.mobile_number')
        ->assertJsonMissingPath('data.0.user_id');
    expect(array_keys($first->json('data.0')))->toBe(['id', 'checked_in_at', 'method', 'person', 'checked_in_by'])
        ->and(array_keys($first->json('data.0.person')))->toBe(['name', 'avatar', 'affiliation', 'region', 'roles']);

    $this->actingAs($staff)->getJson(route('admin.events.check-ins.index', [$event, 'cursor' => $first->json('meta.next_cursor')]))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.person.name', 'Guest 1')
        ->assertJsonPath('meta.next_cursor', null);
});

test('the migration lets the four staff roles check people in', function () {
    $permission = Permission::query()->where('slug', 'events.check-in')->sole();
    DB::table('permission_role')->where('permission_id', $permission->id)->delete();
    $migration = require database_path('migrations/2026_10_20_000001_let_staff_check_people_in_to_events.php');

    $migration->up();

    expect(Role::query()->whereHas('permissions', fn ($query) => $query->where('slug', 'events.check-in'))->orderBy('slug')->pluck('slug')->all())
        ->toBe(['admin', 'ched-employee', 'ched-focal', 'gad-focal-person']);

    $migration->down();
    expect(Permission::query()->where('slug', 'events.check-in')->exists())->toBeFalse();
});
