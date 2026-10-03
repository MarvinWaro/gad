<?php

use App\Jobs\SyncHeidaDirectory;
use App\Models\ActivityLog;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Services\HeidaDirectorySync;
use Carbon\CarbonInterval;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveyDirectorySeeder;
use Database\Seeders\SurveyRegionSeeder;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Sleep;

/*
 * HEIDA is never called from tests: these fakes answer like its public
 * /api/regions and /api/heis, two HEIs to a page so paging is exercised.
 */
beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveyRegionSeeder::class, SurveyDirectorySeeder::class]);
    config()->set('services.heida.url', 'https://heida.example.test');
    config()->set('services.heida.token', 'central-token');
    Sleep::fake();

    $GLOBALS['heida_regions'] = [
        heidaPlace('1200000000', 'Region XII (SOCCSKSARGEN)'),
        heidaPlace('1300000000', 'National Capital Region (NCR)'),
        heidaPlace('1900000000', 'Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)'),
    ];
    $GLOBALS['heida_heis'] = [];
    // Answers to send before the real ones, such as a 429 or an outage, by
    // "{path}#{page}".
    $GLOBALS['heida_hiccups'] = [];

    Http::fake(function (Request $request) {
        parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);
        $page = (int) ($query['page'] ?? 1);
        $path = parse_url($request->url(), PHP_URL_PATH);

        if (($GLOBALS['heida_hiccups'][$path.'#'.$page] ?? []) !== []) {
            return array_shift($GLOBALS['heida_hiccups'][$path.'#'.$page]);
        }

        return match ($path) {
            '/api/regions' => Http::response(['data' => $GLOBALS['heida_regions'], 'meta' => ['last_page' => 1]]),
            '/api/heis' => Http::response([
                'data' => array_chunk($GLOBALS['heida_heis'], 2)[$page - 1] ?? [],
                'meta' => ['current_page' => $page, 'last_page' => max(1, (int) ceil(count($GLOBALS['heida_heis']) / 2))],
            ]),
            default => Http::response(['message' => 'Not found'], 404),
        };
    });
});

function heidaPlace(string $code, string $name): array
{
    return ['id' => (int) substr($code, 0, 4), 'code' => $code, 'name' => $name, 'population' => null];
}

/** @param  array<string, mixed>  $overrides */
function heidaHei(string $code, string $name, array $overrides = []): array
{
    return [
        'id' => crc32($code),
        'code' => $code,
        'name' => $name,
        'status' => 'active',
        'hei_type' => 'PNN',
        'region' => heidaPlace('1200000000', 'Region XII (SOCCSKSARGEN)'),
        'province' => heidaPlace('1206300000', 'South Cotabato'),
        'city_municipality' => heidaPlace('1206306000', 'City of Koronadal'),
        ...$overrides,
    ];
}

/** @param  list<array<string, mixed>>  $heis */
function heidaLists(array $heis): void
{
    $GLOBALS['heida_heis'] = $heis;
}

/** HEIDA answers a page with an error, however often it is retried. */
function heidaFails(string $page, int $status): void
{
    $GLOBALS['heida_hiccups'][$page] = array_map(fn () => Http::response('Down', $status), range(1, 5));
}

function regionXii(): SurveyRegion
{
    return SurveyRegion::query()->where('name', 'Regional Office XII')->sole();
}

/** @param  array<string, mixed>  $attributes */
function directoryHei(string $cluster, array $attributes): SurveyHei
{
    return SurveyHei::query()->create([
        'survey_cluster_id' => $cluster === SurveyCluster::UNASSIGNED
            ? SurveyCluster::holdingFor(regionXii()->id)->id
            : SurveyCluster::query()->where('survey_region_id', regionXii()->id)->where('name', $cluster)->sole()->id,
        'is_active' => true,
        ...$attributes,
    ]);
}

test('an HEI on the list is matched by its UII, takes HEIDA\'s name and moves into its province', function () {
    $seeded = directoryHei(SurveyCluster::UNASSIGNED, ['uii' => '12152', 'name' => 'ACADEMIA DE TECHNOLOGIA IN MINDANAO', 'ownership' => 'private']);
    heidaLists([
        heidaHei('12152', 'Academia de Technologia in Mindanao', ['province' => heidaPlace('1204700000', 'Cotabato')]),
        heidaHei('12999', 'Sarangani Bay College', ['province' => heidaPlace('1208000000', 'Sarangani')]),
    ]);

    $result = app(HeidaDirectorySync::class)->sync();

    $seeded->refresh();
    $sarangani = SurveyHei::query()->where('uii', '12999')->sole();

    expect($result)->toMatchArray(['created' => 1, 'updated' => 1, 'total' => 2, 'regions_created' => ['Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)']])
        ->and($seeded->name)->toBe('Academia de Technologia in Mindanao')
        // "Cotabato" is the seeded "Province of Cotabato", which takes its code.
        ->and($seeded->cluster->only(['name', 'code']))->toBe(['name' => 'Province of Cotabato', 'code' => '1204700000'])
        ->and($seeded->portal_synced_at)->not->toBeNull()
        ->and($sarangani->cluster->name)->toBe('Sarangani')
        ->and($sarangani->cluster->survey_region_id)->toBe(regionXii()->id)
        ->and($sarangani->ownership)->toBe('private');
});

test('re-syncing changes nothing, and a renamed province keeps its cluster by code', function () {
    heidaLists([heidaHei('12001', 'Notre Dame of Marbel University')]);
    app(HeidaDirectorySync::class)->sync();
    $cluster = SurveyHei::query()->sole()->cluster;
    $cluster->update(['name' => 'South Cotabato Cluster']);

    $result = app(HeidaDirectorySync::class)->sync();

    expect($result)->toMatchArray(['created' => 0, 'updated' => 0, 'deactivated' => 0, 'clusters_created' => []])
        ->and(SurveyHei::query()->sole()->survey_cluster_id)->toBe($cluster->id)
        ->and($cluster->refresh()->name)->toBe('South Cotabato Cluster');
});

test('a school HEIDA files under BARMM stays in its region, clustered by its province', function () {
    $ndu = directoryHei(SurveyCluster::UNASSIGNED, ['uii' => '12053', 'name' => 'NOTRE DAME UNIVERSITY']);
    $barmm = heidaPlace('1900000000', 'Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)');
    heidaLists([
        heidaHei('12053', 'Notre Dame University', [
            'region' => $barmm,
            'province' => heidaPlace('1908700000', 'Maguindanao del Norte'),
            'city_municipality' => null,
        ]),
        heidaHei('15001', 'Mindanao State University - Marawi', [
            'region' => $barmm,
            'province' => heidaPlace('1903600000', 'Lanao del Sur'),
            'hei_type' => 'CSCU-MAIN',
        ]),
    ]);

    app(HeidaDirectorySync::class)->sync();

    $msu = SurveyHei::query()->where('uii', '15001')->sole();

    expect($ndu->refresh()->cluster->survey_region_id)->toBe(regionXii()->id)
        ->and($ndu->cluster->name)->toBe('Maguindanao del Norte')
        ->and($msu->cluster->region->only(['name', 'code']))->toBe([
            'name' => 'Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)',
            'code' => '1900000000',
        ])
        ->and($msu->cluster->name)->toBe('Lanao del Sur')
        ->and($msu->ownership)->toBe('public')
        // Office names are CHED's own; HEIDA's never replace them.
        ->and(regionXii()->code)->toBe('1200000000');
});

test('an HEI with no province goes to its region\'s holding cluster', function () {
    heidaLists([heidaHei('13001', 'University of the Philippines Manila', [
        'region' => heidaPlace('1300000000', 'National Capital Region (NCR)'),
        'province' => null,
    ])]);

    app(HeidaDirectorySync::class)->sync();

    $cluster = SurveyHei::query()->sole()->cluster;

    expect($cluster->name)->toBe(SurveyCluster::UNASSIGNED)
        ->and($cluster->region->name)->toBe('Regional Office NCR');
});

test('with no province, an HEI goes beside its region\'s others, and a placed one stays put', function () {
    $placed = directoryHei('Sarangani', ['uii' => '12002', 'name' => 'Placed College']);
    $noProvince = ['region' => heidaPlace('1300000000', 'National Capital Region (NCR)'), 'province' => null];
    heidaLists([
        heidaHei('13001', 'No Province College', $noProvince),
        heidaHei('13002', 'Metro College', ['region' => heidaPlace('1300000000', 'National Capital Region (NCR)'), 'province' => heidaPlace('1300100000', 'Metro Manila')]),
        heidaHei('12002', 'Placed College', ['province' => null]),
    ]);

    app(HeidaDirectorySync::class)->sync();

    // Placed after the HEIs with a province, so no holding cluster appears.
    expect(SurveyHei::query()->where('uii', '13001')->sole()->cluster->name)->toBe('Metro Manila')
        ->and(SurveyCluster::query()->where('name', SurveyCluster::UNASSIGNED)->exists())->toBeFalse()
        ->and($placed->refresh()->cluster->name)->toBe('Sarangani');
});

test('closed HEIs leave the pickers, and so do synced ones HEIDA drops, but not the ones it never had', function () {
    $seeded = directoryHei('South Cotabato', ['uii' => '12074e', 'name' => 'SULTAN KUDARAT STATE UNIVERSITY-GLAN']);
    heidaLists([heidaHei('12001', 'Kept University'), heidaHei('12002', 'Dropped College')]);
    app(HeidaDirectorySync::class)->sync();

    heidaLists([heidaHei('12001', 'Kept University', ['status' => 'closed'])]);
    $closed = app(HeidaDirectorySync::class)->sync();

    heidaLists([heidaHei('12001', 'Kept University')]);
    $reopened = app(HeidaDirectorySync::class)->sync();

    expect($closed['deactivated'])->toBe(2)
        ->and($reopened['reactivated'])->toBe(1)
        ->and(SurveyHei::query()->where('uii', '12001')->sole()->is_active)->toBeTrue()
        ->and(SurveyHei::query()->where('uii', '12002')->sole()->is_active)->toBeFalse()
        ->and($seeded->refresh()->is_active)->toBeTrue()
        ->and($seeded->portal_synced_at)->toBeNull()
        ->and(SurveyHei::query()->count())->toBe(3);
});

test('a hand-entered HEI is adopted by name instead of duplicated', function () {
    $manual = directoryHei('South Cotabato', ['name' => 'Hand Entered College']);
    heidaLists([heidaHei('12500', 'hand entered college')]);

    app(HeidaDirectorySync::class)->sync();

    expect(SurveyHei::query()->count())->toBe(1)
        ->and($manual->refresh()->uii)->toBe('12500')
        ->and($manual->name)->toBe('hand entered college');
});

test('two HEIs sharing a name in one cluster both fit, and a repeated code is skipped', function () {
    heidaLists([
        heidaHei('12001', 'STI College'),
        heidaHei('12002', 'STI College'),
        heidaHei('12002', 'STI College'),
        heidaHei('', 'No Code College'),
    ]);

    $result = app(HeidaDirectorySync::class)->sync();

    expect($result)->toMatchArray(['created' => 2, 'skipped' => 2])
        ->and(SurveyHei::query()->orderBy('name')->pluck('name')->all())->toBe(['STI College', 'STI College (2)']);
});

test('an HEI with an unknown type keeps the ownership it has', function () {
    $hei = directoryHei('South Cotabato', ['uii' => '12001', 'name' => 'Other College', 'ownership' => 'private']);
    heidaLists([heidaHei('12001', 'Other College', ['hei_type' => 'OT'])]);

    app(HeidaDirectorySync::class)->sync();

    expect($hei->refresh()->ownership)->toBe('private');
});

test('HEIDA is read politely: public endpoints only, every page, a pause between pages, no token', function () {
    heidaLists([heidaHei('12001', 'One'), heidaHei('12002', 'Two'), heidaHei('12003', 'Three'), heidaHei('12004', 'Four'), heidaHei('12005', 'Five')]);

    $result = app(HeidaDirectorySync::class)->sync();

    expect($result['calls'])->toBe(4)
        ->and(SurveyHei::query()->count())->toBe(5);
    Http::assertSentCount(4);
    Http::assertNotSent(fn (Request $request) => $request->hasHeader('Authorization')
        || ! str_starts_with($request->url(), 'https://heida.example.test/api/'));
    Http::assertSent(fn (Request $request) => str_contains($request->url(), '/api/heis?per_page=100&page=3'));
    Sleep::assertSlept(fn (CarbonInterval $pause) => (int) $pause->totalMilliseconds === 500, 2);
});

test('asked to slow down, the sync waits as long as HEIDA says, once', function () {
    heidaLists([heidaHei('12001', 'Patient College')]);
    $GLOBALS['heida_hiccups']['/api/heis#1'] = [Http::response(['message' => 'Too Many Attempts.'], 429, ['Retry-After' => '7'])];

    app(HeidaDirectorySync::class)->sync();

    expect(SurveyHei::query()->where('uii', '12001')->exists())->toBeTrue();
    Sleep::assertSlept(fn (CarbonInterval $wait) => (int) $wait->totalSeconds === 7);
});

test('a page that fails changes nothing', function () {
    $seeded = directoryHei('South Cotabato', ['uii' => '12001', 'name' => 'KEPT UNIVERSITY']);
    heidaLists([heidaHei('12001', 'Kept University'), heidaHei('12002', 'Two'), heidaHei('12003', 'Three')]);
    heidaFails('/api/heis#2', 502);

    expect(fn () => app(HeidaDirectorySync::class)->sync())
        ->toThrow(RuntimeException::class, 'HEIDA answered 502 for /api/heis (page 2).');
    expect(SurveyHei::query()->count())->toBe(1)
        ->and($seeded->refresh()->name)->toBe('KEPT UNIVERSITY')
        ->and(SurveyRegion::query()->where('code', '1900000000')->exists())->toBeFalse();
});

test('a dry run counts the changes and saves none of them', function () {
    heidaLists([heidaHei('12001', 'Kept University'), heidaHei('12002', 'Two')]);

    $result = app(HeidaDirectorySync::class)->sync(dryRun: true);

    expect($result)->toMatchArray(['created' => 2, 'total' => 2])
        ->and($result['regions_created'])->toHaveCount(1)
        ->and(SurveyHei::query()->count())->toBe(0)
        ->and(SurveyRegion::query()->where('code', '1900000000')->exists())->toBeFalse()
        ->and(ActivityLog::query()->where('action', 'synced')->exists())->toBeFalse();
});

test('a real run is logged with its counts', function () {
    heidaLists([heidaHei('12001', 'Kept University')]);

    app(HeidaDirectorySync::class)->sync();

    expect(ActivityLog::query()->where('action', 'synced')->where('module', 'heis')->sole()->properties)
        ->toMatchArray(['created' => 1, 'total' => 1, 'calls' => 2, 'regions_created' => 1]);
});

test('two syncs never run at once', function () {
    $lock = Cache::lock('heida:sync', 600);
    $lock->get();

    expect(fn () => app(HeidaDirectorySync::class)->sync())
        ->toThrow(RuntimeException::class, 'Another HEI sync is running.');
    Http::assertNothingSent();

    $lock->release();
});

test('only directory managers can start a sync from settings, and it runs in the background', function () {
    Queue::fake();
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $focal = User::factory()->create();
    $focal->assignRole('gad-focal-person');

    $this->actingAs($focal)->post(route('settings.survey-directories.sync'))->assertForbidden();
    $this->actingAs($admin)->post(route('settings.survey-directories.sync'))->assertRedirect();

    Queue::assertPushed(SyncHeidaDirectory::class, 1);
});

test('the queued job runs the sync', function () {
    heidaLists([heidaHei('12001', 'Queued University')]);

    SyncHeidaDirectory::dispatchSync();

    expect(SurveyHei::query()->where('uii', '12001')->exists())->toBeTrue();
});

test('the artisan command reports what it changed', function () {
    heidaLists([heidaHei('12001', 'Notre Dame of Marbel University'), heidaHei('12002', 'Davao Doctors College', [
        'province' => heidaPlace('1102400000', 'Davao del Sur'),
    ])]);

    $this->artisan('surveys:sync-heis')
        ->expectsOutputToContain('Fetched 2 institutions from HEIDA in 2 requests.')
        ->expectsOutputToContain('New regions from HEIDA: Bangsamoro Autonomous Region In Muslim Mindanao (BARMM)')
        ->assertSuccessful();
});

test('the artisan command can show a dry run', function () {
    heidaLists([heidaHei('12001', 'Notre Dame of Marbel University')]);

    $this->artisan('surveys:sync-heis', ['--dry-run' => true])
        ->expectsOutputToContain('Dry run: nothing was saved.')
        ->assertSuccessful();

    expect(SurveyHei::query()->count())->toBe(0);
});

test('the artisan command fails loudly when HEIDA is down', function () {
    heidaFails('/api/regions#1', 503);

    $this->artisan('surveys:sync-heis')
        ->expectsOutputToContain('HEIDA answered 503 for /api/regions (page 1).')
        ->assertFailed();
});
