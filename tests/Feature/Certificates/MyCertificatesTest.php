<?php

use App\Actions\Certificates\ManageEventCertificate;
use App\Models\Certificate;
use App\Models\GadEventCertificate;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\CertificateNumber;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use League\Flysystem\UnableToCheckFileExistence;

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

test('My certificates also lists the events you joined, how each went, and whether it gave you a certificate', function () {
    $later = certificateEvent('Later forum', $this->xii, '2026-10-20 08:00:00', '2026-10-20 17:00:00');
    $today = certificateEvent('Today\'s meeting', $this->xii, '2026-10-15 08:00:00', '2026-10-15 17:00:00', 'meeting');
    $missed = certificateEvent('Missed writeshop', null, '2026-10-10 08:00:00', '2026-10-10 17:00:00');
    foreach ([$later, $today, $missed] as $event) {
        joinEvent($event, $this->guest);
    }
    joinEvent($later, certificateGuest($this->xii));

    $this->actingAs($this->guest)->get(route('my-certificates.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('events.data', fn ($events) => collect($events)->map(fn (array $joined): array => [
                $joined['event']['title'], $joined['status'], $joined['days_attended'], $joined['has_certificate'],
            ])->all() === [
                ['Later forum', 'upcoming', 0, false],
                ['Today\'s meeting', 'ongoing', 0, false],
                ['GAD Orientation', 'attended', 2, true],
                ['Missed writeshop', 'missed', 0, false],
            ])
            ->where('events.data.0.event.ulid', $later->ulid)
            ->where('events.data.0.event.region', 'Regional Office XII')
            ->where('events.data.3.event.region', null)
            ->where('events.meta.total', 4));

    // A withdrawn certificate no longer counts.
    $this->certificate->update(['withdrawn_at' => now()]);
    $this->actingAs($this->guest)->get(route('my-certificates.index'))
        ->assertInertia(fn (Assert $page) => $page->where('events.data.2.has_certificate', false));
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

    // The verify QR's modules: square rows of 0s and 1s, at level M.
    $qr = $response->json('qr');
    expect($qr)->toBe(CertificateNumber::qrRows(route('verify.show', $this->certificate->number)))
        ->and(count($qr))->toBeGreaterThanOrEqual(21)->toBeLessThanOrEqual(41)
        ->and(collect($qr)->every(fn (string $row): bool => strlen($row) === count($qr) && preg_match('/^[01]+$/', $row) === 1))->toBeTrue();

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

test('a file its storage can no longer reach is not found, not a server error', function () {
    $path = $this->use->snapshot['signatories'][0]['signature_path'];
    [$folder, $file] = explode('/', $path);
    $link = URL::temporarySignedRoute('certificate-files.show', now()->addMinutes(120), ['folder' => $folder, 'file' => $file]);
    // As when the bucket it was kept in was removed.
    $disk = Mockery::mock(FilesystemAdapter::class);
    $disk->shouldReceive('exists')->andThrow(UnableToCheckFileExistence::forLocation($path));
    Storage::set('certificates', $disk);

    $this->actingAs($this->guest)->get($link)->assertNotFound();
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
