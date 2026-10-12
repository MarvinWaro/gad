import { Link, router } from '@inertiajs/react';
import { CalendarPlus, ChevronRight, Search } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { getJson } from '@/hooks/use-inbox';
import { certificateDates } from '@/lib/certificate-text';
import { localDay } from '@/lib/manila-time';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { events as eventOptions, use } from '@/routes/settings/certificates';
import { show as release } from '@/routes/settings/event-certificates';
import type { CalendarEvent } from '@/types';
import type { CertificateDesign, EventCertificate } from '@/types/certificates';

/** "1 person", "12 people". */
function people(count: number): string {
    return count === 1 ? '1 person' : `${count} people`;
}

/** Typing pauses before the events are looked up. */
const SEARCH_DELAY = 300;

/** Released, or waiting with how many are checked in. */
export function ReleaseBadge({ use: certificate }: { use: EventCertificate }) {
    const released = certificate.released_at !== null;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                tones[released ? 'positive' : 'neutral'].badge,
            )}
        >
            {released ? 'Released' : 'Not released'}
        </span>
    );
}

/**
 * The events a design is used on, each opening its release page, and "Use
 * on an event" for one more of the office's events.
 */
export function EventUses({
    design,
    uses,
}: {
    design: CertificateDesign;
    uses: EventCertificate[];
}) {
    const released = uses.some((certificate) => certificate.released_at);

    return (
        <section aria-labelledby="uses" className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="uses" className="font-medium">
                        Used on events
                    </h2>
                    <p className="text-[13px] text-pretty text-muted-foreground">
                        {released
                            ? 'Released certificates keep the design they were released with. To print your changes on them, open the event and update them.'
                            : 'Use it on an event, then release it there once people are checked in.'}
                    </p>
                </div>
                {design.can.use && <UseOnEventDialog design={design} />}
            </div>
            {uses.length > 0 ? (
                <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                    {uses.map((certificate) => (
                        <li key={certificate.id}>
                            <Link
                                href={release.url(certificate.id)}
                                className="flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {certificate.event?.title}
                                    </p>
                                    <p className="text-[13px] text-muted-foreground">
                                        {certificate.event &&
                                            certificateDates(
                                                certificate.event.starts_at,
                                                certificate.event.ends_at,
                                            )}
                                        {' · '}
                                        <span className="tabular-nums">
                                            {certificate.released_at
                                                ? `Released ${localDay(certificate.released_at)} to ${people(certificate.issued ?? 0)}`
                                                : `${people(certificate.eligible ?? 0)} checked in`}
                                        </span>
                                    </p>
                                </div>
                                <ReleaseBadge use={certificate} />
                                <ChevronRight
                                    aria-hidden
                                    className="size-4 shrink-0 text-muted-foreground"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                    Not used on an event yet.
                </p>
            )}
        </section>
    );
}

function UseOnEventDialog({ design }: { design: CertificateDesign }) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [found, setFound] = useState<CalendarEvent[] | null>(null);
    const [failed, setFailed] = useState(false);
    const [chosen, setChosen] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [problem, setProblem] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            getJson<CalendarEvent[]>(
                eventOptions.url(design.id, {
                    query: { q: query.trim() || undefined },
                }),
                controller.signal,
            ).then(
                (events) => {
                    setFailed(events === null);
                    setFound(events ?? []);
                },
                () => {
                    if (!controller.signal.aborted) {
                        setFailed(true);
                    }
                },
            );
        }, SEARCH_DELAY);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [open, query, design.id]);

    function changeOpen(next: boolean) {
        if (next) {
            setQuery('');
            setFound(null);
            setChosen(null);
            setFailed(false);
            setProblem(null);
        }
        setOpen(next);
    }

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <CalendarPlus />
                    Use on an event
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Use on an event</DialogTitle>
                    <DialogDescription>
                        Your office&apos;s events that don&apos;t give a{' '}
                        {design.title} yet. Deadlines aren&apos;t listed.
                    </DialogDescription>
                </DialogHeader>
                <div className="relative">
                    <Search
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        type="search"
                        aria-label="Search events by title"
                        placeholder="Event title"
                        autoComplete="off"
                        className={cn(fieldClass, 'pl-9')}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                </div>
                <fieldset aria-busy={found === null}>
                    <legend className="sr-only">Event</legend>
                    {found === null ? (
                        <div className="grid gap-2">
                            {[0, 1, 2].map((row) => (
                                <Skeleton key={row} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : failed ? (
                        <p role="alert" className="text-sm text-destructive">
                            The events couldn&apos;t be loaded. Try again.
                        </p>
                    ) : found.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            No events to use it on
                            {query.trim() ? ' match this search' : ''}.
                        </p>
                    ) : (
                        <div className="grid max-h-80 gap-1.5 overflow-y-auto">
                            {found.map((event) => (
                                <label
                                    key={event.id}
                                    className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:ring-1 has-checked:ring-primary has-focus-visible:ring-2 has-focus-visible:ring-ring"
                                >
                                    <input
                                        type="radio"
                                        name={`${id}-event`}
                                        className="mt-1"
                                        checked={chosen === event.id}
                                        onChange={() => setChosen(event.id)}
                                    />
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium">
                                            {event.title}
                                        </span>
                                        <span className="block text-[13px] text-muted-foreground">
                                            {certificateDates(
                                                event.starts_at,
                                                event.ends_at,
                                            )}
                                            {event.location
                                                ? ` · ${event.location}`
                                                : ''}
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </fieldset>
                {problem && (
                    <p role="alert" className="text-sm text-destructive">
                        {problem}
                    </p>
                )}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={chosen === null || saving}
                        onClick={() =>
                            chosen !== null &&
                            router.post(
                                use.url(design.id),
                                { event: chosen },
                                {
                                    onStart: () => {
                                        setSaving(true);
                                        setProblem(null);
                                    },
                                    onError: (errors) =>
                                        setProblem(
                                            Object.values(errors)[0] ??
                                                'That didn’t go through. Try again.',
                                        ),
                                    onFinish: () => setSaving(false),
                                },
                            )
                        }
                    >
                        {saving && <Spinner />}
                        Use on this event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
