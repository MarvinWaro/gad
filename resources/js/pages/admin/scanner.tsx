import { Head, router, useHttp, usePage } from '@inertiajs/react';
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CameraPanel } from '@/components/scanner/camera-panel';
import { EventPicker } from '@/components/scanner/event-picker';
import { ParticipantIdForm } from '@/components/scanner/participant-id-form';
import { RecentCheckIns } from '@/components/scanner/recent-check-ins';
import { outcomeTone, ScanResult } from '@/components/scanner/scan-result';
import type { ScanOutcome } from '@/components/scanner/scan-result';
import { Button } from '@/components/ui/button';
import { useKioskMode } from '@/hooks/use-kiosk-mode';
import { useQrScanner } from '@/hooks/use-qr-scanner';
import { useScanSound } from '@/hooks/use-scan-sound';
import type { CameraStatus } from '@/hooks/use-qr-scanner';
import { manilaInputNow } from '@/lib/manila-time';
import { soundFor } from '@/lib/scan-sounds';
import {
    checkInProblem,
    isCoolingDown,
    readParticipantCode,
} from '@/lib/scanner';
import type { LastRead } from '@/lib/scanner';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { show as scanner } from '@/actions/App/Http/Controllers/Admin/EventScannerController';
import { store } from '@/routes/admin/events/check-ins';
import type { ActivityTone } from '@/types/activity';
import type {
    CheckIn,
    CheckInMethod,
    CheckInResult,
    ScannerEvent,
} from '@/types/scanner';

const cameraBadges: Record<
    CameraStatus,
    { label: string; tone: ActivityTone }
> = {
    off: { label: 'Camera off', tone: 'neutral' },
    starting: { label: 'Starting camera', tone: 'neutral' },
    scanning: { label: 'Scanning', tone: 'positive' },
    problem: { label: 'Camera unavailable', tone: 'danger' },
};

/** How long the camera's outline keeps a result's colour. */
const FLASH_MS = 1200;

function CameraBadge({ status }: { status: CameraStatus }) {
    const badge = cameraBadges[status];

    return (
        <span
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium',
                tones[badge.tone].badge,
            )}
        >
            {status === 'scanning' && (
                <span
                    aria-hidden
                    className="size-2 rounded-full bg-emerald-600 motion-safe:animate-pulse dark:bg-emerald-400"
                />
            )}
            {badge.label}
        </span>
    );
}

/**
 * The QR scanner: staff pick today's event and check people in from their
 * Virtual ID, with the camera or by typing its code (docs/event-check-in.md).
 * The result shows beside the camera, Recent lists everyone checked in today,
 * and on a computer Kiosk mode gives the whole screen to the scanner.
 */
export default function Scanner({
    events,
    event,
    checkedIn,
}: {
    events: ScannerEvent[];
    event: number | null;
    checkedIn: number;
}) {
    const { auth } = usePage().props;
    const selected = events.find((item) => item.id === event) ?? null;
    const kiosk = useKioskMode();
    const sound = useScanSound();
    const video = useRef<HTMLVideoElement>(null);
    const [outcome, setOutcome] = useState<ScanOutcome>({ kind: 'idle' });
    const [last, setLast] = useState<CheckIn | null>(null);
    const [count, setCount] = useState(checkedIn);
    const [flash, setFlash] = useState<ActivityTone | null>(null);
    const [now, setNow] = useState(manilaInputNow);
    const [shownFor, setShownFor] = useState({ event, checkedIn });
    const busy = useRef(false);
    const lastRead = useRef<LastRead>(null);
    const http = useHttp<
        { code: string; method: CheckInMethod },
        CheckInResult
    >({ code: '', method: 'scan' });

    // Another event picked: its own count, and a clean slate.
    if (shownFor.event !== event || shownFor.checkedIn !== checkedIn) {
        setShownFor({ event, checkedIn });
        setCount(checkedIn);

        if (shownFor.event !== event) {
            setOutcome({ kind: 'idle' });
        }
    }

    // Today's events say whether they are under way; that moves with the clock.
    useEffect(() => {
        const timer = window.setInterval(
            () => setNow(manilaInputNow()),
            60_000,
        );

        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!flash) {
            return;
        }

        const timer = window.setTimeout(() => setFlash(null), FLASH_MS);

        return () => window.clearTimeout(timer);
    }, [flash]);

    function show(next: ScanOutcome) {
        setOutcome(next);
        setFlash(next.kind === 'checking' ? null : outcomeTone(next));
        const tone = soundFor(next.kind);

        if (tone) {
            sound.play(tone);
        }
    }

    /** Resolves true once the person is checked in, or already was. */
    async function checkIn(code: string, method: CheckInMethod) {
        if (!selected || busy.current) {
            return false;
        }

        busy.current = true;
        show({ kind: 'checking', code });
        let problem: string | null = null;
        http.transform(() => ({ code, method }));

        try {
            const result = await http
                .post(store.url(selected.id), {
                    onError: (errors) => {
                        const messages: Partial<Record<string, string>> =
                            errors;
                        problem = Object.values(messages)[0] ?? null;
                    },
                    onHttpException: (response) => {
                        problem = checkInProblem(response.status);
                    },
                    onNetworkError: () => {
                        problem =
                            'You appear to be offline. Check the connection, then try again.';
                    },
                })
                .catch(() => undefined);

            if (!result) {
                show({
                    kind: 'problem',
                    message: problem ?? checkInProblem(0),
                });

                return false;
            }

            show({ kind: result.status, checkIn: result.check_in });
            setCount(result.count);

            if (result.status === 'checked_in') {
                setLast(result.check_in);
            }

            return true;
        } finally {
            busy.current = false;
        }
    }

    /** A QR the camera read: a Virtual ID's code, once per person in view. */
    function onRead(text: string) {
        const code = readParticipantCode(text);
        const key = code ?? text;
        const at = Date.now();

        if (busy.current || isCoolingDown(key, lastRead.current, at)) {
            return;
        }

        lastRead.current = { code: key, at };

        if (!code) {
            show({
                kind: 'problem',
                message: "This QR code isn't a PHLGADIS Virtual ID.",
            });
        } else if (!selected) {
            show({ kind: 'problem', message: "Pick today's event first." });
        } else {
            void checkIn(code, 'scan');
        }
    }

    const camera = useQrScanner(video, onRead);

    function pick(next: number) {
        // The same person may come to the next event straight away.
        lastRead.current = null;
        router.get(
            scanner.url({ query: { event: next } }),
            {},
            {
                only: ['event', 'checkedIn'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }

    return (
        <>
            <Head title="QR Scanner" />
            <div
                data-layout={kiosk.kiosk ? 'wide' : undefined}
                className={cn(
                    'flex flex-1 flex-col gap-6 p-4 md:p-6',
                    kiosk.kiosk && 'min-h-svh',
                )}
            >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-2xl font-medium">QR Scanner</h1>
                        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                            Scan a Virtual ID to check someone in to
                            today&apos;s GAD event.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <CameraBadge status={camera.status} />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={sound.toggle}
                        >
                            {sound.enabled ? <Volume2 /> : <VolumeX />}
                            {sound.enabled ? 'Sound on' : 'Sound off'}
                        </Button>
                        {kiosk.kiosk ? (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={kiosk.exit}
                            >
                                <Minimize />
                                Exit kiosk mode
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={kiosk.enter}
                                className="hidden lg:inline-flex"
                            >
                                <Maximize />
                                Kiosk mode
                            </Button>
                        )}
                    </div>
                </div>

                {/* On a computer, as on the registration table's laptop: the
                    event, typing and Recent in a row, then the camera beside
                    the result. On a phone the camera and the result come
                    straight after the event, so a scan's result is in view,
                    and typing and Recent follow them. */}
                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
                    <div className="contents lg:col-span-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-start lg:gap-4">
                        <div className="order-1 min-w-0 lg:order-none">
                            <EventPicker
                                events={events}
                                value={selected?.id ?? null}
                                now={now}
                                canViewEvents={auth.permissions.includes(
                                    'events.view',
                                )}
                                onChange={pick}
                            />
                        </div>
                        <div className="order-4 lg:order-none">
                            <ParticipantIdForm
                                disabled={!selected}
                                busy={http.processing}
                                onSubmit={(code) => checkIn(code, 'typed')}
                            />
                        </div>
                        <div className="order-5 grid gap-2 lg:order-none">
                            {/* Lines the button up with the fields beside it. */}
                            <span
                                aria-hidden
                                className="hidden text-sm leading-none lg:block"
                            >
                                &nbsp;
                            </span>
                            <RecentCheckIns
                                event={selected}
                                count={count}
                                onUndone={(undone, left) => {
                                    setCount(left);

                                    if (last?.id === undone.id) {
                                        setLast(null);
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className="order-2 min-w-0 lg:order-none">
                        <CameraPanel
                            video={video}
                            camera={camera}
                            checking={outcome.kind === 'checking'}
                            flash={flash}
                        />
                    </div>
                    <div className="order-3 min-w-0 lg:order-none">
                        <ScanResult
                            outcome={outcome}
                            hasEvent={selected !== null}
                            last={last}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

Scanner.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'QR Scanner', href: scanner() },
    ],
};
