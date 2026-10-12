import {
    CircleAlert,
    CircleCheck,
    ScanQrCode,
    TriangleAlert,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { PersonAvatar } from '@/components/person-avatar';
import { Spinner } from '@/components/ui/spinner';
import { localTime } from '@/lib/manila-time';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { ActivityTone } from '@/types/activity';
import type { CheckIn } from '@/types/scanner';

/** What the scanner last did, for the panel beside the camera. */
export type ScanOutcome =
    | { kind: 'idle' }
    | { kind: 'checking'; code: string }
    | { kind: 'checked_in' | 'already_checked_in'; checkIn: CheckIn }
    | { kind: 'problem'; message: string };

/** The colour each outcome is shown in, the camera's outline included. */
export function outcomeTone(outcome: ScanOutcome): ActivityTone {
    switch (outcome.kind) {
        case 'checked_in':
            return 'positive';
        case 'already_checked_in':
            return 'warning';
        case 'problem':
            return 'danger';
        default:
            return 'neutral';
    }
}

/** The person checked in: their photo, name, place and roles, large. */
function Person({ checkIn }: { checkIn: CheckIn }) {
    const { person } = checkIn;

    return (
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <PersonAvatar
                name={person.name ?? ''}
                src={person.avatar}
                className="size-24"
                fallbackClassName="text-2xl"
            />
            <div className="min-w-0 space-y-1">
                <p className="text-2xl font-medium break-words">
                    {person.name}
                </p>
                {person.affiliation && (
                    <p className="text-sm text-muted-foreground">
                        {person.affiliation}
                    </p>
                )}
                {person.region && (
                    <p className="text-sm text-muted-foreground">
                        {person.region}
                    </p>
                )}
                {person.roles.length > 0 && (
                    <ul
                        aria-label="Roles"
                        className="flex flex-wrap justify-center gap-1.5 pt-1 sm:justify-start"
                    >
                        {person.roles.map((role) => (
                            <li
                                key={role}
                                className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
                            >
                                {role}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function ResultHeading({
    tone,
    icon,
    title,
    line,
}: {
    tone: ActivityTone;
    icon: ReactNode;
    title: string;
    line: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <span
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5',
                    tone === 'neutral'
                        ? 'bg-muted text-muted-foreground'
                        : tones[tone].solid,
                )}
            >
                {icon}
            </span>
            <div className="min-w-0">
                <h2 className="text-lg font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{line}</p>
            </div>
        </div>
    );
}

/** "9:02 AM · Scanned", or for a second visit who checked them in first. */
function when(checkIn: CheckIn, again: boolean): string {
    const time = localTime(checkIn.checked_in_at);

    if (again) {
        return checkIn.checked_in_by
            ? `First checked in at ${time} by ${checkIn.checked_in_by}.`
            : `First checked in at ${time}.`;
    }

    return `At ${time} · ${checkIn.method === 'typed' ? 'Typed' : 'Scanned'}`;
}

/**
 * The scan's result beside the camera, large enough to read across a
 * table: who was checked in, that they already were today, or why not.
 * Screen readers hear each change. The last person checked in on this
 * device stays named at the foot.
 */
export function ScanResult({
    outcome,
    hasEvent,
    last,
}: {
    outcome: ScanOutcome;
    hasEvent: boolean;
    last: CheckIn | null;
}) {
    const tone = outcomeTone(outcome);

    return (
        <section
            aria-label="Scan result"
            className={cn(
                'flex min-w-0 flex-col rounded-xl border bg-card',
                tone !== 'neutral' && ['border-l-4', tones[tone].edge],
            )}
        >
            <div
                role="status"
                aria-live="polite"
                className="flex flex-1 flex-col gap-6 p-5 sm:p-6"
            >
                {outcome.kind === 'idle' && (
                    <ResultHeading
                        tone="neutral"
                        icon={<ScanQrCode />}
                        title="Ready to scan"
                        line={
                            hasEvent
                                ? "Hold a Virtual ID's QR inside the frame, or type its Participant ID."
                                : "Pick today's event first."
                        }
                    />
                )}
                {outcome.kind === 'checking' && (
                    <ResultHeading
                        tone="neutral"
                        icon={<Spinner />}
                        title="Checking…"
                        line={outcome.code}
                    />
                )}
                {(outcome.kind === 'checked_in' ||
                    outcome.kind === 'already_checked_in') && (
                    <>
                        <ResultHeading
                            tone={tone}
                            icon={
                                outcome.kind === 'checked_in' ? (
                                    <CircleCheck />
                                ) : (
                                    <TriangleAlert />
                                )
                            }
                            title={
                                outcome.kind === 'checked_in'
                                    ? 'Checked in'
                                    : 'Already checked in today'
                            }
                            line={when(
                                outcome.checkIn,
                                outcome.kind === 'already_checked_in',
                            )}
                        />
                        <Person checkIn={outcome.checkIn} />
                    </>
                )}
                {outcome.kind === 'problem' && (
                    <ResultHeading
                        tone="danger"
                        icon={<CircleAlert />}
                        title="Not checked in"
                        line={outcome.message}
                    />
                )}
            </div>
            {last && (
                <p className="border-t px-5 py-3 text-sm text-muted-foreground sm:px-6">
                    Last checked in:{' '}
                    <span className="font-medium text-foreground">
                        {last.person.name}
                    </span>{' '}
                    · {localTime(last.checked_in_at)}
                </p>
            )}
        </section>
    );
}
