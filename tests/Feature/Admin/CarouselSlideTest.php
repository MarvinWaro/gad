<?php

use App\Models\CarouselSlide;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

function userWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('carousel administration requires authentication and view permission', function () {
    $this->get(route('admin.carousels.index'))->assertRedirect(route('login'));

    $user = User::factory()->create();
    $this->actingAs($user)
        ->get(route('admin.carousels.index'))
        ->assertForbidden();

    $hei = userWithRole('hei');
    $this->actingAs($hei)
        ->get(route('admin.carousels.index'))
        ->assertForbidden();

    $focal = userWithRole('gad-focal-person');
    $this->actingAs($focal)
        ->get(route('admin.carousels.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/carousels/index')
            ->where('permissions.create', true)
            ->where('permissions.update', true)
            ->where('permissions.delete', false));
});

test('role permissions follow the initial access matrix', function () {
    $admin = userWithRole('admin');
    $focal = userWithRole('gad-focal-person');
    $hei = userWithRole('hei');

    expect($admin->can('carousel.view'))->toBeTrue()
        ->and($admin->can('carousel.create'))->toBeTrue()
        ->and($admin->can('carousel.update'))->toBeTrue()
        ->and($admin->can('carousel.delete'))->toBeTrue()
        ->and($focal->can('carousel.view'))->toBeTrue()
        ->and($focal->can('carousel.create'))->toBeTrue()
        ->and($focal->can('carousel.update'))->toBeTrue()
        ->and($focal->can('carousel.delete'))->toBeFalse()
        ->and($hei->can('carousel.view'))->toBeFalse()
        ->and($hei->can('carousel.create'))->toBeFalse();
});

test('authorized users can create and update slides with validated images', function () {
    Storage::fake('public');
    $focal = userWithRole('gad-focal-person');

    $this->actingAs($focal)
        ->post(route('admin.carousels.store'), [
            'title' => 'Inclusive campuses',
            'image' => UploadedFile::fake()->image('campus.jpg', 1200, 500),
            'link' => 'https://ched.gov.ph/example',
            'is_active' => true,
            'sort_order' => 2,
        ])
        ->assertRedirect(route('admin.carousels.index'));

    $slide = CarouselSlide::query()->sole();
    Storage::disk('public')->assertExists($slide->image_path);
    expect($slide->created_by)->toBe($focal->id)
        ->and($slide->description)->toBeNull()
        ->and($slide->alt_text)->toBe('Inclusive campuses')
        ->and($slide->is_active)->toBeTrue()
        ->and($slide->sort_order)->toBe(2);

    $oldPath = $slide->image_path;
    $this->actingAs($focal)
        ->put(route('admin.carousels.update', $slide), [
            'title' => 'Inclusive campuses updated',
            'description' => 'Updated featured content for the landing page.',
            'image' => UploadedFile::fake()->image('updated.webp', 1400, 600),
            'link' => null,
            'is_active' => false,
            'sort_order' => 4,
        ])
        ->assertRedirect(route('admin.carousels.index'));

    $slide->refresh();
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($slide->image_path);
    expect($slide->title)->toBe('Inclusive campuses updated')
        ->and($slide->description)->toBe('Updated featured content for the landing page.')
        ->and($slide->alt_text)->toBe('Inclusive campuses updated')
        ->and($slide->is_active)->toBeFalse()
        ->and($slide->sort_order)->toBe(4);
});

test('HEI users cannot mutate slides and focal users cannot delete them', function () {
    Storage::fake('public');
    $slide = CarouselSlide::factory()->create();
    $hei = userWithRole('hei');
    $focal = userWithRole('gad-focal-person');

    $payload = [
        'title' => 'Restricted change',
        'description' => 'This request must not be authorized.',
        'image' => UploadedFile::fake()->image('blocked.jpg', 1200, 500),
        'link' => null,
        'is_active' => true,
        'sort_order' => 0,
    ];

    $this->actingAs($hei)
        ->post(route('admin.carousels.store'), $payload)
        ->assertForbidden();
    $this->actingAs($hei)
        ->put(route('admin.carousels.update', $slide), $payload)
        ->assertForbidden();
    $this->actingAs($hei)
        ->delete(route('admin.carousels.destroy', $slide))
        ->assertForbidden();
    $this->actingAs($focal)
        ->delete(route('admin.carousels.destroy', $slide))
        ->assertForbidden();

    expect($slide->fresh())->not->toBeNull();
});

test('administrators can delete a slide and its stored image', function () {
    Storage::fake('public');
    Storage::disk('public')->put('carousel/remove.jpg', 'image');
    $slide = CarouselSlide::factory()->create([
        'image_path' => 'carousel/remove.jpg',
    ]);
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->delete(route('admin.carousels.destroy', $slide))
        ->assertRedirect(route('admin.carousels.index'));

    $this->assertDatabaseMissing('carousel_slides', ['id' => $slide->id]);
    Storage::disk('public')->assertMissing('carousel/remove.jpg');
});

test('public homepage receives only active slides in display order', function () {
    CarouselSlide::factory()->create([
        'title' => 'Second slide',
        'description' => null,
        'sort_order' => 20,
    ]);
    CarouselSlide::factory()->create([
        'title' => 'First slide',
        'description' => 'First slide details.',
        'link' => 'https://ched.gov.ph/first-slide',
        'sort_order' => 10,
    ]);
    CarouselSlide::factory()->inactive()->create([
        'title' => 'Hidden slide',
        'sort_order' => 0,
    ]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->has('carouselSlides', 2)
            ->where('carouselSlides.0.title', 'First slide')
            ->where('carouselSlides.0.description', 'First slide details.')
            ->where('carouselSlides.0.href', 'https://ched.gov.ph/first-slide')
            ->where('carouselSlides.0.media.alt', 'First slide')
            ->where('carouselSlides.1.title', 'Second slide')
            ->where('carouselSlides.1.description', null)
            ->where('carouselSlides.1.media.alt', 'Second slide'));
});

test('carousel image dimensions are validated', function () {
    Storage::fake('public');
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->post(route('admin.carousels.store'), [
            'title' => 'Small image',
            'description' => 'This image is too small for the homepage hero.',
            'image' => UploadedFile::fake()->image('small.jpg', 400, 200),
            'link' => null,
            'is_active' => true,
            'sort_order' => 0,
        ])
        ->assertSessionHasErrors('image');

    $this->assertDatabaseEmpty('carousel_slides');
});
