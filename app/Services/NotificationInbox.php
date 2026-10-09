<?php

namespace App\Services;

use App\Enums\NotificationKind;
use App\Models\Notification;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * A person's own notifications: what they hold, and reading or clearing
 * them. The bell, the Notifications page and a future API share it.
 */
class NotificationInbox
{
    /** Notifications per page in the bell's panel. */
    public const RECENT_PER_PAGE = 5;

    /** Notifications per page on the Notifications page. */
    public const PAGE_SIZE = 15;

    /** What NotificationResource reads. */
    public const RELATIONS = ['activity.user:id,ulid,avatar_path', 'activity.subject', 'activity.hei:id,name', 'subject'];

    /**
     * How many are unread, and when the newest arrived, so the browser can
     * tell when something new came in.
     *
     * @return array{unread: int, latest_at: string|null}
     */
    public function summary(User $user): array
    {
        $latest = $user->notifications()->max('notified_at');

        return [
            'unread' => $user->notifications()->unread()->count(),
            'latest_at' => is_string($latest) ? CarbonImmutable::parse($latest, 'UTC')->toIso8601ZuluString() : null,
        ];
    }

    /**
     * The person's notifications, newest first.
     *
     * @param  array<string, mixed>  $filters  See Notification::scopeFilter().
     * @return Builder<Notification>
     */
    public function query(User $user, array $filters = []): Builder
    {
        return Notification::query()
            ->whereBelongsTo($user)
            ->filter($filters)
            ->with(self::RELATIONS)
            ->orderByDesc('notified_at')
            ->orderByDesc('id');
    }

    /**
     * The kinds the person has been told about, for the Type filter.
     *
     * @return list<NotificationKind>
     */
    public function kindsOf(User $user): array
    {
        return array_values($user->notifications()
            ->distinct()
            ->get(['kind'])
            ->map(fn (Notification $notification): NotificationKind => $notification->kind)
            ->sortBy(fn (NotificationKind $kind): string => $kind->label())
            ->all());
    }

    public function setRead(Notification $notification, bool $read): void
    {
        $notification->forceFill(['read_at' => $read ? ($notification->read_at ?? now()) : null])->save();
    }

    public function markAllRead(User $user): void
    {
        $user->notifications()->unread()->update(['read_at' => now()]);
    }
}
