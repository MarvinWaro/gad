import { router, useForm } from '@inertiajs/react';
import { Check, X } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { fieldClass } from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import { PersonAvatar } from '@/components/person-avatar';
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
import { attendedDays } from '@/lib/certificate-text';
import { formatCount } from '@/lib/dashboard';
import { localDay } from '@/lib/manila-time';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { update } from '@/routes/settings/event-certificates/requests';
import type {
    CertificateRequest,
    CertificateRequestPage,
    EventCertificate,
} from '@/types/certificates';

const statuses: Record<
    CertificateRequest['status'],
    { label: string; tone: 'info' | 'positive' | 'neutral' }
> = {
    pending: { label: 'Waiting', tone: 'info' },
    approved: { label: 'Approved', tone: 'positive' },
    declined: { label: 'Declined', tone: 'neutral' },
};

/**
 * Requests for the certificate from people who missed a day
 * (docs/certificates.md), waiting ones first: who, the days they came and
 * why. Approving gives it to them; declining tells them, with a note.
 */
export function CertificateRequests({
    certificate,
    requests,
}: {
    certificate: EventCertificate;
    requests: CertificateRequestPage;
}) {
    const waiting = requests.data.filter(
        (request) => request.status === 'pending',
    ).length;

    return (
        <section
            aria-labelledby="requests"
            className="overflow-hidden rounded-xl border bg-card"
        >
            <div className="border-b px-4 pt-4 pb-3 sm:px-5">
                <h2 id="requests" className="font-medium">
                    Requests
                </h2>
                <p className="text-[13px] text-muted-foreground">
                    {waiting > 0
                        ? `${formatCount(waiting)} waiting. They missed a day, so it didn't go to them by itself.`
                        : 'From people who missed a day, so it didn’t go to them by itself.'}
                </p>
            </div>
            <ul className="divide-y">
                {requests.data.map((request) => (
                    <RequestItem
                        key={request.id}
                        certificate={certificate}
                        request={request}
                    />
                ))}
            </ul>
            <Pagination
                page={requests.meta}
                label="requests"
                className="sm:px-5"
            />
        </section>
    );
}

function RequestItem({
    certificate,
    request,
}: {
    certificate: EventCertificate;
    request: CertificateRequest;
}) {
    const [approving, setApproving] = useState(false);
    const name = request.person?.name ?? 'Someone';
    const status = statuses[request.status];

    function approve() {
        router.put(
            update.url([certificate.id, request.id]),
            { decision: 'approve' },
            {
                preserveScroll: true,
                onStart: () => setApproving(true),
                onFinish: () => setApproving(false),
            },
        );
    }

    return (
        <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:px-5">
            <PersonAvatar
                name={name}
                src={request.person?.avatar ?? null}
                className="size-10 shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                    {name}
                    <span
                        className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            tones[status.tone].badge,
                        )}
                    >
                        {status.label}
                    </span>
                </p>
                <p className="text-[13px] text-muted-foreground">
                    {request.person?.affiliation}
                </p>
                <p className="text-[13px] text-muted-foreground">
                    {request.days && request.days.length > 0
                        ? `Checked in on ${attendedDays(request.days)}`
                        : 'Not checked in'}
                    {' · Asked '}
                    {localDay(request.requested_at)}
                </p>
                <blockquote className="mt-2 border-l-2 pl-3 text-sm text-pretty whitespace-pre-line">
                    {request.reason}
                </blockquote>
                {request.status === 'declined' && request.note && (
                    <p className="text-[13px] text-pretty text-muted-foreground">
                        Note sent: {request.note}
                    </p>
                )}
            </div>
            {request.status === 'pending' && (
                <div className="flex shrink-0 flex-wrap items-start gap-2">
                    <Button size="sm" disabled={approving} onClick={approve}>
                        {approving ? <Spinner /> : <Check />}
                        Approve
                    </Button>
                    <DeclineDialog
                        certificate={certificate}
                        request={request}
                        name={name}
                    />
                </div>
            )}
        </li>
    );
}

function DeclineDialog({
    certificate,
    request,
    name,
}: {
    certificate: EventCertificate;
    request: CertificateRequest;
    name: string;
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const form = useForm({ decision: 'decline', note: '' });

    function submit(submitEvent: FormEvent<HTMLFormElement>) {
        submitEvent.preventDefault();
        form.put(update.url([certificate.id, request.id]), {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <X />
                    Decline
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Decline the request of {name}?</DialogTitle>
                    <DialogDescription>
                        They are told in their notifications, with your note.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit}>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-note`}>
                            Note for them (optional)
                        </Label>
                        <textarea
                            id={`${id}-note`}
                            value={form.data.note}
                            onChange={(changeEvent) =>
                                form.setData('note', changeEvent.target.value)
                            }
                            rows={3}
                            maxLength={500}
                            placeholder="Such as: the Certificate of Appearance fits the day you came."
                            className={cn(fieldClass, 'h-auto py-2')}
                        />
                        <InputError message={form.errors.note} />
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
                            variant="destructive"
                            disabled={form.processing}
                        >
                            {form.processing && <Spinner />}
                            Decline request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
