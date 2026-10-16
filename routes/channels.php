<?php

use App\Models\GadEvent;
use App\Models\User;
use App\Support\LiveChannels;
use Illuminate\Support\Facades\Broadcast;

/*
| Who may listen to which live-update channel (docs/realtime.md). The
| signals carry no data, but where something changed still follows place.
*/

// A person's own notifications.
Broadcast::channel('App.Models.User.{id}', fn (User $user, string $id): bool => $user->id === (int) $id);

Broadcast::channel('live.{module}', fn (User $user, string $module): bool => LiveChannels::mayFollow($user, $module, "live.{$module}"));

Broadcast::channel(
    'live.{module}.region.{region}',
    fn (User $user, string $module, string $region): bool => LiveChannels::mayFollow($user, $module, "live.{$module}.region.{$region}"),
);

Broadcast::channel(
    'live.{module}.hei.{hei}',
    fn (User $user, string $module, string $hei): bool => LiveChannels::mayFollow($user, $module, "live.{$module}.hei.{$hei}"),
);

// Every signed-in account reads the community's posts.
Broadcast::channel('record.post.{post}', fn (User $user, string $post): bool => true);

Broadcast::channel('record.event.{event}', fn (User $user, GadEvent $event): bool => $user->can('view', $event));
