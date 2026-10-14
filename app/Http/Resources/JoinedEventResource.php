<?php

namespace App\Http\Resources;

use App\Models\GadEvent;
use App\Models\GadEventRegistration;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An event someone joined, as Settings → My certificates lists it: the
 * event, how it went for them, and whether a certificate came of it. Load
 * `event.region` and select `days_attended` and `has_certificate` first
 * (MyCertificateController).
 *
 * @mixin GadEventRegistration
 */
class JoinedEventResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        /** @var GadEvent $event */
        $event = $this->event;
        $days = (int) $this->getAttribute('days_attended');

        return [
            'id' => $this->id,
            'joined_at' => $this->joined_at->toIso8601ZuluString(),
            'event' => [
                ...$event->toCalendarArray(),
                'region' => $event->region?->name,
            ],
            'days_attended' => $days,
            'status' => self::status($event, $days),
            'has_certificate' => (bool) $this->getAttribute('has_certificate'),
        ];
    }

    /**
     * A fixed code: checked in at least once, otherwise where the event
     * stands (GadEvent::statusAt: upcoming, ongoing or cancelled), with an
     * ended one missed.
     */
    private static function status(GadEvent $event, int $days): string
    {
        if ($days > 0) {
            return 'attended';
        }

        $status = $event->statusAt(GadEvent::localNow());

        return $status === 'ended' ? 'missed' : $status;
    }
}
