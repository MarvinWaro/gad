import { useForm } from '@inertiajs/react';
import { CalendarCheck } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { DayCheckboxes } from '@/components/events/day-checkboxes';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { attendance } from '@/routes/admin/events/registrations';
import type { EventDetail, EventRegistration } from '@/types/events';

/**
 * The days someone on the list came, as staff mark them: from the paper
 * sheet, or to undo a check-in made by mistake on an earlier day. A day is
 * never taken from someone who holds the event's certificate.
 */
export function AttendanceDialog({
    event,
    registration,
    days,
}: {
    event: EventDetail;
    registration: EventRegistration;
    /** The days that may be marked, Y-m-d. */
    days: string[];
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const name = registration.person.name ?? 'Someone';
    const form = useForm<{ days: string[] }>({
        days: registration.days ?? [],
    });

    function submit(submitEvent: FormEvent<HTMLFormElement>) {
        submitEvent.preventDefault();
        form.put(attendance.url([event.id, registration.id]), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    form.setData('days', registration.days ?? []);
                    form.clearErrors();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <CalendarCheck />
                    <span className="sr-only">Attendance of {name}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Attendance of {name}</DialogTitle>
                    <DialogDescription>
                        Tick the days they came, as on the paper sheet. Untick a
                        day checked in by mistake.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit}>
                    <DayCheckboxes
                        id={`${id}-days`}
                        days={days}
                        value={form.data.days}
                        onChange={(marked) => form.setData('days', marked)}
                        error={form.errors.days}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing || days.length === 0}
                        >
                            {form.processing && <Spinner />}
                            Save attendance
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
