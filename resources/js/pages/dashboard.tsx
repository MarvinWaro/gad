import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Building2,
    ClipboardList,
    Heart,
    MessageCircle,
    MessagesSquare,
    Share2,
    Sparkles,
    Users,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
    ActivityChart,
    RespondentsChart,
} from '@/components/dashboard/dashboard-charts';
import {
    dashboardSnapshot,
    formatCount,
    reportingPeriod,
    previewEvents,
    type DashboardPeriod,
} from '@/components/dashboard/dashboard-data';
import { Button } from '@/components/ui/button';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { dashboard } from '@/routes';

function ModuleLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link
            href={href}
            className="inline-flex min-h-9 items-center gap-2 rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
            {children}
            <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
    );
}

export default function Dashboard() {
    const { auth } = usePage().props;
    const [period, setPeriod] = useState<DashboardPeriod>('month');
    const [monthIndex, setMonthIndex] = useState(8);
    const data = dashboardSnapshot(period, monthIndex);
    const can = (permission: string) => auth.permissions.includes(permission);
    const firstName = auth.user.name.trim().split(/\s+/)[0];
    const selectedPeriod = reportingPeriod(period, monthIndex);
    const comparison = selectedPeriod.comparison;

    return (
        <>
            <Head title="Dashboard" />
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-wrap items-end justify-between gap-5">
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            Welcome back, {firstName}.
                        </p>
                        <h1 className="text-3xl font-medium tracking-tight sm:text-[32px]">
                            Your GAD network, at a glance.
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            A shared view of participation, campus connections,
                            and the work ahead.
                        </p>
                    </div>
                    {can('posts.view') && (
                        <Button asChild>
                            <Link href="/community">
                                <MessagesSquare aria-hidden="true" />
                                Open Gender Mainstreaming
                                <ArrowUpRight aria-hidden="true" />
                            </Link>
                        </Button>
                    )}
                </header>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted px-4 py-3">
                    <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Sparkles
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-brand"
                        />
                        <span>
                            <span className="font-medium text-foreground">
                                Dashboard preview.
                            </span>{' '}
                            All figures and events are sample data.
                        </span>
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                        Region XII
                    </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                        <span
                            className="size-2 rounded-full bg-brand"
                            aria-hidden="true"
                        />
                        <span className="font-medium">Regional overview</span>
                        <span className="text-muted-foreground">
                            / All clusters
                        </span>
                    </div>
                    <DashboardFilters
                        period={period}
                        monthIndex={monthIndex}
                        onPeriodChange={setPeriod}
                        onMonthChange={setMonthIndex}
                    />
                </div>

                <dl
                    aria-label="Sample overview metrics"
                    className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card xl:grid-cols-4"
                >
                    {[
                        {
                            label: 'Survey responses',
                            value: formatCount(data.responses),
                            icon: ClipboardList,
                            note: data.responseGrowth
                                ? `${data.responseGrowth} ${comparison}`
                                : comparison,
                            detail: 'Across 4 law surveys',
                        },
                        {
                            label: 'Participating HEIs',
                            value: `${data.participating}`,
                            icon: Building2,
                            note: `${data.reach}% of the network`,
                            detail: `Of ${data.institutions} registered institutions`,
                        },
                        {
                            label: 'Posts shared',
                            value: formatCount(data.posts),
                            icon: MessagesSquare,
                            note: data.postGrowth
                                ? `${data.postGrowth} ${comparison}`
                                : comparison,
                            detail: 'Updates shared by the network',
                        },
                        {
                            label: 'Post interactions',
                            value: formatCount(data.interactions),
                            icon: Heart,
                            note: `${data.contributors} contributing HEIs`,
                            detail: 'Likes, comments, and shares',
                        },
                    ].map(({ label, value, icon: Icon, note, detail }) => (
                        <div
                            key={label}
                            className="border-b p-4 odd:border-r sm:p-5 xl:border-r xl:border-b-0 xl:p-6 xl:last:border-r-0 [&:nth-last-child(-n+2)]:border-b-0"
                        >
                            <dt className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                                {label}
                                <Icon aria-hidden="true" className="size-4" />
                            </dt>
                            <dd className="mt-3 text-4xl leading-none font-medium tracking-tight tabular-nums">
                                {value}
                            </dd>
                            <dd className="mt-3 text-xs font-medium text-brand">
                                {note}
                            </dd>
                            <dd className="mt-1 text-xs text-muted-foreground">
                                {detail}
                            </dd>
                        </div>
                    ))}
                </dl>
                <p className="sr-only" role="status">
                    Showing sample data for {selectedPeriod.label}:{' '}
                    {formatCount(data.responses)} survey responses and{' '}
                    {data.participating} participating institutions.
                </p>

                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                    <div className="min-w-0 md:col-span-2 xl:col-span-8">
                        <ActivityChart
                            data={data}
                            periodLabel={selectedPeriod.range}
                        />
                    </div>

                    <section
                        aria-labelledby="reach-title"
                        className="flex min-w-0 flex-col rounded-xl bg-signature-violet p-5 text-on-signature sm:p-6 md:col-span-2 xl:col-span-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h2
                                id="reach-title"
                                className="text-lg font-medium"
                            >
                                Every campus counts.
                            </h2>
                            <Building2
                                aria-hidden="true"
                                className="size-5 text-on-signature/75"
                            />
                        </div>
                        <p className="mt-1 text-sm text-on-signature/80">
                            Institutions contributing survey responses
                        </p>
                        <div className="mt-5 flex items-end gap-3">
                            <span className="text-5xl leading-none font-medium tracking-tight tabular-nums">
                                {data.reach}%
                            </span>
                            <span className="pb-1 text-sm text-on-signature/80">
                                {data.participating} of {data.institutions} HEIs
                            </span>
                        </div>
                        <div className="mt-6 space-y-3.5">
                            {data.clusters.map((cluster) => (
                                <div key={cluster.name}>
                                    <div className="mb-1.5 flex justify-between gap-3 text-xs">
                                        <span>{cluster.name}</span>
                                        <span className="text-on-signature/80 tabular-nums">
                                            {cluster.participating} /{' '}
                                            {cluster.total}
                                        </span>
                                    </div>
                                    <div
                                        className="h-1.5 overflow-hidden rounded-full bg-on-signature/15"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="h-full rounded-full bg-on-signature/85"
                                            style={{
                                                width: `${(cluster.participating / cluster.total) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-5 border-t border-on-signature/20 pt-4 text-xs leading-relaxed text-on-signature/80">
                            {data.participating === data.institutions
                                ? `All ${data.institutions} registered HEIs contributed survey responses in this period.`
                                : `${data.institutions - data.participating} HEIs have yet to contribute in this period. A check-in with their GAD focal persons could help.`}
                        </p>
                    </section>

                    <section
                        aria-labelledby="surveys-title"
                        className="flex min-w-0 flex-col rounded-xl border bg-card p-5 sm:p-6 xl:col-span-4"
                    >
                        <h2 id="surveys-title" className="text-lg font-medium">
                            Four laws. One shared purpose.
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Response distribution by law survey
                        </p>
                        <div className="my-5 space-y-5">
                            {data.surveys.map((survey) => (
                                <div key={survey.code}>
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <h3 className="font-medium">
                                            {survey.code}
                                        </h3>
                                        <span className="font-medium tabular-nums">
                                            {formatCount(survey.count)}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {survey.title}
                                    </p>
                                    <div
                                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="h-full rounded-full bg-brand"
                                            style={{
                                                width: `${(survey.count / data.responses) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {can('surveys.view') && (
                            <div className="mt-auto border-t pt-3">
                                <ModuleLink href="/admin/surveys">
                                    Manage law surveys
                                </ModuleLink>
                            </div>
                        )}
                    </section>

                    <RespondentsChart data={data} />

                    <section
                        aria-labelledby="community-title"
                        className="flex min-w-0 flex-col rounded-xl border bg-card p-5 sm:p-6 md:col-span-2 xl:col-span-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h2
                                id="community-title"
                                className="text-lg font-medium"
                            >
                                Gender mainstreaming efforts
                            </h2>
                            <MessagesSquare
                                aria-hidden="true"
                                className="size-5 text-brand"
                            />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Conversations beyond the survey form
                        </p>
                        <div className="mt-6 flex items-center gap-4 rounded-lg bg-muted p-4">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent">
                                <Users aria-hidden="true" className="size-5" />
                            </div>
                            <p className="text-sm">
                                <span className="font-medium">
                                    {data.contributors} HEIs shared an update
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    Campus stories, initiatives, and ideas.
                                </span>
                            </p>
                        </div>
                        <dl className="mt-4 divide-y">
                            {[
                                {
                                    label: 'Likes',
                                    count: data.likes,
                                    icon: Heart,
                                },
                                {
                                    label: 'Comments',
                                    count: data.comments,
                                    icon: MessageCircle,
                                },
                                {
                                    label: 'Shares',
                                    count: data.shares,
                                    icon: Share2,
                                },
                            ].map(({ label, count, icon: Icon }) => (
                                <div
                                    key={label}
                                    className="flex items-center justify-between py-3.5"
                                >
                                    <dt className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                        <Icon
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        {label}
                                    </dt>
                                    <dd className="text-sm font-medium tabular-nums">
                                        {formatCount(count)}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            A little encouragement can keep a campus
                            conversation going.
                        </p>
                        {can('posts.view') && (
                            <div className="mt-auto border-t pt-3">
                                <ModuleLink href="/community">
                                    Visit Gender Mainstreaming
                                </ModuleLink>
                            </div>
                        )}
                    </section>

                    <section
                        aria-labelledby="events-title"
                        className="min-w-0 rounded-xl border bg-card p-5 sm:p-6 md:col-span-2 xl:col-span-12"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2
                                    id="events-title"
                                    className="text-lg font-medium"
                                >
                                    2026 event calendar
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {previewEvents.length} sample events · Full
                                    year, independent of the reporting period
                                </p>
                            </div>
                            <ModuleLink href="/events">
                                View calendar
                            </ModuleLink>
                        </div>
                        <div className="mt-5 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
                            {previewEvents.map((event) => (
                                <article
                                    key={event.date}
                                    className="flex items-center gap-4"
                                >
                                    <time
                                        dateTime={event.date}
                                        className="flex w-14 shrink-0 flex-col items-center rounded-lg border bg-muted py-2"
                                    >
                                        <span className="text-xs text-muted-foreground">
                                            {event.month}
                                        </span>
                                        <span className="text-2xl leading-tight font-medium tabular-nums">
                                            {event.day}
                                        </span>
                                    </time>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-medium">
                                            {event.title}
                                        </h3>
                                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span
                                                aria-hidden="true"
                                                className={`size-1.5 shrink-0 rounded-full ${event.color}`}
                                            />
                                            {event.detail}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                </div>
                <p className="pb-2 text-xs text-muted-foreground">
                    Built around participation, not individual identities.
                    Survey figures shown here are aggregate sample counts.
                </p>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
