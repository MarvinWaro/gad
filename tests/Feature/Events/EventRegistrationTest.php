<?php

use App\Actions\Certificates\ManageEventCertificate;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\GadEventRegistration;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    // 01:00 UTC is 9:00 AM in Manila, on Monday, October 12, 2026.
    CarbonImmutable::setTestNow('2026-10-12 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
    $this->guest = certificateGuest($this->xii, ['name' => 'Ana Reyes']);
    // October 14, 8:00 AM, to October 15, 5:00 PM.
    $this->event = certificateEvent('GAD Orientation', $this->xii);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('people join an event they see, once, under the place they belong to', function () {
    $this->actingAs($this->guest)->post(route('events.registration.store', $this->event))
        ->assertRedirect()
        ->assertSessionHasNoErrors();
    $this->actingAs($this->guest)->post(route('events.registration.store', $this->event))->assertSessionHasNoErrors();

    expect(GadEventRegistration::query()->sole())
        ->gad_event_id->toBe($this->event->id)
        ->user_id->toBe($this->guest->id)
        ->survey_region_id->toBe($this->xii->id)
        ->survey_hei_id->toBe($this->guest->survey_hei_id)
        ->joined_at->toIso8601ZuluString()->toBe('2026-10-12T01:00:00Z');

    $this->actingAs($this->guest)->get(route('events.show', $this->event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('hei/event')
            ->where('event.ulid', $this->event->ulid)
            ->where('event.title', 'GAD Orientation')
            ->where('event.region', ['id' => $this->xii->id, 'name' => 'Regional Office XII'])
            ->where('event.registration_open', true)
            ->where('event.registration_closes_at', null)
            // How many joined is never shown to HEI accounts.
            ->missing('event.joined_count')
            ->where('registration.joined_at', '2026-10-12T01:00:00Z')
            ->where('attended', [])
            ->where('certificates', [])
            ->where('can', ['join' => true, 'viewRegistrations' => false, 'update' => false]));
});

test('an event\'s page has its public address, never its number', function () {
    $this->actingAs($this->guest)->get('/events/'.$this->event->id)->assertNotFound();
    $this->actingAs($this->guest)->get('/events/'.$this->event->ulid)->assertOk();
});

test('nobody joins a deadline or another region\'s event', function () {
    $deadline = certificateEvent('Report deadline', $this->xii, category: 'deadline');
    $theirs = certificateEvent('Region IX training', $this->ix);

    $this->actingAs($this->guest)->get(route('events.show', $deadline))
        ->assertInertia(fn (Assert $page) => $page->where('can.join', false));
    $this->actingAs($this->guest)->post(route('events.registration.store', $deadline))->assertForbidden();
    $this->actingAs($this->guest)->get(route('events.show', $theirs))->assertForbidden();
    $this->actingAs($this->guest)->post(route('events.registration.store', $theirs))->assertForbidden();

    // An event for every region is anyone's.
    $everyone = certificateEvent('National summit', null);
    $this->actingAs(certificateGuest($this->ix))->post(route('events.registration.store', $everyone))->assertSessionHasNoErrors();

    expect(GadEventRegistration::query()->pluck('gad_event_id')->all())->toBe([$everyone->id]);
});

test('registration closes when staff say, or when the event ends', function () {
    $this->event->forceFill(['registration_closes_at' => '2026-10-11 17:00:00'])->save();
    $this->actingAs($this->guest)->post(route('events.registration.store', $this->event))
        ->assertSessionHasErrors(['registration' => 'Registration for GAD Orientation closed on October 11, 2026, 5:00 PM.']);
    $this->actingAs($this->guest)->get(route('events.show', $this->event))
        ->assertInertia(fn (Assert $page) => $page
            ->where('event.registration_open', false)
            ->where('event.registration_closes_at', '2026-10-11T17:00:00'));

    // Without a closing time it stays open into the event's last day.
    $this->event->forceFill(['registration_closes_at' => null])->save();
    CarbonImmutable::setTestNow('2026-10-15 08:00:00');
    $this->actingAs($this->guest)->post(route('events.registration.store', $this->event))->assertSessionHasNoErrors();

    CarbonImmutable::setTestNow('2026-10-15 09:00:00');
    $this->actingAs(certificateGuest($this->xii))->post(route('events.registration.store', $this->event))
        ->assertSessionHasErrors(['registration' => 'GAD Orientation has ended.']);

    expect(GadEventRegistration::query()->count())->toBe(1);
});

test('people leave while registration is open, but not once checked in', function () {
    joinEvent($this->event, $this->guest);
    $this->actingAs($this->guest)->delete(route('events.registration.destroy', $this->event))
        ->assertRedirect()
        ->assertSessionHasNoErrors();
    expect(GadEventRegistration::query()->exists())->toBeFalse();

    joinEvent($this->event, $this->guest);
    $this->event->forceFill(['registration_closes_at' => '2026-10-12 08:00:00'])->save();
    $this->actingAs($this->guest)->delete(route('events.registration.destroy', $this->event))
        ->assertSessionHasErrors(['registration' => 'Registration for GAD Orientation has closed, so the list is final.']);

    CarbonImmutable::setTestNow('2026-10-14 01:00:00');
    $this->event->forceFill(['registration_closes_at' => null])->save();
    certificateCheckIn($this->event, $this->guest, '2026-10-14');
    $this->actingAs($this->guest)->delete(route('events.registration.destroy', $this->event))
        ->assertSessionHasErrors(['registration' => 'You were checked in to GAD Orientation, so you stay on its list.']);

    expect(GadEventRegistration::query()->count())->toBe(1);
});

test('once you attended, the page lists the days and your released certificates from it', function () {
    Storage::fake('certificates');
    $focal = certificateStaff('ched-focal', $this->xii);
    $other = certificateGuest($this->xii);
    certificateCheckIn($this->event, $this->guest, '2026-10-14');
    certificateCheckIn($this->event, $this->guest, '2026-10-15');
    certificateCheckIn($this->event, $other, '2026-10-15');
    $use = GadEventCertificate::query()->create([
        'gad_event_id' => $this->event->id,
        'certificate_design_id' => certificateDesign($this->xii, [certificateSignatory($this->xii)])->id,
    ]);

    $this->actingAs($this->guest)->get(route('events.show', $this->event))
        ->assertInertia(fn (Assert $page) => $page->where('attended', ['2026-10-14', '2026-10-15'])->where('certificates', []));

    app(ManageEventCertificate::class)->release($focal, $use);
    $this->actingAs($this->guest)->get(route('events.show', $this->event))
        ->assertInertia(fn (Assert $page) => $page
            ->has('certificates', 1)
            ->where('certificates.0.title', 'Certificate of Participation')
            ->where('certificates.0.number', $use->certificates()->where('user_id', $this->guest->id)->value('number')));

    // How many joined is for the region's CHED Focal and Administrators,
    // whoever added the event; never for other staff.
    foreach ([$focal, certificateStaff('admin')] as $staff) {
        $this->actingAs($staff)->get(route('events.show', $this->event))
            ->assertInertia(fn (Assert $page) => $page
                ->where('event.joined_count', 2)
                ->where('can', ['join' => true, 'viewRegistrations' => true, 'update' => true]));
    }
    $this->actingAs(certificateStaff('ched-employee', $this->xii))->get(route('events.show', $this->event))
        ->assertInertia(fn (Assert $page) => $page
            ->missing('event.joined_count')
            ->where('can.viewRegistrations', false));
});

test('the calendars say which events you joined', function () {
    $later = certificateEvent('Later forum', $this->xii, '2026-10-20 08:00:00', '2026-10-20 17:00:00');
    joinEvent($this->event, $this->guest);

    $this->actingAs($this->guest)->get(route('events.index', ['month' => '2026-10']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('calendar.events', fn ($events) => collect($events)->mapWithKeys(fn (array $event): array => [$event['title'] => $event['joined']])->all() === [
                'GAD Orientation' => true,
                'Later forum' => false,
            ])
            ->where('calendar.events.1.ulid', $later->ulid));
    $this->actingAs($this->guest)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->where('upcoming.0.joined', true)->where('upcoming.1.joined', false));
});

test('the notice of a new event opens its page', function () {
    $staff = certificateStaff('ched-focal', $this->xii);

    $this->actingAs($staff)->post(route('admin.events.store'), [
        'title' => 'New forum', 'category' => 'meeting', 'is_all_day' => false,
        'starts_at' => '2026-10-21T09:00', 'ends_at' => '2026-10-21T12:00',
    ])->assertSessionHasNoErrors();

    $notice = $this->guest->notifications()->sole();
    $event = GadEvent::query()->where('title', 'New forum')->sole();
    $this->actingAs($this->guest)->get(route('notifications.open', $notice))
        ->assertRedirect(route('events.show', $event));
});
