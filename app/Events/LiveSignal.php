<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Tells the pages following some channels that what they show changed. It
 * carries nothing else, but for the ids of the posts that changed, which
 * every signed-in reader may see: each page asks the server again, which
 * still decides what its reader may see. Sent by App\Services\LiveUpdates
 * only.
 */
class LiveSignal implements ShouldBroadcastNow
{
    use Dispatchable;

    /** A record changed on a module or record channel (LiveChannels). */
    public const CHANGED = 'changed';

    /** A person's notifications changed, on their own channel. */
    public const INBOX = 'inbox';

    /** Posts changed (comments, reactions, shares, edits), on the community channel. */
    public const POSTS = 'posts';

    /**
     * @param  list<string>  $channels  Private channel names, without the prefix.
     * @param  array{ids?: list<string>}  $data  The posts a POSTS signal names.
     */
    public function __construct(
        public readonly array $channels,
        public readonly string $name,
        public readonly array $data = [],
    ) {}

    /** @return list<PrivateChannel> */
    public function broadcastOn(): array
    {
        return array_map(fn (string $channel): PrivateChannel => new PrivateChannel($channel), $this->channels);
    }

    public function broadcastAs(): string
    {
        return $this->name;
    }

    /** @return array{ids?: list<string>} */
    public function broadcastWith(): array
    {
        return $this->data;
    }
}
