<?php

use App\Models\CertificateSignatory;
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

/** @return array<string, mixed> */
function signatoryPayload(array $overrides = []): array
{
    return [
        'name' => 'Dr. Maria Santos',
        'position' => 'Regional Director',
        'signature' => UploadedFile::fake()->image('signature.png', 600, 200),
        'consent' => '1',
        ...$overrides,
    ];
}

test('a CHED Focal adds their region\'s signatory, with the e-signature kept privately', function () {
    $focal = certificateStaff('ched-focal', $this->xii);

    $this->actingAs($focal)
        ->post(route('settings.certificate-signatories.store'), signatoryPayload(['region' => $this->ix->id]))
        ->assertRedirect(route('settings.certificate-signatories.index'));

    $signatory = CertificateSignatory::query()->sole();
    // A regional office's signatory is always its own region's.
    expect($signatory->survey_region_id)->toBe($this->xii->id)
        ->and($signatory->name)->toBe('Dr. Maria Santos')
        ->and($signatory->signature_path)->toStartWith('signatures/');
    Storage::disk('certificates')->assertExists($signatory->signature_path);
    $this->assertDatabaseHas('activity_logs', ['subject_type' => 'certificate-signatory', 'action' => 'created']);
});

test('the e-signature needs the signatory\'s consent and a picture that prints', function () {
    $focal = certificateStaff('ched-focal', $this->xii);

    $this->actingAs($focal)
        ->post(route('settings.certificate-signatories.store'), signatoryPayload(['consent' => null]))
        ->assertSessionHasErrors('consent');
    $this->actingAs($focal)
        ->post(route('settings.certificate-signatories.store'), signatoryPayload(['signature' => UploadedFile::fake()->create('signature.svg', 10, 'image/svg+xml')]))
        ->assertSessionHasErrors('signature');
    $this->actingAs($focal)
        ->post(route('settings.certificate-signatories.store'), signatoryPayload(['signature' => UploadedFile::fake()->image('tiny.png', 100, 40)]))
        ->assertSessionHasErrors('signature');
    $this->actingAs($focal)
        ->post(route('settings.certificate-signatories.store'), signatoryPayload(['signature' => null]))
        ->assertSessionHasErrors('signature');

    expect(CertificateSignatory::query()->count())->toBe(0);
});

test('staff see and change only their own office\'s signatories', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $ours = certificateSignatory($this->xii, 'Our Director');
    $theirs = certificateSignatory($this->ix, 'Their Director');
    $national = certificateSignatory(null, 'The Chairperson');

    $this->actingAs($focal)->get(route('settings.certificate-signatories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/certificate-signatories')
            ->has('signatories.data', 1)
            ->where('signatories.data.0.name', 'Our Director')
            ->where('signatories.data.0.can.update', true));

    $this->actingAs($focal)
        ->put(route('settings.certificate-signatories.update', $theirs), ['name' => 'Changed', 'position' => 'Changed'])
        ->assertForbidden();
    $this->actingAs($focal)->delete(route('settings.certificate-signatories.destroy', $national))->assertForbidden();

    $admin = certificateStaff('admin');
    $this->actingAs($admin)->get(route('settings.certificate-signatories.index'))
        ->assertInertia(fn (Assert $page) => $page->has('signatories.data', 3));
    $this->actingAs($admin)->get(route('settings.certificate-signatories.index', ['region' => $this->ix->id]))
        ->assertInertia(fn (Assert $page) => $page->has('signatories.data', 1)->where('signatories.data.0.name', 'Their Director'));

    expect($ours->exists)->toBeTrue();
});

test('a new e-signature keeps the old file, which released certificates may print', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $signatory = certificateSignatory($this->xii);
    $old = $signatory->signature_path;

    $this->actingAs($focal)
        ->post(route('settings.certificate-signatories.update', $signatory), [
            '_method' => 'put',
            ...signatoryPayload(['name' => 'Dr. Maria Santos-Reyes']),
        ])
        ->assertRedirect();

    $signatory->refresh();
    expect($signatory->name)->toBe('Dr. Maria Santos-Reyes')
        ->and($signatory->signature_path)->not->toBe($old);
    Storage::disk('certificates')->assertExists($old);
    Storage::disk('certificates')->assertExists($signatory->signature_path);
});

test('a signatory on a design stays until taken off it, and removing one keeps the record', function () {
    $focal = certificateStaff('ched-focal', $this->xii);
    $signing = certificateSignatory($this->xii, 'Signing Director');
    certificateDesign($this->xii, [$signing]);
    $free = certificateSignatory($this->xii, 'Former Director');

    $this->actingAs($focal)->delete(route('settings.certificate-signatories.destroy', $signing))
        ->assertSessionHasErrors('signatory');
    // A design signs with its own office's people, so they can't move away.
    $this->actingAs(certificateStaff('admin'))
        ->put(route('settings.certificate-signatories.update', $signing), ['name' => 'Signing Director', 'position' => 'Regional Director', 'region' => $this->ix->id])
        ->assertSessionHasErrors('region');

    $this->actingAs($focal)->delete(route('settings.certificate-signatories.destroy', $free))->assertRedirect();

    expect(CertificateSignatory::query()->whereKey($free->id)->exists())->toBeFalse()
        ->and(CertificateSignatory::withTrashed()->whereKey($free->id)->exists())->toBeTrue()
        ->and($signing->refresh()->survey_region_id)->toBe($this->xii->id);
    Storage::disk('certificates')->assertExists($free->signature_path);
});

test('only offices that give certificates open signatories', function () {
    foreach (['ched-employee', 'gad-focal-person', 'hei'] as $role) {
        $this->actingAs(certificateStaff($role, $this->xii))
            ->get(route('settings.certificate-signatories.index'))
            ->assertForbidden();
    }
});
