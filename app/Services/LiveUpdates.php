<?php

namespace App\Services;

use App\Enums\ActivityModule;
use App\Events\LiveSignal;
use App\Models\ActivityLog;
use App\Support\LiveChannels;
use Illuminate\Database\Eloquent\Model;
use Throwable;

use function Illuminate\Support\defer;

/**
 * Tells open pages that what they show changed (docs/realtime.md). The one
 * place that broadcasts. Signals are gathered while a request (or command,
 * or job) runs and sent once, together, after it is done: a slow or missing
 * WebSocket server never holds up or undoes a change.
 */
class LiveUpdates
{
    /** Channels per signal, as the server takes them; also post ids per signal, well inside its 10 KB. */
    private const PER_SIGNAL = 100;

    /** @var array<string, true> */
    private array $changed = [];

    /** @var array<int, true> */
    private array $inboxes = [];

    /** @var array<string, true> */
    private array $posts = [];

    private bool $pending = false;

    /**
     * A logged change: its module's channels and its page's. A post's is
     * also named to the feeds, which swap in the posts they show.
     */
    public function changed(ActivityLog $entry, ?Model $subject = null): void
    {
        $post = $subject !== null ? LiveChannels::postOf($subject) : null;

        if ($post !== null) {
            $this->posts[$post] = true;
        }

        $this->add(LiveChannels::forEntry($entry, $subject));
    }

    /**
     * A change kept out of the activity log, such as an anonymous survey
     * answer, by the module and place it belongs to.
     */
    public function touched(ActivityModule $module, ?int $regionId, ?int $heiId = null): void
    {
        $this->add(LiveChannels::placed($module->value, $regionId, $heiId));
    }

    /**
     * People whose notifications changed: new ones, or ones read or removed
     * on another tab or device.
     *
     * @param  iterable<int>  $userIds
     */
    public function inbox(iterable $userIds): void
    {
        foreach ($userIds as $userId) {
            $this->inboxes[(int) $userId] = true;
        }

        $this->schedule();
    }

    /** Send what was gathered. Runs by itself after the response. */
    public function flush(): void
    {
        $changed = array_keys($this->changed);
        $inboxes = array_map(fn (int $userId): string => "App.Models.User.{$userId}", array_keys($this->inboxes));
        $posts = array_map(strval(...), array_keys($this->posts));
        $this->changed = [];
        $this->inboxes = [];
        $this->posts = [];
        $this->pending = false;

        $this->send($changed, LiveSignal::CHANGED);
        $this->send($inboxes, LiveSignal::INBOX);

        foreach (array_chunk($posts, self::PER_SIGNAL) as $ids) {
            $this->send(LiveChannels::placed(ActivityModule::Community->value, null), LiveSignal::POSTS, ['ids' => $ids]);
        }
    }

    /** @param  list<string>  $channels */
    private function add(array $channels): void
    {
        foreach ($channels as $channel) {
            $this->changed[$channel] = true;
        }

        $this->schedule();
    }

    private function schedule(): void
    {
        if (! $this->pending) {
            $this->pending = true;
            defer(fn () => $this->flush());
        }
    }

    /**
     * @param  list<string>  $channels
     * @param  array{ids?: list<string>}  $data
     */
    private function send(array $channels, string $name, array $data = []): void
    {
        foreach (array_chunk($channels, self::PER_SIGNAL) as $chunk) {
            try {
                event(new LiveSignal($chunk, $name, $data));
            } catch (Throwable $exception) {
                // The change went through; pages catch up on their next visit.
                report($exception);
            }
        }
    }
}
