import { useForm } from '@inertiajs/react';
import { Pencil, UserRoundPlus } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { DayCheckboxes } from '@/components/events/day-checkboxes';
import InputError from '@/components/input-error';
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
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store, update } from '@/routes/admin/events/guests';
import type { EventDetail, EventGuest } from '@/types/events';

type GuestForm = {
    name: string;
    organization: string;
    position: string;
    sex: string;
    days: string[];
};

/**
 * A guest without an account, such as someone from another agency
 * (docs/event-registration.md): who they are, as their certificate prints
 * them, and the days they came. No Virtual ID or QR.
 */
export function GuestDialog({
    event,
    days,
    guest,
}: {
    event: EventDetail;
    /** The days that may be marked, Y-m-d. */
    days: string[];
    /** Editing this guest; adding one without it. */
    guest?: EventGuest;
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const initial: GuestForm = {
        name: guest?.name ?? '',
        organization: guest?.organization ?? '',
        position: guest?.position ?? '',
        sex: guest?.sex ?? '',
        days: guest?.days ?? [],
    };
    const form = useForm<GuestForm>(initial);
    const errors = form.errors as Partial<
        Record<keyof GuestForm | 'registration', string>
    >;

    function submit(submitEvent: FormEvent<HTMLFormElement>) {
        submitEvent.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);

                if (!guest) {
                    form.reset();
                }
            },
        };

        form.transform((data) => ({ ...data, sex: data.sex || null }));

        if (guest) {
            form.put(update.url([event.id, guest.id]), options);
        } else {
            form.post(store.url(event.id), options);
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (next) {
                    form.setData(initial);
                    form.clearErrors();
                }
            }}
        >
            <DialogTrigger asChild>
                {guest ? (
                    <Button variant="ghost" size="icon">
                        <Pencil />
                        <span className="sr-only">Edit {guest.name}</span>
                    </Button>
                ) : (
                    <Button variant="outline">
                        <UserRoundPlus />
                        Add guest
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {guest ? `Edit ${guest.name}` : 'Add a guest'}
                    </DialogTitle>
                    <DialogDescription>
                        For someone without a PHLGADIS account, such as a
                        speaker or someone from another agency. Their
                        certificate prints this name and organization; staff
                        download it to hand over.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-name`}>Name</Label>
                        <Input
                            id={`${id}-name`}
                            value={form.data.name}
                            onChange={(changeEvent) =>
                                form.setData('name', changeEvent.target.value)
                            }
                            maxLength={120}
                            autoComplete="off"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-organization`}>
                                Agency or organization
                            </Label>
                            <Input
                                id={`${id}-organization`}
                                value={form.data.organization}
                                onChange={(changeEvent) =>
                                    form.setData(
                                        'organization',
                                        changeEvent.target.value,
                                    )
                                }
                                maxLength={160}
                                placeholder="Such as DepEd Region XII"
                                required
                            />
                            <InputError message={errors.organization} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-position`}>
                                Position (optional)
                            </Label>
                            <Input
                                id={`${id}-position`}
                                value={form.data.position}
                                onChange={(changeEvent) =>
                                    form.setData(
                                        'position',
                                        changeEvent.target.value,
                                    )
                                }
                                maxLength={120}
                            />
                            <InputError message={errors.position} />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-sex`}>Sex (optional)</Label>
                        <FormSelect
                            id={`${id}-sex`}
                            value={form.data.sex}
                            onChange={(sex) => form.setData('sex', sex)}
                            placeholder="Not given"
                            allowEmpty
                            emptyLabel="Not given"
                            options={[
                                { value: 'female', label: 'Female' },
                                { value: 'male', label: 'Male' },
                            ]}
                            className="rounded-[6px] data-[size=default]:h-11 sm:w-56"
                        />
                        <InputError message={errors.sex} />
                    </div>
                    <DayCheckboxes
                        id={`${id}-days`}
                        days={days}
                        value={form.data.days}
                        onChange={(marked) => form.setData('days', marked)}
                        error={errors.days ?? errors.registration}
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {guest ? 'Save guest' : 'Add guest'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
