<?php

use App\Models\GadEventRegistration;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    // 01:00 UTC is 9:00 AM in Manila, on Monday, October 12, 2026.
    CarbonImmutable::setTestNow('2026-10-12 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
    $this->focal = certificateStaff('ched-focal', $this->xii);
    $this->event = certificateEvent('GAD Orientation', $this->xii);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('staff see who joined, newest first, how often each came, and nothing private', function () {
    $ana = certificateGuest($this->xii, ['name' => 'Ana Reyes']);
    joinEvent($this->event, $ana);
    CarbonImmutable::setTestNow('2026-10-12 02:00:00');
    $jose = certificateGuest($this->xii, ['name' => 'Jose Cruz']);
    certificateCheckIn($this->event, $jose, '2026-10-14');
    certificateCheckIn($this->event, $jose, '2026-10-15');

    $this->actingAs($this->focal)->get(route('admin.events.registrations.index', $this->event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/registrations')
            ->where('event.title', 'GAD Orientation')
            ->where('event.joined_count', 2)
            ->where('counts', ['joined' => 2, 'checked_in' => 1, 'guests' => 0])
            ->where('registrations.meta.total', 2)
            ->where('registrations.data.0.person.name', 'Jose Cruz')
            ->where('registrations.data.0.person.affiliation', 'Regional Office XII College')
            ->where('registrations.data.0.person.region', 'Regional Office XII')
            ->where('registrations.data.0.days_attended', 2)
            ->where('registrations.data.0.joined_at', '2026-10-12T02:00:00Z')
            ->where('registrations.data.1.person.name', 'Ana Reyes')
            ->where('registrations.data.1.days_attended', 0)
            ->where('registrations.data.0', fn ($row) => collect($row)->keys()->all() === ['id', 'joined_at', 'person', 'added', 'days_attended', 'days'])
            ->where('registrations.data.0.days', ['2026-10-14', '2026-10-15'])
            ->where('registrations.data.0.added', false)
            ->where('registrations.data.0.person', fn ($person) => collect($person)->keys()->all() === ['name', 'avatar', 'affiliation', 'region'])
            ->where('can.update', true)
            ->where('certificates', []));
});

test('the list is searched by name and filtered by region and HEI', function () {
    joinEvent($this->event, certificateGuest($this->xii, ['name' => 'Ana Reyes']));
    joinEvent($this->event, certificateGuest($this->xii, ['name' => 'Jose Cruz']));
    joinEvent($this->event, certificateGuest($this->ix, ['name' => 'Ana Visitor']));
    $admin = certificateStaff('admin');

    $this->actingAs($admin)->get(route('admin.events.registrations.index', [$this->event, 'search' => 'ana']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('registrations.meta.total', 2)
            ->where('counts.joined', 3)
            ->where('filters', ['search' => 'ana']));
    $this->actingAs($admin)->get(route('admin.events.registrations.index', [$this->event, 'region' => $this->ix->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('registrations.data', fn ($rows) => collect($rows)->pluck('person.name')->all() === ['Ana Visitor'])
            ->has('heis', 1));
});

test('at an event for every region, a regional office sees everyone who joined, from every region', function () {
    $national = certificateEvent('National summit', null);
    joinEvent($national, certificateGuest($this->xii, ['name' => 'Ours']));
    joinEvent($national, certificateGuest($this->ix, ['name' => 'Theirs']));
    $national->guests()->create(['name' => 'Agency Guest', 'organization' => 'PCW']);

    $this->actingAs($this->focal)->get(route('admin.events.registrations.index', $national))
        ->assertInertia(fn (Assert $page) => $page
            ->where('registrations.data', fn ($rows) => collect($rows)->pluck('person.name')->sort()->values()->all() === ['Ours', 'Theirs'])
            ->where('counts', ['joined' => 2, 'checked_in' => 0, 'guests' => 1])
            // Any region can be picked to narrow it, and the list stays the Central Office's to keep.
            ->has('regions', 2)
            ->where('can.update', false));
    $this->actingAs($this->focal)->get(route('admin.events.registrations.index', [$national, 'region' => $this->ix->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('registrations.data', fn ($rows) => collect($rows)->pluck('person.name')->all() === ['Theirs'])
            ->has('heis', 1));
    $this->actingAs(certificateStaff('admin'))->get(route('admin.events.registrations.index', $national))
        ->assertInertia(fn (Assert $page) => $page->where('counts.joined', 2));

    // A region's own event still offers only that region.
    $this->actingAs($this->focal)->get(route('admin.events.registrations.index', $this->event))
        ->assertInertia(fn (Assert $page) => $page->has('regions', 1));
});

test('only the CHED Focal of the event\'s region and Administrators open the list', function () {
    $theirs = certificateEvent('Region IX training', $this->ix);

    // Whoever added the event: what matters is the office.
    $this->actingAs($this->focal)->get(route('admin.events.registrations.index', $this->event))->assertOk();
    $this->actingAs(certificateStaff('ched-focal', $this->xii))->get(route('admin.events.registrations.index', $this->event))->assertOk();
    $this->actingAs(certificateStaff('admin'))->get(route('admin.events.registrations.index', $this->event))->assertOk();
    foreach (['gad-focal-person', 'ched-employee'] as $role) {
        $this->actingAs(certificateStaff($role, $this->xii))->get(route('admin.events.registrations.index', $this->event))->assertForbidden();
    }
    $this->actingAs(certificateGuest($this->xii))->get(route('admin.events.registrations.index', $this->event))->assertForbidden();
    // Another region's event.
    $this->actingAs($this->focal)->get(route('admin.events.registrations.index', $theirs))->assertForbidden();
});

test('the permission migration lets Administrators see who joined', function () {
    $migration = require database_path('migrations/2026_10_22_000004_let_admins_see_who_joined_events.php');
    $migration->down();
    expect(Permission::query()->where('slug', 'events.view-registrations')->exists())->toBeFalse();

    $migration->up();
    expect(Role::query()->whereHas('permissions', fn ($query) => $query->where('slug', 'events.view-registrations'))->pluck('slug')->all())
        ->toBe(['admin']);
});

test('the event permissions migration gives the CHED Focal who joined, and takes adding events from GAD Focal Persons', function () {
    $migration = require database_path('migrations/2026_10_22_000005_adjust_event_permissions.php');
    $holders = fn (string $slug) => Role::query()->whereHas('permissions', fn ($query) => $query->where('slug', $slug))->orderBy('slug')->pluck('slug')->all();

    expect($holders('events.view-registrations'))->toBe(['admin', 'ched-focal'])
        ->and($holders('events.create'))->toBe(['admin', 'ched-focal']);

    $migration->down();
    expect($holders('events.view-registrations'))->toBe(['admin'])
        ->and($holders('events.create'))->toBe(['admin', 'ched-focal', 'gad-focal-person'])
        ->and($holders('events.update'))->toBe(['admin', 'ched-focal', 'gad-focal-person']);

    $migration->up();
    expect($holders('events.view-registrations'))->toBe(['admin', 'ched-focal'])
        ->and($holders('events.update'))->toBe(['admin', 'ched-focal'])
        ->and($holders('events.check-in'))->toContain('gad-focal-person');
});

test('staff of the event\'s office close registration now and reopen it', function () {
    $this->actingAs($this->focal)->put(route('admin.events.registration.update', $this->event), ['open' => false])
        ->assertRedirect()
        ->assertSessionHasNoErrors();
    expect($this->event->fresh()->registration_closes_at?->format('Y-m-d H:i:s'))->toBe('2026-10-12 09:00:00');
    $this->actingAs(certificateGuest($this->xii))->post(route('events.registration.store', $this->event))
        ->assertSessionHasErrors('registration');
    $this->assertDatabaseHas('activity_logs', ['subject_type' => 'event', 'action' => 'updated']);

    $this->actingAs($this->focal)->put(route('admin.events.registration.update', $this->event), ['open' => true])->assertSessionHasNoErrors();
    expect($this->event->fresh()->registration_closes_at)->toBeNull();

    $this->actingAs(certificateStaff('ched-employee', $this->xii))->put(route('admin.events.registration.update', $this->event), ['open' => false])->assertForbidden();
    $this->actingAs(certificateStaff('ched-focal', $this->ix))->put(route('admin.events.registration.update', $this->event), ['open' => false])->assertForbidden();
    $this->actingAs($this->focal)->put(route('admin.events.registration.update', $this->event), [])->assertSessionHasErrors('open');
    expect(GadEventRegistration::query()->exists())->toBeFalse();
});

test('the events table counts who joined, for the region\'s CHED Focal and Administrators only', function () {
    joinEvent($this->event, certificateGuest($this->xii));

    foreach ([$this->focal, certificateStaff('admin')] as $staff) {
        $this->actingAs($staff)->get(route('admin.events.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('events.data.0.joined_count', 1)
                ->where('events.data.0.can.viewRegistrations', true)
                ->where('events.data.0.ulid', $this->event->ulid));
    }
    $this->actingAs(certificateStaff('gad-focal-person', $this->xii))->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('events.data.0.joined_count', null)
            ->where('events.data.0.can.viewRegistrations', false));
});
