<?php

namespace App\Actions\Events;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\GadEvent;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;

/**
 * Calling a GAD event off, or putting it back on (docs/event-registration.md).
 * A cancelled event keeps its list of who joined, but nobody joins or is
 * checked in, and it gives no certificates. Everyone on its list is told.
 */
final class CancelEvent
{
    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    public function cancel(User $staff, GadEvent $event): void
    {
        if ($event->isCancelled()) {
            return;
        }

        $event->forceFill(['cancelled_at' => now()])->save();
        $entry = $this->activity->record(ActivityAction::Cancelled, ActivityModule::Events, $event, actor: $staff);
        $this->notifier->eventCancelled($entry, Notifier::registrants($event));
    }

    public function restore(User $staff, GadEvent $event): void
    {
        if (! $event->isCancelled()) {
            return;
        }

        $event->forceFill(['cancelled_at' => null])->save();
        $entry = $this->activity->record(ActivityAction::Restored, ActivityModule::Events, $event, actor: $staff);
        $this->notifier->eventCancelled($entry, Notifier::registrants($event), restored: true);
    }
}
