<?php

namespace App\Broadcasting;

use Illuminate\Broadcasting\Broadcasters\PusherBroadcaster;
use Illuminate\Broadcasting\BroadcastException;
use Illuminate\Support\Arr;
use Pusher\ApiErrorException;

/**
 * Laravel's Pusher broadcaster, for Berth's Soketi (docs/realtime.md).
 * Soketi turns a signal away (a wrong secret, an unknown app) with its
 * error in a 200 reply, which the Pusher SDK hands back instead of
 * throwing, so the signal would vanish without a trace. This one throws,
 * and LiveUpdates reports it.
 */
class SoketiBroadcaster extends PusherBroadcaster
{
    /**
     * @param  array<int, mixed>  $channels
     * @param  string  $event
     * @param  array<string, mixed>  $payload
     *
     * @throws BroadcastException
     */
    public function broadcast(array $channels, $event, array $payload = []): void
    {
        $socket = Arr::pull($payload, 'socket');
        $parameters = $socket !== null ? ['socket_id' => $socket] : [];

        foreach (array_chunk($this->formatChannels($channels), 100) as $chunk) {
            try {
                $reply = $this->pusher->trigger($chunk, $event, $payload, $parameters);
            } catch (ApiErrorException $exception) {
                throw new BroadcastException(sprintf('Pusher error: %s.', $exception->getMessage()));
            }

            if (isset($reply->error)) {
                throw new BroadcastException(sprintf('Soketi refused the signal: %s (code %s).', rtrim((string) $reply->error, '.'), $reply->code ?? 'none'));
            }
        }
    }
}
