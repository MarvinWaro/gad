<?php

use App\Enums\CertificateKind;
use App\Models\CertificateDesign;
use App\Models\GadEventCertificate;
use App\Models\SurveyRegion;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('certificates');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->ix = SurveyRegion::query()->create(['name' => 'Regional Office IX', 'is_active' => true]);
});

/**
 * @param  list<string>  $signatories
 * @return array<string, mixed>
 */
function designPayload(array $signatories, array $overrides = []): array
{
    return [
        'kind' => 'participation',
        'name' => 'GAD Orientation 2026',
        'background' => 'flow',
        'body' => 'for participating in the {event} held on {dates} at {venue}.',
        'signatories' => $signatories,
        ...$overrides,
    ];
}

test('a CHED Focal makes a design signed by their own office, with logos', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $director = certificateSignatory($this->xii, 'Regional Director');
    $chief = certificateSignatory($this->xii, 'Chief Education Program Specialist');

    $response = $this->actingAs($focal)->post(route('settings.certificates.store'), designPayload([$chief->id, $director->id], [
        'new_logos' => [UploadedFile::fake()->image('partner.png', 200, 200)],
    ]));

    $design = CertificateDesign::query()->sole();
    $response->assertRedirect(route('settings.certificates.show', $design));
    expect($design->survey_region_id)->toBe($this->xii->id)
        ->and($design->kind)->toBe(CertificateKind::Participation)
        ->and($design->signatories()->pluck('name')->all())->toBe(['Chief Education Program Specialist', 'Regional Director'])
        ->and($design->logo_paths)->toHaveCount(1);
    Storage::disk('certificates')->assertExists($design->logo_paths[0]);

    $this->actingAs($focal)->get(route('settings.certificates.show', $design))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/certificate')
            ->where('design.name', 'GAD Orientation 2026')
            ->has('design.signatories', 2)
            ->has('design.logos', 1)
            ->has('kinds', 2)
            ->where('backgrounds', CertificateDesign::BACKGROUNDS)
            ->has('signatories', 2));
});

test('the wording uses only the blanks certificates fill in', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $signatory = certificateSignatory($this->xii);

    $this->actingAs($focal)
        ->post(route('settings.certificates.store'), designPayload([$signatory->id], ['body' => 'for joining {event} at {place}.']))
        ->assertSessionHasErrors('body');
    $this->actingAs($focal)
        ->post(route('settings.certificates.store'), designPayload([$signatory->id], ['background' => 'gold']))
        ->assertSessionHasErrors('background');

    expect(CertificateDesign::query()->count())->toBe(0);
});

test('a design signs with one to three of its own office\'s signatories, and up to three logos', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $ours = collect(range(1, 4))->map(fn (int $number) => certificateSignatory($this->xii, "Signatory {$number}"));
    $theirs = certificateSignatory($this->ix, 'Another office\'s director');

    $this->actingAs($focal)->post(route('settings.certificates.store'), designPayload([]))
        ->assertSessionHasErrors('signatories');
    $this->actingAs($focal)->post(route('settings.certificates.store'), designPayload($ours->pluck('id')->all()))
        ->assertSessionHasErrors('signatories');
    $this->actingAs($focal)->post(route('settings.certificates.store'), designPayload([$ours[0]->id, $theirs->id]))
        ->assertSessionHasErrors('signatories');
    $this->actingAs($focal)->post(route('settings.certificates.store'), designPayload([$ours[0]->id], [
        'new_logos' => array_map(fn () => UploadedFile::fake()->image('logo.png', 100, 100), range(1, 4)),
    ]))->assertSessionHasErrors('new_logos');

    expect(CertificateDesign::query()->count())->toBe(0);
});

test('editing keeps the logos chosen, in order, and adds new ones after them', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $signatory = certificateSignatory($this->xii);
    $first = UploadedFile::fake()->image('first.png', 100, 100)->store('logos', 'certificates');
    $second = UploadedFile::fake()->image('second.png', 100, 100)->store('logos', 'certificates');
    $design = certificateDesign($this->xii, [$signatory], attributes: ['logo_paths' => [$first, $second]]);

    $this->actingAs($focal)
        ->post(route('settings.certificates.update', $design), [
            '_method' => 'put',
            ...designPayload([$signatory->id], [
                'name' => 'Renamed design',
                'kept_logos' => [basename($second)],
                'new_logos' => [UploadedFile::fake()->image('third.png', 100, 100)],
            ]),
        ])
        ->assertSessionDoesntHaveErrors();

    $design->refresh();
    expect($design->name)->toBe('Renamed design')
        ->and($design->logo_paths)->toHaveCount(2)
        ->and($design->logo_paths[0])->toBe($second);
    // Released certificates may print the one taken off.
    Storage::disk('certificates')->assertExists($first);
});

test('once used on an event a design keeps its kind and office, and once released it stays', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $signatory = certificateSignatory($this->xii);
    $design = certificateDesign($this->xii, [$signatory]);
    $use = GadEventCertificate::query()->create([
        'gad_event_id' => certificateEvent('Writeshop', $this->xii)->id,
        'certificate_design_id' => $design->id,
    ]);

    $this->actingAs($focal)
        ->put(route('settings.certificates.update', $design), designPayload([$signatory->id], ['kind' => 'appearance']))
        ->assertSessionHasErrors('kind');

    $use->update(['released_at' => now()]);
    $this->actingAs($focal)->delete(route('settings.certificates.destroy', $design))
        ->assertSessionHasErrors('design');
    expect($design->fresh())->not->toBeNull();
});

test('a design waiting on an event can be deleted, and a copy keeps everything but the name', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $signatory = certificateSignatory($this->xii);
    $design = certificateDesign($this->xii, [$signatory], CertificateKind::Appearance);
    GadEventCertificate::query()->create([
        'gad_event_id' => certificateEvent('Writeshop', $this->xii)->id,
        'certificate_design_id' => $design->id,
    ]);

    $this->actingAs($focal)->post(route('settings.certificates.duplicate', $design))->assertRedirect();
    $copy = CertificateDesign::query()->whereKeyNot($design->id)->sole();
    expect($copy->name)->toBe('Copy of Certificate of Appearance design')
        ->and($copy->kind)->toBe(CertificateKind::Appearance)
        ->and($copy->signatories()->pluck('certificate_signatories.id')->all())->toBe([$signatory->id]);

    $this->actingAs($focal)->delete(route('settings.certificates.destroy', $design))
        ->assertRedirect(route('settings.certificates.index'));
    expect($design->fresh())->toBeNull()
        ->and(GadEventCertificate::query()->count())->toBe(0);
});

test('staff list and open only their own office\'s designs', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    certificateDesign($this->xii, [certificateSignatory($this->xii)], attributes: ['name' => 'Ours']);
    $theirs = certificateDesign($this->ix, [certificateSignatory($this->ix)], attributes: ['name' => 'Theirs']);
    $national = certificateDesign(null, [certificateSignatory(null)], attributes: ['name' => 'National']);

    $this->actingAs($focal)->get(route('settings.certificates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/certificates')
            ->has('designs.data', 1)
            ->where('designs.data.0.name', 'Ours'));
    $this->actingAs($focal)->get(route('settings.certificates.show', $theirs))->assertForbidden();
    $this->actingAs($focal)->get(route('settings.certificates.show', $national))->assertForbidden();

    $this->actingAs(certificateStaff('admin'))->get(route('settings.certificates.index'))
        ->assertInertia(fn (Assert $page) => $page->has('designs.data', 3));
    $this->actingAs(certificateStaff('ched-employee', $this->xii))->get(route('settings.certificates.index'))
        ->assertForbidden();
});
