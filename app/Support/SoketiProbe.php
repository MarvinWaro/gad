<?php

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/**
 * Asks a Soketi server what a browser or this server would hear from it
 * (realtime:check): whether it answers at an address, and whether it lets
 * a browser in with an app key.
 */
class SoketiProbe
{
    private const TIMEOUT = 5;

    /** Whether a Soketi server answers there: "OK" at its root. */
    public function answers(string $url): bool
    {
        try {
            return trim(Http::connectTimeout(3)->timeout(self::TIMEOUT)->get($url)->body()) === 'OK';
        } catch (ConnectionException) {
            return false;
        }
    }

    /**
     * Opens a WebSocket as a browser's page does and reads the first
     * message. Null when Soketi lets it in; otherwise what went wrong, in
     * Soketi's words where it gave any.
     */
    public function refusal(string $scheme, string $host, int $port, string $key): ?string
    {
        $secure = $scheme === 'https';
        $stream = @stream_socket_client(
            ($secure ? 'tls://' : 'tcp://')."{$host}:{$port}",
            $code,
            $error,
            self::TIMEOUT,
            STREAM_CLIENT_CONNECT,
            stream_context_create(['ssl' => ['peer_name' => $host]]),
        );

        if ($stream === false) {
            return "no connection ({$error})";
        }

        stream_set_timeout($stream, self::TIMEOUT);
        fwrite($stream, implode("\r\n", [
            'GET /app/'.rawurlencode($key).'?protocol=7&client=php&version=1.0 HTTP/1.1',
            "Host: {$host}",
            'Upgrade: websocket',
            'Connection: Upgrade',
            'Sec-WebSocket-Key: '.base64_encode(random_bytes(16)),
            'Sec-WebSocket-Version: 13',
            '', '',
        ]));

        $received = '';
        while (! str_contains($received, "\r\n\r\n") && ($chunk = fread($stream, 1024)) !== false && $chunk !== '') {
            $received .= $chunk;
        }

        if (! str_starts_with($received, 'HTTP/1.1 101')) {
            fclose($stream);

            return 'no WebSocket ('.(strtok($received, "\r\n") ?: 'no answer').')';
        }

        $message = $this->firstMessage($stream, substr($received, (int) strpos($received, "\r\n\r\n") + 4));
        fclose($stream);

        if (($message['event'] ?? null) === 'pusher:connection_established') {
            return null;
        }

        $data = is_string($message['data'] ?? null) ? json_decode($message['data'], true) : ($message['data'] ?? null);

        return is_array($data) && isset($data['message'])
            ? rtrim((string) $data['message'], '.')." (code {$data['code']})"
            : 'no greeting';
    }

    /**
     * The first frame the server sends, as JSON: a short text frame,
     * unmasked, as Soketi sends its greeting.
     *
     * @param  resource  $stream
     * @return array<string, mixed>|null
     */
    private function firstMessage($stream, string $received): ?array
    {
        $read = function (int $bytes) use ($stream, &$received): bool {
            while (strlen($received) < $bytes && ($chunk = fread($stream, 1024)) !== false && $chunk !== '') {
                $received .= $chunk;
            }

            return strlen($received) >= $bytes;
        };

        if (! $read(2)) {
            return null;
        }

        $length = ord($received[1]) & 0x7F;
        $offset = 2;

        if ($length === 126) {
            if (! $read(4)) {
                return null;
            }
            $length = (ord($received[2]) << 8) | ord($received[3]);
            $offset = 4;
        }

        if (! $read($offset + $length)) {
            return null;
        }

        $message = json_decode(substr($received, $offset, $length), true);

        return is_array($message) ? $message : null;
    }
}
