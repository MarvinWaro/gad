import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { parseWallClock } from '@/lib/event-dates';

const dayLabel = new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
});

/**
 * The days someone came, to tick on the list of who joined: the event's
 * days up to today (EventAttendance::markableDays), as from the paper sheet.
 */
export function DayCheckboxes({
    id,
    days,
    value,
    onChange,
    error,
}: {
    id: string;
    /** Y-m-d, the days that may be marked. */
    days: string[];
    value: string[];
    onChange: (days: string[]) => void;
    error?: string;
}) {
    if (days.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                The event hasn&apos;t started, so there are no days to mark yet.
            </p>
        );
    }

    function toggle(day: string, on: boolean) {
        onChange(
            on
                ? [...value, day].sort()
                : value.filter((marked) => marked !== day),
        );
    }

    return (
        <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Days they came</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
                {days.map((day) => (
                    <label
                        key={day}
                        htmlFor={`${id}-${day}`}
                        className="flex min-h-11 cursor-pointer items-center gap-2 text-sm"
                    >
                        <Checkbox
                            id={`${id}-${day}`}
                            checked={value.includes(day)}
                            onCheckedChange={(checked) =>
                                toggle(day, checked === true)
                            }
                        />
                        {dayLabel.format(parseWallClock(`${day}T00:00:00`))}
                    </label>
                ))}
            </div>
            <InputError message={error} />
        </fieldset>
    );
}
