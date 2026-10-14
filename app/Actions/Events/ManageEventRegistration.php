<?php

namespace App\Actions\Events;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Certificate;
use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use App\Models\GadEventRegistration;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use App\Support\EventAttendance;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Joining a GAD event before it, leaving it, staff closing or reopening
 * registration, and staff keeping the list: adding someone, such as an
 * invitee from another region or a walk-in from the paper sheet, marking the
 * days they came, and taking someone off (docs/event-registration.md).
 * There is no limit and no approval: joining is enough. GadEventPolicy says
 * who may; this says when.
 */
final class ManageEventRegistration
{
    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    /**
     * Joins once: joining again, or twice at the same moment, finds the
     * first. Only a new one is logged.
     *
     * @throws ValidationException
     */
    public function join(User $person, GadEvent $event): GadEventRegistration
    {
        $this->ensureOpen($event, null);

        $registration = GadEventRegistration::query()->createOrFirst(
            ['gad_event_id' => $event->id, 'user_id' => $person->id],
            ['survey_region_id' => $person->regionId(), 'survey_hei_id' => $person->survey_hei_id],
        );
        $registration->setRelation('event', $event);

        if ($registration->wasRecentlyCreated) {
            $this->activity->record(ActivityAction::Joined, ActivityModule::Events, $registration, actor: $person);
        }

        return $registration;
    }

    /**
     * Leaves, while registration is open and before being checked in: once
     * checked in, the person attended.
     *
     * @throws ValidationException
     */
    public function leave(User $person, GadEvent $event): void
    {
        $registration = $event->registrations()->where('user_id', $person->id)->first();

        if ($registration === null) {
            return;
        }

        if ($event->checkIns()->where('user_id', $person->id)->exists()) {
            throw ValidationException::withMessages([
                'registration' => __('You were checked in to :event, so you stay on its list.', ['event' => $event->title]),
            ]);
        }

        $this->ensureOpen($event, __('Registration for :event has closed, so the list is final.', ['event' => $event->title]));

        $registration->setRelation('event', $event);
        $this->activity->record(ActivityAction::Left, ActivityModule::Events, $registration, actor: $person);
        $registration->delete();
    }

    /**
     * Staff close registration now, or reopen it until the event ends.
     * Closing an already closed one changes nothing.
     */
    public function setOpen(GadEvent $event, bool $open): void
    {
        if ($open) {
            $event->registration_closes_at = null;
        } elseif ($event->acceptsRegistrations(GadEvent::localNow())) {
            $event->registration_closes_at = GadEvent::localNow();
        }

        $event->save();
        $this->activity->recordSave(ActivityModule::Events, $event);
    }

    /**
     * Staff put someone on the list, whatever their region and whether or
     * not registration is open, with the days they came if the event has
     * begun (the paper sheet). They are told, and see the event from then on.
     *
     * @param  list<string>  $days  Philippine days, Y-m-d
     *
     * @throws ValidationException
     */
    public function add(User $staff, User $person, GadEvent $event, array $days = []): GadEventRegistration
    {
        EventAttendance::ensureListKept($event);
        EventAttendance::ensureDays($event, $days);

        if ($event->registrations()->where('user_id', $person->id)->exists()) {
            throw ValidationException::withMessages([
                'person' => __(':name is already on the list.', ['name' => $person->name]),
            ]);
        }

        $registration = DB::transaction(function () use ($staff, $person, $event, $days): GadEventRegistration {
            $registration = GadEventRegistration::query()->create([
                'gad_event_id' => $event->id,
                'user_id' => $person->id,
                'survey_region_id' => $person->regionId(),
                'survey_hei_id' => $person->survey_hei_id,
                'added_by' => $staff->id,
            ]);
            $this->markDays($staff, $event, $person, $days);

            return $registration;
        });
        $registration->setRelation('event', $event)->setRelation('user', $person);

        $entry = $this->activity->record(ActivityAction::Added, ActivityModule::Events, $registration,
            properties: ['event' => $event->title], actor: $staff, label: "{$person->name} to {$event->title}");
        $this->notifier->eventPersonAdded($person, $entry);

        return $registration;
    }

    /**
     * The days someone came, as staff mark them on the list: from the paper
     * sheet, or to undo a check-in made by mistake. Only the event's days up
     * to today. A day is never taken from someone who holds its certificate.
     *
     * @param  list<string>  $days  Philippine days, Y-m-d
     *
     * @throws ValidationException
     */
    public function setAttendance(User $staff, GadEventRegistration $registration, array $days): void
    {
        $event = $registration->event;
        $person = $registration->user;
        EventAttendance::ensureListKept($event);
        EventAttendance::ensureDays($event, $days);

        $marked = $event->checkIns()->where('user_id', $person->id)->pluck('attended_on')->all();
        $removed = array_values(array_diff($marked, $days));
        $added = array_values(array_diff($days, $marked));

        if ($removed !== [] && self::holdsCertificate($person, $event)) {
            throw ValidationException::withMessages([
                'days' => __(':name already has a certificate from :event. Withdraw it first.', ['name' => $person->name, 'event' => $event->title]),
            ]);
        }

        if ($removed === [] && $added === []) {
            return;
        }

        DB::transaction(function () use ($staff, $event, $person, $removed, $added): void {
            $event->checkIns()->where('user_id', $person->id)->whereIn('attended_on', $removed)->delete();
            $this->markDays($staff, $event, $person, $added);
        });

        $this->activity->record(ActivityAction::Updated, ActivityModule::Events, $registration,
            properties: ['days' => array_values(array_unique($days))], actor: $staff,
            label: "the attendance of {$person->name} at {$event->title}");
    }

    /**
     * Takes someone off the list, before any of their days are marked.
     *
     * @throws ValidationException
     */
    public function remove(User $staff, GadEventRegistration $registration): void
    {
        $event = $registration->event;
        $person = $registration->user;

        if ($event->checkIns()->where('user_id', $person->id)->exists()) {
            throw ValidationException::withMessages([
                'registration' => __(':name was checked in, so they stay on the list. Clear their days first.', ['name' => $person->name]),
            ]);
        }

        $this->activity->record(ActivityAction::Removed, ActivityModule::Events, $registration,
            actor: $staff, label: "{$person->name} from {$event->title}");
        $registration->delete();
    }

    /** Whether the person holds a certificate from the event, withdrawn or not. */
    public static function holdsCertificate(User $person, GadEvent $event): bool
    {
        return Certificate::query()
            ->where('user_id', $person->id)
            ->whereHas('eventCertificate', fn (Builder $query) => $query->where('gad_event_id', $event->id))
            ->exists();
    }

    /** @param  list<string>  $days */
    private function markDays(User $staff, GadEvent $event, User $person, array $days): void
    {
        foreach (array_unique($days) as $day) {
            GadEventCheckIn::query()->createOrFirst(
                ['gad_event_id' => $event->id, 'user_id' => $person->id, 'attended_on' => $day],
                [
                    'checked_in_by' => $staff->id,
                    'method' => GadEventCheckIn::MANUAL,
                    'survey_region_id' => $person->regionId(),
                    'survey_hei_id' => $person->survey_hei_id,
                ],
            );
        }
    }

    /**
     * @param  string|null  $closed  The refusal once registration has closed;
     *                               by default, when it closed.
     *
     * @throws ValidationException
     */
    private function ensureOpen(GadEvent $event, ?string $closed): void
    {
        $now = GadEvent::localNow();

        if ($event->acceptsRegistrations($now)) {
            return;
        }

        throw ValidationException::withMessages([
            'registration' => match (true) {
                $event->category === 'deadline' => __('Deadlines have nothing to join.'),
                $event->isCancelled() => __(':event was cancelled.', ['event' => $event->title]),
                $now->greaterThanOrEqualTo($event->finishesAt()) => __(':event has ended.', ['event' => $event->title]),
                default => $closed ?? __('Registration for :event closed on :date.', [
                    'event' => $event->title,
                    'date' => $event->registrationClosesAt()->format('F j, Y, g:i A'),
                ]),
            },
        ]);
    }
}
