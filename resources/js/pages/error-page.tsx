import { Head, Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    Compass,
    Hourglass,
    House,
    Lock,
    Mail,
    Phone,
    RotateCw,
    TimerReset,
    TriangleAlert,
    Wrench,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import type { SiteOperator } from '@/types/site';

type Status = 403 | 404 | 419 | 429 | 500 | 503;

type Props = {
    status: Status;
    /** Seconds until the rate limit or maintenance ends, when known. */
    retryAfter: number | null;
    operator: SiteOperator;
};

const pages: Record<
    Status,
    { title: string; message: string; icon: LucideIcon; iconClass?: string }
> = {
    403: {
        title: 'You don’t have access',
        message:
            'Your account can’t open this page. If you think it should, ask an administrator.',
        icon: Lock,
    },
    404: {
        title: 'Page not found',
        message:
            'The page you’re looking for isn’t here. It may have moved, or the address may be mistyped.',
        icon: Compass,
        iconClass: 'motion-safe:animate-swing',
    },
    419: {
        title: 'This page expired',
        message:
            'For your security, the page timed out. Refresh it and try again.',
        icon: TimerReset,
    },
    429: {
        title: 'Too many tries',
        message:
            'You’ve tried this a lot in a short time. Please wait a moment.',
        icon: Hourglass,
    },
    500: {
        title: 'Something went wrong',
        message:
            'We hit a problem on our side. Try again in a moment. If it keeps happening, let us know.',
        icon: TriangleAlert,
    },
    503: {
        title: 'Under maintenance',
        message:
            'PHLGADIS is being updated. Please check back in a few minutes.',
        icon: Wrench,
    },
};

const reload = () => window.location.reload();

/**
 * Laravel's error pages in PHLGADIS's look (App\Support\ErrorPage): what
 * happened in plain words, and the one or two ways forward.
 */
export default function ErrorPage({ status, retryAfter, operator }: Props) {
    const { title, message, icon: Icon, iconClass } = pages[status];
    const heading = useRef<HTMLHeadingElement>(null);

    useEffect(() => heading.current?.focus(), []);

    return (
        <>
            <Head title={title} />
            <div className="dot-backdrop bg-background">
                <main className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
                    <div className="motion-safe:slide-in-from-bottom-1.5 flex w-full max-w-md flex-col items-center gap-8 text-center motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in-0">
                        <Link href={home()} aria-label="PHLGADIS home">
                            <AppLogoIcon className="size-9" />
                        </Link>

                        <div className="flex flex-col items-center gap-4">
                            <span className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand">
                                <Icon
                                    aria-hidden
                                    className={cn('size-7', iconClass)}
                                />
                            </span>
                            <p className="text-sm font-semibold tracking-[0.18em] text-brand tabular-nums">
                                Error {status}
                            </p>
                            <h1
                                ref={heading}
                                tabIndex={-1}
                                className="text-2xl font-semibold tracking-tight text-balance outline-none md:text-3xl"
                            >
                                {title}
                            </h1>
                            <p className="text-pretty text-muted-foreground">
                                {message}
                            </p>
                        </div>

                        {status === 503 && <MaintenanceBar />}

                        <Actions status={status} retryAfter={retryAfter} />

                        {status === 500 && <Contact operator={operator} />}
                    </div>
                </main>
            </div>
        </>
    );
}

function Actions({ status, retryAfter }: Pick<Props, 'status' | 'retryAfter'>) {
    switch (status) {
        case 403:
        case 404:
            return (
                <ActionRow>
                    <GoBack />
                    <HomeLink />
                </ActionRow>
            );
        case 429:
            return (
                <ActionRow>
                    <HomeLink />
                    <RetryWhenReady seconds={retryAfter ?? 0} />
                </ActionRow>
            );
        case 503:
            return (
                <ActionRow>
                    <Button onClick={reload}>
                        <RotateCw aria-hidden />
                        Refresh
                    </Button>
                </ActionRow>
            );
        default:
            return (
                <ActionRow>
                    <HomeLink />
                    <Button onClick={reload}>
                        <RotateCw aria-hidden />
                        {status === 419 ? 'Refresh page' : 'Try again'}
                    </Button>
                </ActionRow>
            );
    }
}

// The main action comes last: on the right beside the others, on top on a
// phone.
function ActionRow({ children }: { children: ReactNode }) {
    return (
        <div className="flex w-full flex-col-reverse justify-center gap-3 sm:w-auto sm:flex-row">
            {children}
        </div>
    );
}

function GoBack() {
    // A page opened straight from a link has nowhere to go back to.
    const [canGoBack, setCanGoBack] = useState(false);
    useEffect(() => setCanGoBack(window.history.length > 1), []);

    if (!canGoBack) return null;

    return (
        <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft aria-hidden />
            Go back
        </Button>
    );
}

function HomeLink() {
    return (
        <Button asChild variant="outline">
            <Link href={home()}>
                <House aria-hidden />
                Homepage
            </Link>
        </Button>
    );
}

// "Try again" unlocks when the rate limit lifts; the count is shown, and
// screen readers only hear that it is ready.
function RetryWhenReady({ seconds }: { seconds: number }) {
    const [left, setLeft] = useState(seconds);

    useEffect(() => {
        if (left <= 0) return;
        const timer = window.setTimeout(() => setLeft(left - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [left]);

    const ready = left <= 0;

    return (
        <>
            <Button onClick={reload} disabled={!ready}>
                <RotateCw aria-hidden />
                {ready ? (
                    'Try again'
                ) : (
                    <span aria-hidden className="tabular-nums">
                        Try again in {formatSeconds(left)}
                    </span>
                )}
            </Button>
            <span role="status" className="sr-only">
                {ready
                    ? 'You can try again now.'
                    : left === seconds &&
                      `You can try again in ${seconds} seconds.`}
            </span>
        </>
    );
}

function formatSeconds(total: number): string {
    const minutes = Math.floor(total / 60);
    const seconds = String(total % 60).padStart(2, '0');

    return `${minutes}:${seconds}`;
}

// A thin bar that keeps running while the site updates; still for reduced
// motion, where it reads as a plain rule.
function MaintenanceBar() {
    return (
        <div
            aria-hidden
            className="h-1 w-48 overflow-hidden rounded-full bg-brand-soft"
        >
            <div className="h-full w-2/5 rounded-full bg-brand motion-safe:animate-track motion-reduce:w-full motion-reduce:opacity-40" />
        </div>
    );
}

// TextLink's underline, on plain links: mail and phone leave the app.
const contactLink =
    'tap-target inline-flex items-center gap-1.5 text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500';

function Contact({ operator }: { operator: SiteOperator }) {
    const hotlineHref = `tel:${operator.hotline.replace(/[^\d+]/g, '')}`;

    return (
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <p>{operator.name}</p>
            <p className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                <a href={`mailto:${operator.email}`} className={contactLink}>
                    <Mail aria-hidden className="size-4" />
                    {operator.email}
                </a>
                <a href={hotlineHref} className={contactLink}>
                    <Phone aria-hidden className="size-4" />
                    {operator.hotline}
                </a>
            </p>
        </div>
    );
}
