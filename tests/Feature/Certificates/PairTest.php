<?php

use App\Enums\CertificateKind;
use App\Enums\NotificationKind;
use App\Models\Certificate;
use App\Models\CertificateDesign;
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
    $this->focal = certificateStaff('ched-focal', $this->xii);
    $this->appearance = certificateDesign($this->xii, [certificateSignatory($this->xii)], CertificateKind::Appearance, ['name' => 'CODI Forum']);
    // October 14, 8:00 AM, to October 15, 5:00 PM.
    $this->event = certificateEvent('GAD Orientation', $this->xii);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('a design makes its pair of the other kind: the same look and signatories, its own wording', function () {
    $this->actingAs($this->focal)->post(route('settings.certificates.pair', $this->appearance))->assertRedirect();

    $pair = CertificateDesign::query()->where('paired_with_id', $this->appearance->id)->sole();
    expect($pair)->kind->toBe(CertificateKind::Participation)
        ->name->toBe('CODI Forum (Participation)')
        ->body->toBe(CertificateKind::Participation->defaultBody())
        ->survey_region_id->toBe($this->xii->id)
        ->and($pair->signatories()->pluck('name')->all())->toBe(['Maria Santos'])
        ->and($this->appearance->fresh()->partner()?->id)->toBe($pair->id);

    // Once: it has its pair.
    $this->actingAs($this->focal)->post(route('settings.certificates.pair', $this->appearance))->assertSessionHasErrors('design');
    $this->actingAs($this->focal)->post(route('settings.certificates.pair', $pair))->assertSessionHasErrors('design');

    $this->actingAs($this->focal)->get(route('settings.certificates.show', $pair))
        ->assertInertia(fn (Assert $page) => $page->where('design.partner', [
            'id' => $this->appearance->id, 'name' => 'CODI Forum', 'title' => 'Certificate of Appearance',
        ]));
});

test('a pair is used on an event together, released together, and taken off together', function () {
    $this->actingAs($this->focal)->post(route('settings.certificates.pair', $this->appearance));
    $participation = CertificateDesign::query()->where('paired_with_id', $this->appearance->id)->sole();
    attendEveryDay($this->event, $everyDay = certificateGuest($this->xii));

    $this->actingAs($this->focal)->post(route('settings.certificates.use', $this->appearance), ['event' => $this->event->id])
        ->assertSessionHasNoErrors();
    $uses = GadEventCertificate::query()->with('design')->get();
    expect($uses->map(fn (GadEventCertificate $use) => $use->design->kind->value)->sort()->values()->all())->toBe(['appearance', 'participation']);

    // Released from either page: both go, to everyone present every day.
    $appearanceUse = $uses->firstWhere('certificate_design_id', $this->appearance->id);
    $this->actingAs($this->focal)->get(route('settings.event-certificates.show', $appearanceUse))
        ->assertInertia(fn (Assert $page) => $page->where('together', ['Certificate of Participation']));
    $this->actingAs($this->focal)->post(route('settings.event-certificates.release', $appearanceUse))->assertSessionHasNoErrors();
    expect(Certificate::query()->where('user_id', $everyDay->id)->count())->toBe(2)
        ->and(GadEventCertificate::query()->whereNull('released_at')->exists())->toBeFalse()
        ->and(Notification::query()->where('kind', NotificationKind::CertificateReleased)->where('user_id', $everyDay->id)->count())->toBe(2);

    // Before release, taking one off takes its pair with it.
    $other = certificateEvent('Second forum', $this->xii);
    $this->actingAs($this->focal)->post(route('settings.certificates.use', $participation), ['event' => $other->id])->assertSessionHasNoErrors();
    expect($other->certificates()->count())->toBe(2);
    $this->actingAs($this->focal)->delete(route('settings.event-certificates.destroy', $other->certificates()->where('certificate_design_id', $participation->id)->sole()))
        ->assertRedirect();
    expect($other->certificates()->count())->toBe(0);
});

test('an event that gives the other kind already keeps it when the pair is used', function () {
    $this->actingAs($this->focal)->post(route('settings.certificates.pair', $this->appearance));
    $participation = CertificateDesign::query()->where('paired_with_id', $this->appearance->id)->sole();
    $own = certificateDesign($this->xii, [certificateSignatory($this->xii, 'Jose Cruz')], attributes: ['name' => 'Its own participation']);
    GadEventCertificate::query()->create(['gad_event_id' => $this->event->id, 'certificate_design_id' => $own->id]);

    $this->actingAs($this->focal)->post(route('settings.certificates.use', $this->appearance), ['event' => $this->event->id])
        ->assertSessionHasNoErrors();

    expect($this->event->certificates()->pluck('certificate_design_id')->sort()->values()->all())
        ->toBe(collect([$own->id, $this->appearance->id])->sort()->values()->all())
        ->and($this->event->certificates()->where('certificate_design_id', $participation->id)->exists())->toBeFalse();
});
