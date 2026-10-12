<?php

namespace App\Actions\Events;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\UserStatus;
use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\ParticipantCode;
use Illuminate\Validation\ValidationException;

/**
 * Checking someone in to a GAD event by the code on their Virtual ID, as
 * the scanner read it or staff typed it (docs/event-check-in.md). Once a
 * day: checking in again finds the first check-in, even when two scanners
 * send it at the same moment. Only a new check-in is logged.
 *
 * @phpstan-type CheckInOutcome array{status: 'checked_in'|'already_checked_in', checkIn: GadEventCheckIn, count: int}
 */
final class CheckInParticipant
{
    public function __construct(
        private readonly ActivityRecorder $activity,
    ) {}

    /**
     * @param  string  $method  One of GadEventCheckIn::METHODS.
     * @return CheckInOutcome
     *
     * @throws ValidationException
     */
    public function handle(User $staff, GadEvent $event, string $code, string $method): array
    {
        $participant = $this->participant($code);
        $now = GadEvent::localNow();

        // The scanner lists today's events only, but a page left open
        // overnight still holds yesterday's.
        if (! GadEvent::query()->whereKey($event->getKey())->openForCheckIn($now)->exists()) {
            throw ValidationException::withMessages([
                'event' => __('Check-in for this event is open only on its own days.'),
            ]);
        }

        $checkIn = GadEventCheckIn::query()->createOrFirst(
            ['gad_event_id' => $event->id, 'user_id' => $participant->id, 'attended_on' => $now->toDateString()],
            [
                'checked_in_by' => $staff->id,
                'method' => $method,
                'survey_region_id' => $participant->regionId(),
                'survey_hei_id' => $participant->survey_hei_id,
            ],
        );
        $checkIn->setRelation('event', $event)->setRelation('user', $participant);

        if ($checkIn->wasRecentlyCreated) {
            $checkIn->setRelation('checker', $staff);
            $this->activity->record(ActivityAction::CheckedIn, ActivityModule::Events, $checkIn, actor: $staff);
        } else {
            $checkIn->load('checker:id,name');
        }

        return [
            'status' => $checkIn->wasRecentlyCreated ? 'checked_in' : 'already_checked_in',
            'checkIn' => $checkIn,
            'count' => $event->checkIns()->where('attended_on', $now->toDateString())->count(),
        ];
    }

    /**
     * The account holding the code, while it may sign in.
     *
     * @throws ValidationException
     */
    private function participant(string $code): User
    {
        $parsed = ParticipantCode::parse($code);

        if ($parsed === null) {
            throw ValidationException::withMessages([
                'code' => __("That isn't a Participant ID. They look like GAD-7K2M-Q9XA."),
            ]);
        }

        $participant = User::query()
            ->where('participant_code', $parsed)
            ->with(['hei:id,name,survey_cluster_id', 'hei.cluster:id,survey_region_id', 'officeRegion:id,name', 'roles:id,name'])
            ->first();

        if ($participant === null) {
            throw ValidationException::withMessages([
                'code' => __('No account has this Participant ID. Check the code and try again.'),
            ]);
        }

        if ($participant->status !== UserStatus::Active) {
            throw ValidationException::withMessages([
                'code' => $participant->status === UserStatus::Pending
                    ? __("This account is still waiting for approval, so it can't be checked in yet.")
                    : __("This account has been deactivated, so it can't be checked in."),
            ]);
        }

        return $participant;
    }
}
