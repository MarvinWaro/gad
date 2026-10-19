<?php

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

/*
 * The public /hei page's HEIDA browser (/api/regions, /api/heis). HEIDA is
 * never called from tests: the fake answers like its public endpoints.
 */
beforeEach(function () {
    config()->set('services.heida.url', 'https://heida.example.test');
    // A test sets this to have HEIDA fail.
    $this->heidaDown = false;

    Http::fake([
        'heida.example.test/*' => fn () => $this->heidaDown ? Http::response(['message' => 'Server Error'], 500) : null,
        'heida.example.test/api/regions*' => Http::response([
            'data' => [['id' => 12, 'code' => '1200000000', 'name' => 'Region XII (SOCCSKSARGEN)']],
        ]),
        'heida.example.test/api/heis*' => Http::response([
            'data' => [[
                'id' => 7,
                'code' => '12001',
                'name' => 'Sample State University',
                'abbreviation' => 'SSU',
                'hei_type' => 'SUC',
                'status' => 'Active',
                'region' => ['id' => 12, 'code' => '1200000000', 'name' => 'Region XII'],
                'province' => ['name' => 'South Cotabato'],
                'city_municipality' => ['name' => 'Koronadal'],
                'barangay' => null,
            ]],
            'meta' => ['current_page' => 1, 'last_page' => 3, 'per_page' => 25, 'total' => 51],
        ]),
    ]);
});

test('HEIs come back in the shape the /hei page reads', function () {
    $this->getJson('/api/heis?region_id=12&search=state')
        ->assertOk()
        ->assertExactJson([
            'data' => [[
                'id' => 7,
                'code' => '12001',
                'name' => 'Sample State University',
                'abbreviation' => 'SSU',
                'region_id' => 12,
                'region_code' => '1200000000',
                'region_name' => 'Region XII',
                'province' => 'South Cotabato',
                'city_municipality' => 'Koronadal',
                'barangay' => null,
                'address' => 'Koronadal, South Cotabato, Region XII',
                'hei_type' => 'SUC',
                'status' => 'Active',
            ]],
            'meta' => ['current_page' => 1, 'last_page' => 3, 'per_page' => 25, 'total' => 51],
        ]);

    Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/heis')
        && $request['per_page'] === 25 && $request['page'] === 1
        && $request['region_id'] === '12' && $request['search'] === 'state');
});

test('HEIDA is asked once for the same page, however many visitors ask', function () {
    $this->getJson('/api/heis?page=2')->assertOk();
    $this->getJson('/api/heis?page=2')->assertOk();
    $this->getJson('/api/regions')->assertOk()->assertJsonPath('data.0.name', 'Region XII (SOCCSKSARGEN)');
    $this->getJson('/api/regions')->assertOk();

    Http::assertSentCount(2);
});

test('a visitor cannot ask HEIDA for a huge page', function () {
    $this->getJson('/api/heis?per_page=500')->assertUnprocessable()->assertJsonValidationErrors('per_page');
    $this->getJson('/api/heis?page=0')->assertUnprocessable()->assertJsonValidationErrors('page');

    Http::assertNothingSent();
});

test('a HEIDA failure answers plainly, without its details, and is not kept', function () {
    $this->heidaDown = true;

    $this->getJson('/api/heis')
        ->assertStatus(502)
        ->assertExactJson(['message' => 'HEIDA could not be reached. Try again later.']);
    $this->getJson('/api/regions')->assertStatus(502);

    // Not cached: the next visit asks again.
    $this->getJson('/api/heis')->assertStatus(502);
    Http::assertSentCount(3);
});

test('the HEIDA browser is rate limited', function () {
    foreach (range(1, 60) as $ignored) {
        $this->getJson('/api/regions')->assertOk();
    }

    $this->getJson('/api/regions')->assertTooManyRequests();
});
