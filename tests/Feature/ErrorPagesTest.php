<?php

use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

test('a missing page gets the PHLGADIS error page, with the operator to contact', function () {
    $this->get('/no-such-page')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page
            ->component('error-page')
            ->where('status', 404)
            ->where('retryAfter', null)
            ->where('operator.email', config('phlgadis.operator.email')));
});

test('a page someone may not open gets the access page', function () {
    $hei = User::factory()->create(['survey_hei_id' => createSurveyHei()->id]);
    $hei->assignRole('hei');

    $this->actingAs($hei)->get(route('admin.carousels.index'))
        ->assertForbidden()
        ->assertInertia(fn (Assert $page) => $page->component('error-page')->where('status', 403));
});

test('a rate limit keeps telling the browser when to try again', function () {
    Route::get('test/too-many', fn () => abort(429, headers: ['Retry-After' => 42]));

    $this->get('/test/too-many')
        ->assertTooManyRequests()
        ->assertHeader('Retry-After', '42')
        ->assertInertia(fn (Assert $page) => $page->where('status', 429)->where('retryAfter', 42));
});

test('JSON callers keep Laravel JSON errors', function () {
    $this->getJson('/no-such-page')
        ->assertNotFound()
        ->assertJsonStructure(['message']);
});

test('an expired form goes back to itself with a toast instead of an error page', function () {
    Route::post('test/expired', fn () => abort(419));

    $this->from('/settings/profile')
        ->withHeader('X-Inertia', 'true')
        ->post('/test/expired')
        ->assertRedirect('/settings/profile')
        ->assertSessionHas('inertia.flash_data.toast.type', 'error');
});

test('a crash shows the error page only while debugging is off', function () {
    Route::get('test/crash', fn () => throw new RuntimeException('Boom'));

    config(['app.debug' => false]);
    $this->get('/test/crash')
        ->assertServerError()
        ->assertInertia(fn (Assert $page) => $page->component('error-page')->where('status', 500));

    config(['app.debug' => true]);
    $this->get('/test/crash')
        ->assertServerError()
        ->assertSee('Boom');
});
