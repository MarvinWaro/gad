import { useForm } from '@inertiajs/react';
import { FileQuestion } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { fieldClass } from '@/components/monitoring/shared';
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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store } from '@/routes/events/certificate-requests';
import type { RequestableCertificate } from '@/types/certificates';
import type { EventDetail } from '@/types/events';

/** Longest reason the server keeps. */
const REASON_LENGTH = 500;

/**
 * Asking for a certificate after missing a day (docs/certificates.md): which
 * of the event's released certificates, and why, such as the one day the
 * person came for. CHED approves or declines, and they are told.
 */
export function RequestCertificateDialog({
    event,
    certificates,
}: {
    event: EventDetail;
    certificates: RequestableCertificate[];
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const form = useForm({
        certificate: certificates[0]?.id ?? '',
        reason: '',
    });

    function submit(submitEvent: FormEvent<HTMLFormElement>) {
        submitEvent.preventDefault();
        form.post(store.url(event), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileQuestion />
                    Request a certificate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request a certificate</DialogTitle>
                    <DialogDescription>
                        Certificates go out by themselves to people present on
                        every day. Say why you need yours; CHED tells you once
                        it answers.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit}>
                    <fieldset className="grid gap-2">
                        <legend className="mb-1 text-sm font-medium">
                            Which certificate
                        </legend>
                        {certificates.map((certificate) => (
                            <label
                                key={certificate.id}
                                htmlFor={`${id}-${certificate.id}`}
                                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                            >
                                <input
                                    id={`${id}-${certificate.id}`}
                                    type="radio"
                                    name={`${id}-certificate`}
                                    value={certificate.id}
                                    checked={
                                        form.data.certificate === certificate.id
                                    }
                                    onChange={() =>
                                        form.setData(
                                            'certificate',
                                            certificate.id,
                                        )
                                    }
                                    className="size-4 accent-foreground"
                                />
                                {certificate.title}
                            </label>
                        ))}
                        <InputError message={form.errors.certificate} />
                    </fieldset>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-reason`}>Why you need it</Label>
                        <textarea
                            id={`${id}-reason`}
                            value={form.data.reason}
                            onChange={(changeEvent) =>
                                form.setData('reason', changeEvent.target.value)
                            }
                            rows={4}
                            maxLength={REASON_LENGTH}
                            required
                            aria-describedby={`${id}-reason-help`}
                            placeholder="Such as: I attended the first day, the part for focal persons."
                            className={cn(fieldClass, 'h-auto py-2')}
                        />
                        <p
                            id={`${id}-reason-help`}
                            className="text-[13px] text-muted-foreground tabular-nums"
                        >
                            {form.data.reason.length} of {REASON_LENGTH}{' '}
                            characters
                        </p>
                        <InputError message={form.errors.reason} />
                    </div>
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
                            disabled={
                                form.processing ||
                                form.data.reason.trim() === ''
                            }
                        >
                            {form.processing && <Spinner />}
                            Send request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
