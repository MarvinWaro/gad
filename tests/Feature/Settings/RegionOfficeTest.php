<?php

use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => false]);
});

test('directory managers keep a regional office\'s letterhead up to date', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->put(route('settings.regions.office', $this->region), [
        'office_city' => 'Koronadal City',
        'office_address' => 'PRIME Government Center, Koronadal',
        'office_email' => 'chedro12@ched.gov.ph',
        'office_website' => 'chedro12.gov.ph',
        'office_phone' => '(083) 228-7572',
    ])->assertSessionHasNoErrors();

    $region = $this->region->fresh();
    expect($region->office_city)->toBe('Koronadal City')
        ->and($region->office_email)->toBe('chedro12@ched.gov.ph')
        // The office's details leave its name and status alone.
        ->and($region->name)->toBe('Regional Office XII')
        ->and($region->is_active)->toBeFalse();

    $this->put(route('settings.regions.office', $this->region), ['office_email' => 'not an email', 'office_website' => 'no spaces allowed'])
        ->assertSessionHasErrors(['office_email', 'office_website']);

    $this->put(route('settings.regions.office', $this->region), ['office_city' => null])->assertSessionHasNoErrors();
    expect($this->region->fresh()->office_city)->toBeNull();
});

test('only directory managers change office details', function () {
    $hei = User::factory()->create();
    $hei->assignRole('hei');

    $this->actingAs($hei)
        ->put(route('settings.regions.office', $this->region), ['office_city' => 'Elsewhere'])
        ->assertForbidden();
});
