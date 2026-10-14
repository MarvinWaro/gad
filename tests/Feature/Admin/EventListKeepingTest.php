<?php

use App\Actions\Certificates\ManageEventCertificate;
use App\Enums\NotificationKind;
use App\Models\Certificate;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\GadEventCheckIn;
use App\Models\GadEventGuest;
use App\Models\GadEventRegistration;
use App\Models\Notification;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    // 01:00 UTC is 9:00 AM in Manila, on Thursday, October 15, 2026: the
    // event's second and last day.
    CarbonImmutable::setTestNow('2026-10-15 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
    $this->focal = certificateStaff('ched-focal', $this->xii);
    // October 14, 8:00 AM, to October 15, 5:00 PM.
    $this->event = certificateEvent('GAD Orientation', $this->xii);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

/** The kinds of notice someone has. */
function noticeKinds(int $userId): array
{
    return Notification::query()->where('user_id', $userId)->pluck('kind')->map(fn (NotificationKind $kind): string => $kind->value)->all();
}

test('staff add an invitee from another region, who is told and sees the event', function () {
    $invitee = certificateGuest($this->ix, ['name' => 'Invited Speaker']);

    $this->actingAs($this->focal)->post(route('admin.events.registrations.store', $this->event), ['person' => $invitee->ulid, 'days' => ['2026-10-14']])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $registration = GadEventRegistration::query()->sole();
    expect($registration->added_by)->toBe($this->focal->id)
        ->and($registration->survey_region_id)->toBe($this->ix->id)
        ->and(GadEventCheckIn::query()->sole())->method->toBe('manual')->attended_on->toBe('2026-10-14')->checked_in_by->toBe($this->focal->id);
    expect(noticeKinds($invitee->id))->toBe(['event_person_added']);
    $this->assertDatabaseHas('activity_logs', ['action' => 'added', 'subject_type' => 'event-registration', 'subject_label' => 'Invited Speaker to GAD Orientation']);

    // From another region, they open it, see it on their calendar, and the notice reads well.
    $this->actingAs($invitee)->get(route('events.show', $this->event))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('registration.added', true)->where('attended', ['2026-10-14']));
    $this->actingAs($invitee)->get(route('events.index', ['month' => '2026-10']))
        ->assertInertia(fn (Assert $page) => $page->where('calendar.events.0.title', 'GAD Orientation'));
    $this->actingAs($invitee)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence.before', 'added you to the GAD event')
        ->assertJsonPath('data.0.sentence.subject', 'GAD Orientation');

    // Being on the list hands out no staff work in that region.
    $staff = certificateStaff('ched-focal', $this->ix);
    $this->event->registrations()->create(['user_id' => $staff->id, 'survey_region_id' => $this->ix->id]);
    expect($staff->can('view', $this->event))->toBeTrue()
        ->and($staff->can('checkIn', $this->event))->toBeFalse()
        ->and($staff->can('viewRegistrations', $this->event))->toBeFalse();
});

test('adding is refused twice, for days outside the event, at a deadline and once cancelled', function () {
    $person = certificateGuest($this->xii);
    joinEvent($this->event, $person);
    $route = route('admin.events.registrations.store', $this->event);

    $this->actingAs($this->focal)->post($route, ['person' => $person->ulid])->assertSessionHasErrors('person');
    $other = certificateGuest($this->ix);
    $this->actingAs($this->focal)->post($route, ['person' => $other->ulid, 'days' => ['2026-10-16']])->assertSessionHasErrors('days');
    $this->actingAs($this->focal)->post($route, ['person' => 'not-a-ulid'])->assertSessionHasErrors('person');

    $this->event->forceFill(['cancelled_at' => now()])->save();
    $this->actingAs($this->focal)->post($route, ['person' => $other->ulid])->assertSessionHasErrors('registration');

    // Staff of another region, and those who don't run events, can't.
    $this->event->forceFill(['cancelled_at' => null])->save();
    $this->actingAs(certificateStaff('ched-focal', $this->ix))->post($route, ['person' => $other->ulid])->assertForbidden();
    $this->actingAs(certificateStaff('gad-focal-person', $this->xii))->post($route, ['person' => $other->ulid])->assertForbidden();
    expect(GadEventRegistration::query()->count())->toBe(1);
});

test('the people search finds anyone in the country who is not on the list yet', function () {
    joinEvent($this->event, certificateGuest($this->xii, ['name' => 'Ana Joined']));
    certificateGuest($this->ix, ['name' => 'Ana Visitor']);

    $this->actingAs($this->focal)->getJson(route('admin.events.people', [$this->event, 'q' => 'ana']))
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Ana Visitor')
        ->assertJsonPath('data.0.affiliation', 'Regional Office IX College');
});

test('staff mark the days someone came, and undo one, but never once they hold its certificate', function () {
    $person = certificateGuest($this->xii, ['name' => 'Paper Sheet']);
    $registration = joinEvent($this->event, $person);
    $route = route('admin.events.registrations.attendance', [$this->event, $registration]);

    $this->actingAs($this->focal)->put($route, ['days' => ['2026-10-14', '2026-10-15']])->assertSessionHasNoErrors();
    expect(GadEventCheckIn::query()->orderBy('attended_on')->pluck('attended_on')->all())->toBe(['2026-10-14', '2026-10-15']);

    $this->actingAs($this->focal)->put($route, ['days' => ['2026-10-15']])->assertSessionHasNoErrors();
    expect(GadEventCheckIn::query()->pluck('attended_on')->all())->toBe(['2026-10-15']);
    $this->assertDatabaseHas('activity_logs', ['action' => 'updated', 'subject_label' => 'the attendance of Paper Sheet at GAD Orientation']);

    $this->actingAs($this->focal)->put($route, ['days' => ['2026-10-16']])->assertSessionHasErrors('days');
    $this->actingAs($this->focal)->put($route, [])->assertSessionHasErrors('days');

    // Once they hold its certificate, days are only added.
    Storage::fake('certificates');
    $use = GadEventCertificate::query()->create([
        'gad_event_id' => $this->event->id,
        'certificate_design_id' => certificateDesign($this->xii, [certificateSignatory($this->xii)])->id,
        'released_at' => now(),
    ]);
    Certificate::query()->create(['gad_event_certificate_id' => $use->id, 'user_id' => $person->id, 'number' => 'CERT-AAAA-BBBB', 'name' => $person->name]);
    $this->actingAs($this->focal)->put($route, ['days' => []])->assertSessionHasErrors('days');
    $this->actingAs($this->focal)->put($route, ['days' => ['2026-10-14', '2026-10-15']])->assertSessionHasNoErrors();
});

test('someone added by mistake is taken off, until a day is marked', function () {
    $registration = joinEvent($this->event, certificateGuest($this->xii, ['name' => 'Wrong Person']));
    $kept = certificateCheckIn($this->event, certificateGuest($this->xii), '2026-10-15');
    $keptRegistration = GadEventRegistration::query()->where('user_id', $kept->user_id)->sole();

    $this->actingAs($this->focal)->delete(route('admin.events.registrations.destroy', [$this->event, $keptRegistration]))
        ->assertSessionHasErrors('registration');
    $this->actingAs($this->focal)->delete(route('admin.events.registrations.destroy', [$this->event, $registration]))
        ->assertSessionHasNoErrors();

    expect(GadEventRegistration::query()->pluck('id')->all())->toBe([$keptRegistration->id]);
    $this->assertDatabaseHas('activity_logs', ['action' => 'removed', 'subject_label' => 'Wrong Person from GAD Orientation']);

    // A registration of another event is not reached through this one.
    $other = certificateEvent('Other forum', $this->xii);
    $theirs = joinEvent($other, certificateGuest($this->xii));
    $this->actingAs($this->focal)->delete(route('admin.events.registrations.destroy', [$this->event, $theirs]))->assertNotFound();
});

test('the list sends each person\'s days, the guests, and the days staff may mark', function () {
    attendEveryDay($this->event, certificateGuest($this->xii, ['name' => 'Every Day']));
    GadEventGuest::query()->create(['gad_event_id' => $this->event->id, 'name' => 'Juan Dela Cruz', 'organization' => 'DepEd', 'added_by' => $this->focal->id]);

    $this->actingAs($this->focal)->get(route('admin.events.registrations.index', $this->event))
        ->assertInertia(fn (Assert $page) => $page
            ->where('registrations.data.0.days', ['2026-10-14', '2026-10-15'])
            ->where('counts.guests', 1)
            ->where('guests.data.0.name', 'Juan Dela Cruz')
            ->where('guests.data.0.days', [])
            ->where('days', ['2026-10-14', '2026-10-15'])
            ->where('can.update', true));
});

test('staff add, correct and remove guests without an account, with the days they came', function () {
    $route = route('admin.events.guests.store', $this->event);

    $this->actingAs($this->focal)->post($route, [
        'name' => '  Juan Dela Cruz ', 'organization' => 'DepEd Region XII', 'position' => 'Speaker', 'sex' => 'male', 'days' => ['2026-10-14'],
    ])->assertSessionHasNoErrors();

    $guest = GadEventGuest::query()->sole();
    expect($guest)->name->toBe('Juan Dela Cruz')->organization->toBe('DepEd Region XII')->added_by->toBe($this->focal->id)
        ->and($guest->affiliation())->toBe('Speaker, DepEd Region XII')
        ->and($guest->days()->pluck('attended_on')->all())->toBe(['2026-10-14']);
    $this->assertDatabaseHas('activity_logs', ['action' => 'added', 'subject_type' => 'event-guest', 'subject_label' => 'Juan Dela Cruz at GAD Orientation']);

    $this->actingAs($this->focal)->put(route('admin.events.guests.update', [$this->event, $guest]), [
        'name' => 'Juan Dela Cruz', 'organization' => 'DepEd', 'position' => '', 'sex' => null, 'days' => ['2026-10-14', '2026-10-15'],
    ])->assertSessionHasNoErrors();
    expect($guest->fresh())->organization->toBe('DepEd')->position->toBeNull()
        ->and($guest->days()->count())->toBe(2);

    $this->actingAs($this->focal)->post($route, ['name' => '', 'organization' => '', 'sex' => 'other'])
        ->assertSessionHasErrors(['name', 'organization', 'sex']);
    $this->actingAs(certificateStaff('ched-employee', $this->xii))->post($route, ['name' => 'X', 'organization' => 'Y'])->assertForbidden();

    $this->actingAs($this->focal)->delete(route('admin.events.guests.destroy', [$this->event, $guest]))->assertSessionHasNoErrors();
    expect(GadEventGuest::query()->exists())->toBeFalse();
});

test('a guest who missed a day is given the released certificate by hand, printed and verified like any', function () {
    Storage::fake('certificates');
    $use = GadEventCertificate::query()->create([
        'gad_event_id' => $this->event->id,
        'certificate_design_id' => certificateDesign($this->xii, [certificateSignatory($this->xii)])->id,
    ]);
    $guest = GadEventGuest::query()->create(['gad_event_id' => $this->event->id, 'name' => 'Resource Speaker', 'organization' => 'PCW']);
    $guest->days()->create(['attended_on' => '2026-10-15']);
    $route = route('admin.events.guests.certificates.store', [$this->event, $guest]);

    // Not before it goes out.
    $this->actingAs($this->focal)->post($route, ['certificate' => $use->id])->assertSessionHasErrors('certificate');

    attendEveryDay($this->event, certificateGuest($this->xii));
    app(ManageEventCertificate::class)->release($this->focal, $use);
    $this->actingAs($this->focal)->post($route, ['certificate' => $use->id])->assertSessionHasNoErrors();
    $this->actingAs($this->focal)->post($route, ['certificate' => $use->id])->assertSessionHasErrors('certificate');

    $certificate = Certificate::query()->whereNotNull('gad_event_guest_id')->sole();
    expect($certificate)->user_id->toBeNull()->gad_event_guest_id->toBe($guest->id)->name->toBe('Resource Speaker')->affiliation->toBe('PCW');

    // Staff print it; it verifies; its days are the guest's.
    $this->actingAs($this->focal)->getJson(route('certificates.document', $certificate))
        ->assertOk()
        ->assertJsonPath('days', ['2026-10-15']);
    $this->get(route('verify.show', $certificate->number))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('certificate.name', 'RESOURCE SPEAKER'));
    // A guest holding one stays.
    $this->actingAs($this->focal)->delete(route('admin.events.guests.destroy', [$this->event, $guest]))->assertSessionHasErrors('guest');
    // Only the office that releases it gives it.
    $this->actingAs(certificateStaff('ched-focal', $this->ix))->post($route, ['certificate' => $use->id])->assertForbidden();
});

test('a cancelled event keeps its list, takes no one, and everyone on it is told, also when it is back on', function () {
    $joined = certificateGuest($this->xii);
    joinEvent($this->event, $joined);
    $route = route('admin.events.cancellation.update', $this->event);

    $this->actingAs($this->focal)->put($route, ['cancelled' => true])->assertSessionHasNoErrors();
    $this->event->refresh();
    expect($this->event->isCancelled())->toBeTrue()
        ->and($this->event->statusAt(GadEvent::localNow()))->toBe('cancelled')
        ->and(GadEventRegistration::query()->count())->toBe(1)
        ->and(noticeKinds($joined->id))->toBe(['event_cancelled']);

    $this->actingAs(certificateGuest($this->xii))->post(route('events.registration.store', $this->event))
        ->assertSessionHasErrors(['registration' => 'GAD Orientation was cancelled.']);
    expect(GadEvent::query()->openForCheckIn(GadEvent::localNow())->exists())->toBeFalse();
    $this->actingAs($this->focal)->get(route('admin.events.index', ['status' => 'cancelled']))
        ->assertInertia(fn (Assert $page) => $page->has('events.data', 1)->where('events.data.0.status', 'cancelled')->where('events.data.0.cancelled', true));
    $this->actingAs($this->focal)->get(route('admin.events.index', ['status' => 'ongoing']))
        ->assertInertia(fn (Assert $page) => $page->has('events.data', 0)->where('ongoing', 0));

    $this->actingAs($this->focal)->put($route, ['cancelled' => false])->assertSessionHasNoErrors();
    expect($this->event->fresh()->isCancelled())->toBeFalse()
        ->and(noticeKinds($joined->id))->toBe(['event_cancelled', 'event_restored']);

    $this->actingAs(certificateStaff('ched-employee', $this->xii))->put($route, ['cancelled' => true])->assertForbidden();
});

test('people on the list are told of a new date, time, venue or region, and of nothing else', function () {
    $joined = certificateGuest($this->xii);
    joinEvent($this->event, $joined);
    $admin = certificateStaff('admin');
    $payload = fn (array $overrides) => [
        'title' => 'GAD Orientation', 'category' => 'training', 'is_all_day' => false,
        'starts_at' => '2026-10-14T08:00', 'ends_at' => '2026-10-15T17:00', 'location' => 'Koronadal City', 'region' => $this->xii->id, ...$overrides,
    ];

    $this->actingAs($admin)->put(route('admin.events.update', $this->event), $payload(['title' => 'GAD Orientation 2026', 'description' => 'More']));
    $this->actingAs($this->focal)->put(route('admin.events.registration.update', $this->event), ['open' => false]);
    expect(noticeKinds($joined->id))->toBe([]);

    $this->actingAs($admin)->put(route('admin.events.update', $this->event), $payload(['location' => 'General Santos City', 'ends_at' => '2026-10-16T12:00']))
        ->assertSessionHasNoErrors();
    expect(noticeKinds($joined->id))->toBe(['event_changed']);
    $this->actingAs($joined)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence.before', 'changed the GAD event')
        ->assertJsonPath('data.0.quote', 'Ends October 16, 2026, 12:00 PM · Venue: General Santos City');

    // A region change keeps them on the list, and tells them.
    $this->actingAs($admin)->put(route('admin.events.update', $this->event), $payload(['location' => 'General Santos City', 'ends_at' => '2026-10-16T12:00', 'region' => $this->ix->id]));
    expect(GadEventRegistration::query()->count())->toBe(1)
        ->and($joined->can('view', $this->event->fresh()))->toBeTrue();
    $this->actingAs($joined)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.quote', 'Now for Regional Office IX');
});

test('deleting an event people joined tells them it is off, and the notice opens the calendar', function () {
    $joined = certificateGuest($this->xii);
    joinEvent($this->event, $joined);

    $this->actingAs(certificateStaff('admin'))->delete(route('admin.events.destroy', $this->event))->assertRedirect();

    expect(GadEvent::query()->exists())->toBeFalse()
        ->and(noticeKinds($joined->id))->toBe(['event_cancelled']);
    $this->actingAs($joined)->get(route('notifications.open', Notification::query()->sole()))
        ->assertRedirect(route('events.index'));
});

test('a check-in made by mistake is undone at the scanner the same day, never once a certificate is given', function () {
    $staff = certificateStaff('ched-employee', $this->xii);
    $person = certificateGuest($this->xii, ['name' => 'Wrong Scan']);
    $today = certificateCheckIn($this->event, $person, '2026-10-15');
    $yesterday = certificateCheckIn($this->event, $person, '2026-10-14');

    $this->actingAs($staff)->deleteJson(route('admin.events.check-ins.destroy', [$this->event, $yesterday]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('check_in');
    $this->actingAs($staff)->deleteJson(route('admin.events.check-ins.destroy', [$this->event, $today]))
        ->assertOk()
        ->assertJson(['count' => 0]);

    expect(GadEventCheckIn::query()->pluck('attended_on')->all())->toBe(['2026-10-14']);
    $this->assertDatabaseHas('activity_logs', ['action' => 'check_in_undone', 'subject_label' => 'Wrong Scan at GAD Orientation']);

    $this->actingAs(certificateGuest($this->xii))->deleteJson(route('admin.events.check-ins.destroy', [$this->event, $yesterday]))->assertForbidden();
});
