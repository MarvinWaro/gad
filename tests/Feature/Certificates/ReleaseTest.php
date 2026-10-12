<?php

use App\Enums\CertificateKind;
use App\Enums\NotificationKind;
use App\Models\Certificate;
use App\Models\GadEventCertificate;
use App\Models\Notification;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('certificates');
    // 01:00 UTC is 9:00 AM in Manila, on Thursday, October 15, 2026.
    CarbonImmutable::setTestNow('2026-10-15 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true, 'office_city' => 'Koronadal City']);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
    $this->focal = certificateStaff('ched-focal', $this->xii);
    $this->director = certificateSignatory($this->xii, 'Maria Santos', 'Regional Director');
    $this->design = certificateDesign($this->xii, [$this->director]);
    $this->event = certificateEvent('GAD Orientation', $this->xii);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function useCertificateDesign(object $test): GadEventCertificate
{
    $test->actingAs($test->focal)
        ->post(route('settings.certificates.use', $test->design), ['event' => $test->event->id])
        ->assertSessionDoesntHaveErrors();

    return GadEventCertificate::query()->latest()->firstOrFail();
}

test('a design is used on its office\'s events, one of each kind, never at a deadline', function () {
    $use = useCertificateDesign($this);
    expect($use->gad_event_id)->toBe($this->event->id);

    // Another participation design on the same event.
    $second = certificateDesign($this->xii, [$this->director], attributes: ['name' => 'Second']);
    $this->actingAs($this->focal)->post(route('settings.certificates.use', $second), ['event' => $this->event->id])
        ->assertSessionHasErrors('event');
    // An appearance certificate beside it is fine.
    $appearance = certificateDesign($this->xii, [$this->director], CertificateKind::Appearance);
    $this->actingAs($this->focal)->post(route('settings.certificates.use', $appearance), ['event' => $this->event->id])
        ->assertSessionDoesntHaveErrors();

    $deadline = certificateEvent('Report deadline', $this->xii, category: 'deadline');
    $this->actingAs($this->focal)->post(route('settings.certificates.use', $second), ['event' => $deadline->id])
        ->assertSessionHasErrors('event');
    $theirs = certificateEvent('Region IX training', $this->ix);
    $this->actingAs($this->focal)->post(route('settings.certificates.use', $second), ['event' => $theirs->id])
        ->assertSessionHasErrors('event');
    $everyRegion = certificateEvent('National summit', null);
    $this->actingAs($this->focal)->post(route('settings.certificates.use', $second), ['event' => $everyRegion->id])
        ->assertSessionHasErrors('event');

    // The picker offers only events it can still be used on.
    $this->actingAs($this->focal)->getJson(route('settings.certificates.events', $second))
        ->assertOk()
        ->assertJsonCount(0);
    $this->actingAs($this->focal)->getJson(route('settings.certificates.events', $this->design))
        ->assertJsonCount(0);
    certificateEvent('Second training', $this->xii);
    $this->actingAs($this->focal)->getJson(route('settings.certificates.events', $this->design))
        ->assertJsonCount(1)
        ->assertJsonPath('0.title', 'Second training');
});

test('releasing gives a certificate to everyone checked in, once, and tells them', function () {
    $use = useCertificateDesign($this);
    $twoDays = certificateGuest($this->xii, ['name' => 'Ana Reyes']);
    $oneDay = certificateGuest($this->xii, ['name' => 'Jose Cruz']);
    $absent = certificateGuest($this->xii, ['name' => 'Not Here']);
    certificateCheckIn($this->event, $twoDays, '2026-10-14');
    certificateCheckIn($this->event, $twoDays, '2026-10-15');
    certificateCheckIn($this->event, $oneDay, '2026-10-15');

    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use))
        ->assertSessionDoesntHaveErrors()
        ->assertRedirect();

    $use->refresh();
    expect($use->released_at)->not->toBeNull()
        ->and($use->released_by)->toBe($this->focal->id)
        ->and($use->snapshot['signatories'][0]['name'])->toBe('Maria Santos')
        ->and($use->snapshot['office'])->toBe(['name' => 'Regional Office XII', 'city' => 'Koronadal City'])
        ->and($use->snapshot['event']['title'])->toBe('GAD Orientation');

    $certificates = Certificate::query()->orderBy('name')->get();
    expect($certificates->pluck('name')->all())->toBe(['Ana Reyes', 'Jose Cruz'])
        ->and($certificates->pluck('number')->unique())->toHaveCount(2)
        ->and($certificates[0]->affiliation)->toBe('Regional Office XII College')
        ->and($certificates[0]->survey_region_id)->toBe($this->xii->id);
    expect(Notification::query()->where('kind', NotificationKind::CertificateReleased)->pluck('user_id')->sort()->values()->all())
        ->toBe(collect([$twoDays->id, $oneDay->id])->sort()->values()->all());
    $this->assertDatabaseHas('activity_logs', ['subject_type' => 'event-certificate', 'action' => 'released']);

    // Nobody new: nothing to release.
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use))
        ->assertSessionHasErrors('certificate');
    expect(Certificate::query()->where('user_id', $absent->id)->exists())->toBeFalse();
});

test('releasing again reaches only those checked in since, and keeps what was released', function () {
    $use = useCertificateDesign($this);
    $early = certificateGuest($this->xii, ['name' => 'Early Person']);
    certificateCheckIn($this->event, $early, '2026-10-14');
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use));

    // The director changes on the design; the released certificate keeps the old one.
    $this->director->update(['name' => 'New Director']);
    $late = certificateGuest($this->xii, ['name' => 'Late Person']);
    certificateCheckIn($this->event, $late, '2026-10-15');
    CarbonImmutable::setTestNow('2026-10-15 03:00:00');

    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use))
        ->assertSessionDoesntHaveErrors();

    expect(Certificate::query()->count())->toBe(2)
        ->and($use->refresh()->snapshot['signatories'][0]['name'])->toBe('Maria Santos')
        ->and(Notification::query()->where('kind', NotificationKind::CertificateReleased)->where('user_id', $early->id)->count())->toBe(1)
        ->and(Notification::query()->where('kind', NotificationKind::CertificateReleased)->where('user_id', $late->id)->count())->toBe(1);
});

test('a certificate can\'t be released without someone checked in, a signatory, or the venue its wording names', function () {
    $use = useCertificateDesign($this);

    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use))
        ->assertSessionHasErrors(['certificate' => 'No one has been checked in to this event yet.']);

    certificateCheckIn($this->event, certificateGuest($this->xii));
    $this->event->update(['location' => null]);
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use))
        ->assertSessionHasErrors('certificate');

    expect(Certificate::query()->count())->toBe(0)
        ->and($use->refresh()->released_at)->toBeNull();
});

test('updating released certificates prints the design, event and names as they are now', function () {
    $use = useCertificateDesign($this);
    $guest = certificateGuest($this->xii, ['name' => 'Ana Reyez']);
    certificateCheckIn($this->event, $guest);
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use));

    $this->event->update(['title' => 'GAD Orientation Seminar']);
    $guest->update(['name' => 'Ana Reyes']);
    $this->actingAs($this->focal)->post(route('settings.event-certificates.refresh', $use))
        ->assertSessionDoesntHaveErrors();

    expect($use->refresh()->snapshot['event']['title'])->toBe('GAD Orientation Seminar')
        ->and(Certificate::query()->sole()->name)->toBe('Ana Reyes');
});

test('a certificate given by mistake is withdrawn, and can be restored', function () {
    $use = useCertificateDesign($this);
    certificateCheckIn($this->event, certificateGuest($this->xii));
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use));
    $certificate = Certificate::query()->sole();

    $this->actingAs($this->focal)
        ->put(route('settings.event-certificates.status', [$use, $certificate]), ['withdrawn' => true])
        ->assertRedirect();
    expect($certificate->refresh()->withdrawn_at)->not->toBeNull()
        ->and($certificate->withdrawn_by)->toBe($this->focal->id);
    $this->assertDatabaseHas('activity_logs', ['subject_type' => 'certificate', 'action' => 'withdrawn']);

    $this->actingAs($this->focal)
        ->put(route('settings.event-certificates.status', [$use, $certificate]), ['withdrawn' => false]);
    expect($certificate->refresh()->withdrawn_at)->toBeNull();

    // Released certificates stay on the event.
    $this->actingAs($this->focal)->delete(route('settings.event-certificates.destroy', $use))
        ->assertSessionHasErrors('certificate');
});

test('the release page lists the people given it, by name, region and HEI', function () {
    $use = useCertificateDesign($this);
    certificateCheckIn($this->event, certificateGuest($this->xii, ['name' => 'Ana Reyes']));
    certificateCheckIn($this->event, certificateGuest($this->ix, ['name' => 'Walk-in From IX']));
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use));

    $this->actingAs($this->focal)->get(route('settings.event-certificates.show', $use))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/event-certificate')
            ->where('certificate.title', 'Certificate of Participation')
            ->where('certificate.eligible', 2)
            ->where('certificate.issued', 2)
            ->where('awaiting', 0)
            ->has('holders.data', 2));
    $this->actingAs($this->focal)->get(route('settings.event-certificates.show', [$use, 'search' => 'walk']))
        ->assertInertia(fn (Assert $page) => $page->has('holders.data', 1)->where('holders.data.0.name', 'Walk-in From IX'));
    $this->actingAs($this->focal)->get(route('settings.event-certificates.show', [$use, 'region' => $this->ix->id]))
        ->assertInertia(fn (Assert $page) => $page->has('holders.data', 1));
});

test('only the event\'s office releases its certificates', function () {
    $use = useCertificateDesign($this);
    certificateCheckIn($this->event, certificateGuest($this->xii));

    $this->actingAs(certificateStaff('ched-focal', $this->ix))->post(route('settings.event-certificates.release', $use))->assertForbidden();
    $this->actingAs(certificateStaff('ched-employee', $this->xii))->get(route('settings.event-certificates.show', $use))->assertForbidden();
    $this->actingAs(certificateStaff('admin'))->post(route('settings.event-certificates.release', $use))->assertSessionDoesntHaveErrors();

    expect(Certificate::query()->count())->toBe(1);
});

test('an event whose certificates were released can\'t be deleted', function () {
    $admin = certificateStaff('admin');
    $use = useCertificateDesign($this);
    certificateCheckIn($this->event, certificateGuest($this->xii));
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $use));

    $this->actingAs($admin)->delete(route('admin.events.destroy', $this->event))->assertRedirect();
    expect($this->event->fresh())->not->toBeNull();

    // Without released certificates, deleting works as before.
    $other = certificateEvent('Other training', $this->xii);
    GadEventCertificate::query()->create(['gad_event_id' => $other->id, 'certificate_design_id' => certificateDesign($this->xii, [$this->director], attributes: ['name' => 'Other'])->id]);
    $this->actingAs($admin)->delete(route('admin.events.destroy', $other))->assertRedirect();
    expect($other->fresh())->toBeNull();
});

test('the permissions migration grants offices certificates and takes them back', function () {
    $migration = require database_path('migrations/2026_10_21_000004_let_offices_give_event_certificates.php');
    $slugs = ['certificates.view', 'certificates.create', 'certificates.update', 'certificates.delete', 'certificates.release'];
    DB::table('permission_role')->whereIn('permission_id', Permission::query()->whereIn('slug', $slugs)->pluck('id'))->delete();

    $migration->up();
    foreach (['admin', 'ched-focal'] as $role) {
        expect(Role::query()->where('slug', $role)->firstOrFail()->permissions()->whereIn('slug', $slugs)->count())->toBe(5);
    }
    expect(Role::query()->where('slug', 'ched-employee')->firstOrFail()->permissions()->whereIn('slug', $slugs)->count())->toBe(0);

    $migration->down();
    expect(Permission::query()->whereIn('slug', $slugs)->count())->toBe(0);
});
