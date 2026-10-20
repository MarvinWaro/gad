<?php

use App\Broadcasting\SoketiBroadcaster;
use App\Enums\ActivityModule;
use App\Services\LiveUpdates;
use App\Support\SoketiProbe;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Exceptions;
use Illuminate\Support\Facades\Http;
use Pusher\Pusher;

/** Live updates switched on, against a Soketi that answers `$reply` to every signal. */
function liveUpdatesOn(object $reply = new stdClass, ?string $publicHost = 'ws.example.test'): void
{
    config([
        'broadcasting.default' => 'pusher',
        'broadcasting.connections.pusher.app_id' => 'phlgadis',
        'broadcasting.connections.pusher.key' => 'app-key',
        'broadcasting.connections.pusher.secret' => 'app-secret',
        'broadcasting.connections.pusher.options.host' => 'soketi',
        'broadcasting.connections.pusher.options.port' => 6001,
        'broadcasting.connections.pusher.options.scheme' => 'http',
        'broadcasting.connections.pusher.client' => ['key' => 'app-key', 'host' => $publicHost, 'port' => 443, 'scheme' => 'https', 'cluster' => 'mt1'],
    ]);
    $pusher = Mockery::mock(Pusher::class);
    $pusher->shouldReceive('trigger')->andReturn($reply);
    Broadcast::extend('pusher', fn () => new SoketiBroadcaster($pusher));
}

/** @param  array<string, string>  $values */
function withEnvironment(array $values, Closure $test): void
{
    foreach ($values as $name => $value) {
        putenv("{$name}={$value}");
        $_ENV[$name] = $_SERVER[$name] = $value;
    }

    try {
        $test();
    } finally {
        foreach (array_keys($values) as $name) {
            putenv($name);
            unset($_ENV[$name], $_SERVER[$name]);
        }
    }
}

test('references Coolify passes on unexpanded never reach browsers, and the key is the app\'s own', function () {
    withEnvironment([
        'PUSHER_APP_KEY' => 'app-key',
        'VITE_PUSHER_APP_KEY' => '${PUSHER_APP_KEY}',
        'VITE_PUSHER_HOST' => '${PUSHER_HOST}',
        'VITE_PUSHER_PORT' => '${PUSHER_PORT}',
        'VITE_PUSHER_SCHEME' => '${PUSHER_SCHEME}',
    ], function () {
        $client = (require config_path('broadcasting.php'))['connections']['pusher']['client'];

        // No public host: pages are told nothing, and check every 30 seconds.
        expect($client)->toMatchArray(['key' => 'app-key', 'host' => null, 'port' => 443, 'scheme' => 'https']);
    });

    withEnvironment(['VITE_PUSHER_HOST' => 'ws.example.test', 'VITE_PUSHER_PORT' => '443'], function () {
        $client = (require config_path('broadcasting.php'))['connections']['pusher']['client'];

        expect($client)->toMatchArray(['host' => 'ws.example.test', 'port' => 443]);
    });
});

test('a signal Soketi turns away is an error, reported, and the change still goes through', function () {
    liveUpdatesOn((object) ['error' => 'The secret authentication failed', 'code' => 401]);

    expect(Broadcast::connection('pusher'))->toBeInstanceOf(SoketiBroadcaster::class)
        ->and(fn () => Broadcast::connection('pusher')->broadcast(['private-live.users'], 'changed'))
        ->toThrow(BroadcastException::class, 'Soketi refused the signal: The secret authentication failed (code 401).');

    Exceptions::fake();
    $live = app(LiveUpdates::class);
    $live->touched(ActivityModule::SiteRatings, null);
    $live->flush();
    Exceptions::assertReported(fn (BroadcastException $exception): bool => str_contains($exception->getMessage(), 'secret authentication failed'));
});

test('a signal Soketi takes goes out quietly', function () {
    liveUpdatesOn();

    expect(fn () => Broadcast::connection('pusher')->broadcast(['private-live.users'], 'changed'))->not->toThrow(BroadcastException::class);
});

test('realtime:check says when live updates are off', function () {
    config(['broadcasting.default' => 'log']);

    $this->artisan('realtime:check')
        ->expectsOutputToContain('Live updates are off: BROADCAST_CONNECTION is "log"')
        ->assertFailed();
});

test('realtime:check passes when a browser is let in and a signal goes out', function () {
    liveUpdatesOn();
    $this->mock(SoketiProbe::class, function ($probe) {
        $probe->shouldReceive('refusal')->with('https', 'ws.example.test', 443, 'app-key')->andReturnNull();
        $probe->shouldReceive('answers')->with('http://soketi:6001')->andReturnTrue();
    });

    $this->artisan('realtime:check')
        ->expectsOutputToContain('A browser is let in at wss://ws.example.test:443/app/app-key.')
        ->expectsOutputToContain('This server reaches the WebSocket server at http://soketi:6001.')
        ->expectsOutputToContain('A test signal went out.')
        ->expectsOutputToContain('Live updates work')
        ->assertSuccessful();
});

test('realtime:check names what is wrong, and what to change', function () {
    liveUpdatesOn((object) ['error' => 'The secret authentication failed', 'code' => 401]);
    $this->mock(SoketiProbe::class, function ($probe) {
        $probe->shouldReceive('refusal')->andReturn('App key app-key does not exist (code 4001)');
        $probe->shouldReceive('answers')->andReturnTrue();
    });

    $this->artisan('realtime:check')
        ->expectsOutputToContain('A browser is not let in at wss://ws.example.test:443/app/app-key: App key app-key does not exist (code 4001)')
        ->expectsOutputToContain('PUSHER_APP_SECRET does not match the app\'s')
        ->expectsOutputToContain('redeploy (or restart)')
        ->assertFailed();
});

test('realtime:check catches a missing public host and an unreachable Soketi', function () {
    liveUpdatesOn(publicHost: null);
    $this->mock(SoketiProbe::class, function ($probe) {
        $probe->shouldNotReceive('refusal');
        $probe->shouldReceive('answers')->andReturnFalse();
    });

    $this->artisan('realtime:check')
        ->expectsOutputToContain('Pages are not told where to connect')
        ->expectsOutputToContain('This server cannot reach the WebSocket server at http://soketi:6001')
        ->assertFailed();
});

test('a Soketi server answers OK at its root', function () {
    Http::fake([
        'soketi:6001*' => Http::response('OK'),
        'elsewhere.test*' => Http::response('Not here', 404),
    ]);

    expect(app(SoketiProbe::class)->answers('http://soketi:6001'))->toBeTrue()
        ->and(app(SoketiProbe::class)->answers('https://elsewhere.test'))->toBeFalse();
});
