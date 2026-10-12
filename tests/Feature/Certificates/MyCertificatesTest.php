<?php

use App\Actions\Certificates\ManageEventCertificate;
use App\Models\Certificate;
use App\Models\GadEventCertificate;
use App\Models\SurveyRegion;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('certificates');
    CarbonImmutable::setTestNow('2026-10-15 01:00:00');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true, 'office_city' => 'Koronadal City']);
    $this->focal = certificateStaff('ched-focal', $this->xii);
    $this->event = certificateEvent('GAD Orientation', $this->xii);
    $this->guest = certificateGuest($this->xii, ['name' => 'Ana María Reyes']);
    certificateCheckIn($this->event, $this->guest, '2026-10-14');
    certificateCheckIn($this->event, $this->guest, '2026-10-15');
    $this->use = GadEventCertificate::query()->create([
        'gad_event_id' => $this->event->id,
        'certificate_design_id' => certificateDesign($this->xii, [certificateSignatory($this->xii)])->id,
    ]);
    app(ManageEventCertificate::class)->release($this->focal, $this->use);
    $this->certificate = Certificate::query()->sole();
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('My certificates lists your own released certificates', function () {
    $this->actingAs($this->guest)->get(route('my-certificates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/my-certificates')
            ->has('certificates.data', 1)
            ->where('certificates.data.0.number', $this->certificate->number)
            ->where('certificates.data.0.title', 'Certificate of Participation')
            ->where('certificates.data.0.event.title', 'GAD Orientation')
            ->where('certificates.data.0.office', 'CHED Regional Office XII')
            ->where('certificates.data.0.verify_url', route('verify.show', $this->certificate->number)));

    $this->actingAs(certificateGuest($this->xii))->get(route('my-certificates.index'))
        ->assertInertia(fn (Assert $page) => $page->has('certificates.data', 0));

    // A withdrawn certificate leaves the list.
    $this->certificate->update(['withdrawn_at' => now()]);
    $this->actingAs($this->guest)->get(route('my-certificates.index'))
        ->assertInertia(fn (Assert $page) => $page->has('certificates.data', 0));
});

test('the certificate\'s document prints the name in capitals, the days attended and signed links', function () {
    $response = $this->actingAs($this->guest)->getJson(route('certificates.document', $this->certificate))
        ->assertOk()
        ->assertJsonPath('name', 'ANA MARÍA REYES')
        ->assertJsonPath('title', 'Certificate of Participation')
        ->assertJsonPath('lead', 'is presented to')
        ->assertJsonPath('affiliation', 'Regional Office XII College')
        ->assertJsonPath('days', ['2026-10-14', '2026-10-15'])
        ->assertJsonPath('released_on', '2026-10-15')
        ->assertJsonPath('office.city', 'Koronadal City')
        ->assertJsonPath('event.title', 'GAD Orientation')
        ->assertJsonPath('verify_url', route('verify.show', $this->certificate->number))
        ->assertJsonMissingPath('user_id')
        ->assertJsonMissingPath('signatories.0.signature_path');

    $signature = $response->json('signatories.0.signature');
    expect($signature)->toContain('/certificate-files/signatures/')->toContain('signature=');
    $this->assertDatabaseHas('activity_logs', ['subject_type' => 'certificate', 'action' => 'downloaded']);

    // The signed link streams the file; without its signature it doesn't.
    $this->actingAs($this->guest)->get($signature)->assertOk();
    $this->actingAs($this->guest)->get(strtok($signature, '?'))->assertForbidden();
});

test('a signed link stops working after two hours', function () {
    $path = $this->use->snapshot['signatories'][0]['signature_path'];
    [$folder, $file] = explode('/', $path);
    $link = URL::temporarySignedRoute('certificate-files.show', now()->addMinutes(120), ['folder' => $folder, 'file' => $file]);

    $this->travel(121)->minutes();
    $this->actingAs($this->guest)->get($link)->assertForbidden();
});

test('only its holder, until withdrawn, and the staff who release it download a certificate', function () {
    $this->actingAs(certificateGuest($this->xii))->getJson(route('certificates.document', $this->certificate))->assertForbidden();
    $this->actingAs($this->focal)->getJson(route('certificates.document', $this->certificate))->assertOk();
    $this->actingAs(User::factory()->create())->getJson(route('certificates.document', $this->certificate))->assertForbidden();

    $this->certificate->update(['withdrawn_at' => now()]);
    $this->actingAs($this->guest)->getJson(route('certificates.document', $this->certificate))->assertForbidden();
});

test('the release notification opens My certificates', function () {
    $this->actingAs($this->guest)
        ->get(route('notifications.open', $this->guest->notifications()->sole()))
        ->assertRedirect(route('my-certificates.index'));
});
