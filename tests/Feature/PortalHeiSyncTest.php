<?php

use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\PortalHeiSync;
use App\Services\PortalService;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveyDirectorySeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class, SurveyDirectorySeeder::class]);
    config()->set('services.portal.key', 'test-key');
    config()->set('services.portal.base_url', 'https://portal.example.test/api');
    Cache::flush();

    // Http::fake() merges stubs and the first match wins, so register one stub
    // that reads whatever the current test last asked the portal to return.
    $GLOBALS['portal_response'] = Http::response([]);
    Http::fake(['*/fetch-all-hei' => fn () => $GLOBALS['portal_response']]);
});

function portalRow(string $code, string $name, ?string $province): array
{
    return [
        'instCode' => $code,
        'instName' => $name,
        'province' => $province,
        'instOwnership' => 'Private',
        'municipalityCity' => 'Koronadal City',
        'status' => 'Active',
        'ownershipSector' => 'Private',
        'ownershipHei_type' => 'HEI',
    ];
}

function portalReturns(array $rows): void
{
    $GLOBALS['portal_response'] = Http::response($rows);
}

function portalFails(int $status = 502): void
{
    $GLOBALS['portal_response'] = Http::response('gateway down', $status);
}

test('the sync sends the portal key and files institutions under their province', function () {
    portalReturns([
        portalRow('12001', 'Notre Dame of Marbel University', 'South Cotabato'),
        portalRow('12002', 'Sultan Kudarat State University', 'Sultan Kudarat'),
        portalRow('12003', 'Cotabato Foundation College', 'Cotabato'),
    ]);

    $result = app(PortalHeiSync::class)->sync();

    Http::assertSent(fn ($request) => $request->hasHeader('PORTAL-API', 'test-key')
        && $request->url() === 'https://portal.example.test/api/fetch-all-hei');

    expect($result['created'])->toBe(3)
        ->and($result['total'])->toBe(3)
        ->and(SurveyHei::query()->where('name', 'Notre Dame of Marbel University')->sole()->cluster->name)
        ->toBe('South Cotabato')
        // "Cotabato" is aliased onto the seeded cluster rather than duplicating it.
        ->and(SurveyHei::query()->where('name', 'Cotabato Foundation College')->sole()->cluster->name)
        ->toBe('Province of Cotabato')
        ->and($result['clusters_created'])->toBe([]);
});

test('an unrecognised province becomes a new cluster under Region XII and is reported', function () {
    portalReturns([portalRow('12010', 'Davao Doctors College', 'Davao del Sur')]);

    $result = app(PortalHeiSync::class)->sync();

    expect($result['clusters_created'])->toBe(['Davao del Sur'])
        ->and(SurveyHei::query()->sole()->cluster->name)->toBe('Davao del Sur')
        ->and(SurveyCluster::query()->where('name', 'Davao del Sur')->sole()->survey_region_id)
        ->toBe(SurveyRegion::query()->where('name', 'Region XII')->sole()->id);
});

test('an institution with no province lands in Unassigned rather than being dropped', function () {
    portalReturns([portalRow('12011', 'Province Missing College', null)]);

    app(PortalHeiSync::class)->sync();

    expect(SurveyHei::query()->sole()->cluster->name)->toBe('Unassigned');
});

test('re-syncing is idempotent and tracks renames by institution code', function () {
    portalReturns([portalRow('12001', 'Notre Dame of Marbel', 'South Cotabato')]);
    app(PortalHeiSync::class)->sync();
    $id = SurveyHei::query()->sole()->id;

    portalReturns([portalRow('12001', 'Notre Dame of Marbel University', 'South Cotabato')]);
    $result = app(PortalHeiSync::class)->sync();

    expect(SurveyHei::query()->count())->toBe(1)
        ->and(SurveyHei::query()->sole()->id)->toBe($id)
        ->and(SurveyHei::query()->sole()->name)->toBe('Notre Dame of Marbel University')
        ->and($result['created'])->toBe(0)
        ->and($result['updated'])->toBe(1);
});

test('an institution moved to another province keeps its row and its responses', function () {
    portalReturns([portalRow('12001', 'Moving University', 'South Cotabato')]);
    app(PortalHeiSync::class)->sync();
    $id = SurveyHei::query()->sole()->id;

    portalReturns([portalRow('12001', 'Moving University', 'Sarangani')]);
    app(PortalHeiSync::class)->sync();

    expect(SurveyHei::query()->count())->toBe(1)
        ->and(SurveyHei::query()->sole()->id)->toBe($id)
        ->and(SurveyHei::query()->sole()->cluster->name)->toBe('Sarangani');
});

test('institutions the portal drops are deactivated, never deleted', function () {
    portalReturns([
        portalRow('12001', 'Kept University', 'South Cotabato'),
        portalRow('12002', 'Dropped College', 'South Cotabato'),
    ]);
    app(PortalHeiSync::class)->sync();

    portalReturns([portalRow('12001', 'Kept University', 'South Cotabato')]);
    $result = app(PortalHeiSync::class)->sync();

    expect($result['deactivated'])->toBe(1)
        ->and(SurveyHei::query()->count())->toBe(2)
        ->and(SurveyHei::query()->where('name', 'Dropped College')->sole()->is_active)->toBeFalse()
        ->and(SurveyHei::query()->where('name', 'Kept University')->sole()->is_active)->toBeTrue();
});

test('an institution the portal restores is reactivated rather than duplicated', function () {
    portalReturns([portalRow('12001', 'Blinking University', 'South Cotabato')]);
    app(PortalHeiSync::class)->sync();
    portalReturns([]);
    app(PortalHeiSync::class)->sync();

    portalReturns([portalRow('12001', 'Blinking University', 'South Cotabato')]);
    $result = app(PortalHeiSync::class)->sync();

    expect($result['reactivated'])->toBe(1)
        ->and(SurveyHei::query()->count())->toBe(1)
        ->and(SurveyHei::query()->sole()->is_active)->toBeTrue();
});

test('two institutions sharing a name in one province both survive the unique index', function () {
    portalReturns([
        portalRow('12001', 'STI College', 'South Cotabato'),
        portalRow('12002', 'STI College', 'South Cotabato'),
    ]);

    $result = app(PortalHeiSync::class)->sync();

    expect($result['created'])->toBe(2)
        ->and(SurveyHei::query()->pluck('name')->sort()->values()->all())
        ->toBe(['STI College', 'STI College (2)']);
});

test('a hand-entered institution with responses survives the sync', function () {
    $region = SurveyRegion::query()->sole();
    $cluster = SurveyCluster::query()->where('name', 'South Cotabato')->sole();
    $manual = SurveyHei::query()->create([
        'survey_cluster_id' => $cluster->id, 'name' => 'Hand Entered HEI', 'is_active' => true,
    ]);
    $draft = Survey::query()->where('slug', 'ra-7877')->sole()->draftVersion();
    $draft->update(['retention_days' => 365, 'status' => 'published', 'published_at' => now()]);
    SurveyResponse::query()->create([
        'survey_version_id' => $draft->id, 'public_reference' => 'RA7877-KEEPME001',
        'age' => 22, 'sex' => 'female', 'respondent_group' => 'student',
        'survey_region_id' => $region->id, 'survey_cluster_id' => $cluster->id,
        'survey_hei_id' => $manual->id, 'answers' => ['experiences' => ['none']],
        'consent_at' => now(), 'expires_at' => now()->addDays(365),
    ]);

    portalReturns([portalRow('12001', 'Portal University', 'South Cotabato')]);
    app(PortalHeiSync::class)->sync();

    // Deactivated so it leaves the public dropdown, but the row and its
    // response are intact because survey_hei_id restricts deletion.
    expect($manual->refresh()->is_active)->toBeFalse()
        ->and(SurveyResponse::query()->sole()->survey_hei_id)->toBe($manual->id);
});

test('a portal outage aborts the sync instead of emptying the directory', function () {
    portalReturns([portalRow('12001', 'Kept University', 'South Cotabato')]);
    app(PortalHeiSync::class)->sync();

    portalFails();

    expect(fn () => app(PortalHeiSync::class)->sync())->toThrow(RuntimeException::class);
    expect(SurveyHei::query()->where('is_active', true)->count())->toBe(1);
});

test('a malformed portal payload is rejected rather than stored', function () {
    portalReturns([['instName' => 'No code here']]);

    expect(fn () => app(PortalHeiSync::class)->sync())->toThrow(RuntimeException::class);
    expect(SurveyHei::query()->count())->toBe(0);
});

test('the sync is unavailable until the portal credentials are configured', function () {
    config()->set('services.portal.key', null);

    expect(app(PortalService::class)->isConfigured())->toBeFalse();
    expect(fn () => app(PortalHeiSync::class)->sync())->toThrow(RuntimeException::class);
});

test('only directory managers can trigger a sync from settings', function () {
    portalReturns([portalRow('12001', 'Portal University', 'South Cotabato')]);
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $focal = User::factory()->create();
    $focal->assignRole('gad-focal-person');

    $this->actingAs($focal)->post(route('settings.survey-directories.sync'))->assertForbidden();
    $this->actingAs($admin)->post(route('settings.survey-directories.sync'))->assertRedirect();

    expect(SurveyHei::query()->where('uii', '12001')->exists())->toBeTrue();

    $this->actingAs($admin)->get(route('settings.survey-directories.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('portal.configured', true)
            ->where('portal.synced_count', 1)
            ->has('portal.last_synced_at'));
});

test('a failed sync from settings surfaces the reason instead of a blank page', function () {
    portalFails();
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->post(route('settings.survey-directories.sync'))
        ->assertRedirect()
        ->assertSessionHasErrors('portal');
});

test('the artisan command reports what it changed', function () {
    portalReturns([
        portalRow('12001', 'Notre Dame of Marbel University', 'South Cotabato'),
        portalRow('12002', 'Davao Doctors College', 'Davao del Sur'),
    ]);

    $this->artisan('surveys:sync-heis')
        ->expectsOutputToContain('Fetched 2 institutions from the portal.')
        ->expectsOutputToContain('New clusters created from portal provinces: Davao del Sur')
        ->assertSuccessful();
});

test('the artisan command fails loudly when the portal is unreachable', function () {
    portalFails(500);

    $this->artisan('surveys:sync-heis')->assertFailed();
});
