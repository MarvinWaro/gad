<?php

use App\Actions\Certificates\ManageEventCertificate;
use App\Enums\CertificateKind;
use App\Enums\NotificationKind;
use App\Models\Certificate;
use App\Models\CertificateRequest;
use App\Models\GadEventCertificate;
use App\Models\Notification;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('certificates');
    // 01:00 UTC on October 16, 2026: the day after the event.
    CarbonImmutable::setTestNow('2026-10-16 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true, 'office_city' => 'Koronadal City']);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
    $this->focal = certificateStaff('ched-focal', $this->xii);
    $signatory = certificateSignatory($this->xii);
    // October 14, 8:00 AM, to October 15, 5:00 PM.
    $this->event = certificateEvent('GAD Orientation', $this->xii);
    $this->participation = GadEventCertificate::query()->create([
        'gad_event_id' => $this->event->id,
        'certificate_design_id' => certificateDesign($this->xii, [$signatory])->id,
    ]);
    $this->appearance = GadEventCertificate::query()->create([
        'gad_event_id' => $this->event->id,
        'certificate_design_id' => certificateDesign($this->xii, [$signatory], CertificateKind::Appearance)->id,
    ]);
    attendEveryDay($this->event, certificateGuest($this->xii, ['name' => 'Every Day']));
    $this->dayOne = certificateGuest($this->xii, ['name' => 'Day One']);
    certificateCheckIn($this->event, $this->dayOne, '2026-10-14');
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function releaseBoth(object $test): void
{
    app(ManageEventCertificate::class)->release(null, $test->participation);
    app(ManageEventCertificate::class)->release(null, $test->appearance);
}

test('someone who missed a day asks for a released certificate, and its office is told', function () {
    // Nothing to ask for before it goes out.
    $this->actingAs($this->dayOne)->post(route('events.certificate-requests.store', $this->event), ['certificate' => $this->appearance->id, 'reason' => 'I came for the first day only.'])
        ->assertSessionHasErrors('certificate');

    releaseBoth($this);
    $this->actingAs($this->dayOne)->get(route('events.show', $this->event))
        ->assertInertia(fn (Assert $page) => $page
            ->where('attended', ['2026-10-14'])
            ->where('requestable', [
                ['id' => $this->participation->id, 'title' => 'Certificate of Participation'],
                ['id' => $this->appearance->id, 'title' => 'Certificate of Appearance'],
            ])
            ->where('requests', []));

    $this->actingAs($this->dayOne)->post(route('events.certificate-requests.store', $this->event), ['certificate' => $this->appearance->id, 'reason' => '  I came for the first day only. '])
        ->assertSessionHasNoErrors();

    $request = CertificateRequest::query()->sole();
    expect($request)->user_id->toBe($this->dayOne->id)->reason->toBe('I came for the first day only.')
        ->and($request->isPending())->toBeTrue();
    expect(Notification::query()->where('kind', NotificationKind::CertificateRequested)->pluck('user_id')->all())->toBe([$this->focal->id]);
    $this->actingAs($this->focal)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence.before', 'asked for a')
        ->assertJsonPath('data.0.sentence.subject', 'Certificate of Appearance for GAD Orientation');

    // Once each, and the page says so.
    $this->actingAs($this->dayOne)->post(route('events.certificate-requests.store', $this->event), ['certificate' => $this->appearance->id, 'reason' => 'Again'])
        ->assertSessionHasErrors(['certificate' => 'You already asked for this certificate.']);
    $this->actingAs($this->dayOne)->get(route('events.show', $this->event))
        ->assertInertia(fn (Assert $page) => $page
            ->where('requests.0.status', 'pending')
            ->where('requestable', [['id' => $this->participation->id, 'title' => 'Certificate of Participation']]));
});

test('only people checked in on some day, without the certificate, may ask; and never for another event\'s', function () {
    releaseBoth($this);
    $route = route('events.certificate-requests.store', $this->event);

    $absent = certificateGuest($this->xii);
    joinEvent($this->event, $absent);
    $this->actingAs($absent)->post($route, ['certificate' => $this->participation->id, 'reason' => 'Please'])
        ->assertSessionHasErrors('certificate');
    $holder = Certificate::query()->firstOrFail()->user;
    $this->actingAs($holder)->post($route, ['certificate' => $this->participation->id, 'reason' => 'Please'])
        ->assertSessionHasErrors(['certificate' => 'You already have this certificate.']);
    $other = GadEventCertificate::query()->create([
        'gad_event_id' => certificateEvent('Other forum', $this->xii)->id,
        'certificate_design_id' => certificateDesign($this->xii, [certificateSignatory($this->xii, 'Other Signatory')])->id,
    ]);
    $this->actingAs($this->dayOne)->post($route, ['certificate' => $other->id, 'reason' => 'Please'])->assertSessionHasErrors('certificate');
    $this->actingAs($this->dayOne)->post($route, ['certificate' => $this->participation->id, 'reason' => ''])->assertSessionHasErrors('reason');
    // From another region, who can't see the event.
    $this->actingAs(certificateGuest($this->ix))->post($route, ['certificate' => $this->participation->id, 'reason' => 'Please'])->assertForbidden();

    expect(CertificateRequest::query()->exists())->toBeFalse();
});

test('the office approves a request, which gives the certificate and tells them', function () {
    releaseBoth($this);
    $request = CertificateRequest::query()->create(['gad_event_certificate_id' => $this->appearance->id, 'user_id' => $this->dayOne->id, 'reason' => 'Day one only']);

    $this->actingAs($this->focal)->get(route('settings.event-certificates.show', $this->appearance))
        ->assertInertia(fn (Assert $page) => $page
            ->where('requests.data.0.person.name', 'Day One')
            ->where('requests.data.0.days', ['2026-10-14'])
            ->where('requests.data.0.status', 'pending'));

    $this->actingAs($this->focal)->put(route('settings.event-certificates.requests.update', [$this->appearance, $request]), ['decision' => 'approve'])
        ->assertSessionHasNoErrors();

    expect($request->refresh()->status->value)->toBe('approved')
        ->and($request->decided_by)->toBe($this->focal->id)
        ->and(Certificate::query()->where('user_id', $this->dayOne->id)->sole()->gad_event_certificate_id)->toBe($this->appearance->id);
    $this->actingAs($this->dayOne)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence.before', 'released your')
        ->assertJsonPath('data.0.sentence.subject', 'Certificate of Appearance for GAD Orientation');
    $this->actingAs($this->dayOne)->get(route('my-certificates.index'))
        ->assertInertia(fn (Assert $page) => $page->has('certificates.data', 1));

    // Answered once.
    $this->actingAs($this->focal)->put(route('settings.event-certificates.requests.update', [$this->appearance, $request]), ['decision' => 'decline'])
        ->assertSessionHasErrors('request');
});

test('the office declines a request with a note, which they read', function () {
    releaseBoth($this);
    $request = CertificateRequest::query()->create(['gad_event_certificate_id' => $this->participation->id, 'user_id' => $this->dayOne->id, 'reason' => 'Please']);
    $route = route('settings.event-certificates.requests.update', [$this->participation, $request]);

    $this->actingAs(certificateStaff('ched-focal', $this->ix))->put($route, ['decision' => 'decline'])->assertForbidden();
    $this->actingAs($this->focal)->put($route, ['decision' => 'maybe'])->assertSessionHasErrors('decision');
    $this->actingAs($this->focal)->put($route, ['decision' => 'decline', 'note' => 'Participation needs all days. Ask for the Certificate of Appearance.'])
        ->assertSessionHasNoErrors();

    expect($request->refresh()->status->value)->toBe('declined')
        ->and(Certificate::query()->where('user_id', $this->dayOne->id)->exists())->toBeFalse();
    $this->actingAs($this->dayOne)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence.before', 'declined your request for a')
        ->assertJsonPath('data.0.quote', 'Participation needs all days. Ask for the Certificate of Appearance.');
    $this->actingAs($this->dayOne)->get(route('events.show', $this->event))
        ->assertInertia(fn (Assert $page) => $page
            ->where('requests.0.status', 'declined')
            ->where('requests.0.note', 'Participation needs all days. Ask for the Certificate of Appearance.'));
    // A request of another certificate isn't reached through this one.
    $this->actingAs($this->focal)->put(route('settings.event-certificates.requests.update', [$this->appearance, $request]), ['decision' => 'approve'])
        ->assertNotFound();
});
