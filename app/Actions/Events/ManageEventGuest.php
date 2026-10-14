<?php

namespace App\Actions\Events;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\GadEvent;
use App\Models\GadEventGuest;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Support\EventAttendance;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * An event's guests without an account, such as people from other agencies
 * (docs/event-registration.md): staff add them, mark the days they came and
 * correct their details. A guest who holds a certificate stays.
 *
 * @phpstan-type GuestDetails array{name: string, organization: string, position: string|null, sex: string|null}
 */
final class ManageEventGuest
{
    public function __construct(
        private readonly ActivityRecorder $activity,
    ) {}

    /**
     * @param  GuestDetails  $details
     * @param  list<string>  $days  Philippine days, Y-m-d
     *
     * @throws ValidationException
     */
    public function add(User $staff, GadEvent $event, array $details, array $days): GadEventGuest
    {
        EventAttendance::ensureListKept($event);
        EventAttendance::ensureDays($event, $days);

        $guest = DB::transaction(function () use ($staff, $event, $details, $days): GadEventGuest {
            $guest = $event->guests()->create([...$details, 'added_by' => $staff->id]);
            $this->markDays($staff, $guest, $days);

            return $guest;
        });
        $guest->setRelation('event', $event);
        $this->activity->record(ActivityAction::Added, ActivityModule::Events, $guest, actor: $staff);

        return $guest;
    }

    /**
     * New details and days. A day is never taken from a guest who holds the
     * event's certificate.
     *
     * @param  GuestDetails  $details
     * @param  list<string>  $days
     *
     * @throws ValidationException
     */
    public function update(User $staff, GadEventGuest $guest, array $details, array $days): void
    {
        $event = $guest->event;
        EventAttendance::ensureListKept($event);
        EventAttendance::ensureDays($event, $days);

        $marked = $guest->days()->pluck('attended_on')->all();
        $removed = array_values(array_diff($marked, $days));

        if ($removed !== [] && $guest->certificates()->exists()) {
            throw ValidationException::withMessages([
                'days' => __(':name already has a certificate from :event. Withdraw it first.', ['name' => $guest->name, 'event' => $event->title]),
            ]);
        }

        DB::transaction(function () use ($staff, $guest, $details, $days, $marked, $removed): void {
            $guest->update($details);
            $guest->days()->whereIn('attended_on', $removed)->delete();
            $this->markDays($staff, $guest, array_values(array_diff($days, $marked)));
        });

        $this->activity->record(ActivityAction::Updated, ActivityModule::Events, $guest,
            properties: ['days' => array_values(array_unique($days))], actor: $staff);
    }

    /** @throws ValidationException */
    public function remove(User $staff, GadEventGuest $guest): void
    {
        if ($guest->certificates()->exists()) {
            throw ValidationException::withMessages([
                'guest' => __(':name has a certificate from this event, so they stay.', ['name' => $guest->name]),
            ]);
        }

        $this->activity->record(ActivityAction::Removed, ActivityModule::Events, $guest, actor: $staff);
        $guest->delete();
    }

    /** @param  list<string>  $days */
    private function markDays(User $staff, GadEventGuest $guest, array $days): void
    {
        foreach (array_unique($days) as $day) {
            $guest->days()->firstOrCreate(['attended_on' => $day], ['marked_by' => $staff->id]);
        }
    }
}
