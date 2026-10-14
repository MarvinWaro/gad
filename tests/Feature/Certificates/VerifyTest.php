<?php

use App\Actions\Certificates\ManageEventCertificate;
use App\Models\Certificate;
use App\Models\GadEventCertificate;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('certificates');
    CarbonImmutable::setTestNow('2026-10-15 01:00:00');
    $region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $focal = certificateStaff('ched-focal', $region);
    $event = certificateEvent('GAD Orientation', $region);
    $guest = certificateGuest($region, ['name' => 'Ana Reyes', 'email' => 'ana@example.test']);
    attendEveryDay($event, $guest);
    $use = GadEventCertificate::query()->create([
        'gad_event_id' => $event->id,
        'certificate_design_id' => certificateDesign($region, [certificateSignatory($region)])->id,
    ]);
    app(ManageEventCertificate::class)->release($focal, $use);
    $this->certificate = Certificate::query()->sole();
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('anyone with the number sees that the certificate stands, and nothing private', function () {
    $this->get(route('verify.show', $this->certificate->number))
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $page) => $page
            ->component('certificates/verify')
            ->where('certificate.status', 'valid')
            ->where('certificate.name', 'ANA REYES')
            ->where('certificate.title', 'Certificate of Participation')
            ->where('certificate.event.title', 'GAD Orientation')
            ->where('certificate.office', 'CHED Regional Office XII')
            ->where('certificate.issued_on', '2026-10-15')
            ->missing('certificate.email')
            ->missing('certificate.user_id')
            ->missing('certificate.id'));
});

test('a number typed loosely still finds it', function () {
    $loose = strtolower(str_replace('-', ' ', $this->certificate->number));

    $this->get(route('verify.show', $loose))
        ->assertInertia(fn (Assert $page) => $page
            ->where('number', $this->certificate->number)
            ->where('certificate.status', 'valid'));
});

test('a withdrawn certificate says so, and an unknown number finds nothing', function () {
    $this->certificate->update(['withdrawn_at' => now()]);

    $this->get(route('verify.show', $this->certificate->number))
        ->assertInertia(fn (Assert $page) => $page
            ->where('certificate.status', 'withdrawn')
            ->where('certificate.withdrawn_on', '2026-10-15'));
    $this->get(route('verify.show', 'CERT-0000-0000'))
        ->assertInertia(fn (Assert $page) => $page->where('certificate', null));
    $this->get(route('verify.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('number', null)->where('certificate', null));
});

test('the verify page is throttled', function () {
    foreach (range(1, 30) as $attempt) {
        $this->get(route('verify.show', 'CERT-0000-0000'))->assertOk();
    }

    $this->get(route('verify.show', 'CERT-0000-0000'))->assertTooManyRequests();
});
