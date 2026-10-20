<?php

namespace App\Console\Commands;

use App\Support\SoketiProbe;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Broadcast;
use Throwable;

/**
 * Whether live updates work here and, if not, what to change
 * (docs/realtime.md): the settings, whether a browser is let in at the
 * public endpoint, and whether this server can publish a signal.
 */
class CheckRealtime extends Command
{
    protected $signature = 'realtime:check';

    protected $description = 'Check that live updates work: the settings, a browser\'s connection, and a test signal';

    private bool $passed = true;

    public function handle(SoketiProbe $probe): int
    {
        $default = (string) config('broadcasting.default');

        if ($default !== 'pusher') {
            $this->error("Live updates are off: BROADCAST_CONNECTION is \"{$default}\". Set it to pusher (docs/realtime.md). Until then pages check for news every 30 seconds.");

            return self::FAILURE;
        }

        /** @var array{key: ?string, host: ?string, port: int, scheme: string} $client */
        $client = config('broadcasting.connections.pusher.client');
        /** @var array{host: string, port: int|string, scheme: string} $server */
        $server = config('broadcasting.connections.pusher.options');

        if (blank(config('broadcasting.connections.pusher.app_id')) || blank($client['key']) || blank(config('broadcasting.connections.pusher.secret'))) {
            $this->error('PUSHER_APP_ID, PUSHER_APP_KEY and PUSHER_APP_SECRET must all be set, as Berth gives them (WebSocket tab, "Copy as .env").');

            return self::FAILURE;
        }

        // What browsers are told: the public endpoint, and the app's key.
        if (blank($client['host'])) {
            $this->problem('Pages are not told where to connect: VITE_PUSHER_HOST is empty, or written as a reference such as ${PUSHER_HOST}, which Coolify passes on as it is. Set it to the public WebSocket host itself, for example ws.example.com.');
        } else {
            $socket = ($client['scheme'] === 'https' ? 'wss' : 'ws')."://{$client['host']}:{$client['port']}/app/{$client['key']}";
            $refusal = $probe->refusal($client['scheme'], (string) $client['host'], $client['port'], (string) $client['key']);

            $refusal === null
                ? $this->good("A browser is let in at {$socket}.")
                : $this->problem("A browser is not let in at {$socket}: {$refusal}. Check PUSHER_APP_KEY, and VITE_PUSHER_HOST, VITE_PUSHER_PORT and VITE_PUSHER_SCHEME (the public endpoint).");
        }

        // How this server publishes.
        $internal = "{$server['scheme']}://{$server['host']}:{$server['port']}";

        if (! $probe->answers($internal)) {
            $this->problem("This server cannot reach the WebSocket server at {$internal}. If PUSHER_HOST is Soketi's name inside Coolify, it takes PUSHER_PORT=6001 and PUSHER_SCHEME=http, and the app must share Soketi's Docker network. Otherwise use the public endpoint: PUSHER_HOST=".($client['host'] ?: 'the public host').', PUSHER_PORT=443, PUSHER_SCHEME=https.');
        } else {
            $this->good("This server reaches the WebSocket server at {$internal}.");

            try {
                // The way every live update goes out (SoketiBroadcaster).
                Broadcast::connection('pusher')->broadcast(['realtime-check'], 'ping', ['at' => now()->toISOString()]);
                $this->good('A test signal went out.');
            } catch (Throwable $exception) {
                $this->problem($exception->getMessage().' '.$this->hintFor($exception->getMessage()));
            }
        }

        if (! $this->passed) {
            $this->newLine();
            $this->line('After changing a variable in Coolify, redeploy (or restart) so the app reads it, then run this again.');

            return self::FAILURE;
        }

        $this->info('Live updates work: open pages update by themselves.');

        return self::SUCCESS;
    }

    private function hintFor(string $message): string
    {
        $message = strtolower($message);

        return match (true) {
            str_contains($message, 'secret'), str_contains($message, 'signature') => 'PUSHER_APP_SECRET does not match the app\'s: it may have been rotated in Berth.',
            str_contains($message, 'not found'), str_contains($message, 'does not exist'), str_contains($message, '404') => 'PUSHER_APP_ID names no app on that server.',
            default => 'Compare the PUSHER_* lines with Berth\'s WebSocket tab.',
        };
    }

    private function good(string $message): void
    {
        $this->line("<info>OK</info>    {$message}");
    }

    private function problem(string $message): void
    {
        $this->passed = false;
        $this->line("<error>FAIL</error>  {$message}");
    }
}
