import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Building2,
    CalendarDays,
    ClipboardList,
    Heart,
    MessageCircle,
    MessagesSquare,
    Share2,
    UserRound,
    Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
    AccountsChart,
    ActivityChart,
    PostSourcesChart,
    RespondentsChart,
} from '@/components/dashboard/dashboard-charts';
import { DashboardFilterBar } from '@/components/dashboard/dashboard-filters';
import { GoalInsights } from '@/components/dashboard/goal-insights';
import { EventCategoryLabel } from '@/components/hei/event-category';
import { EventDateBlock } from '@/components/hei/upcoming-events';
import { NoOfficeNotice } from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { changeLabel, formatCount, percentOf } from '@/lib/dashboard';
import { formatEventTime } from '@/lib/event-dates';
import { dashboard } from '@/routes';
import type { DashboardProps } from '@/types/dashboard';

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

export default function Dashboard(props: DashboardProps) {
    const {
        period,
        scope,
        kpis,
        trend,
        laws,
        respondents,
        community,
        goals,
        events,
        hasOffice,
    } = props;
    const { auth } = usePage().props;
    const can = (permission: string) => auth.permissions.includes(permission);
    const firstName = auth.user.name.trim().split(/\s+/)[0];
    const { responses, participation, posts, accounts } = kpis;
    const surveyCount = laws.length;

    return (
        <>
            <Head title="Dashboard" />
            {/* The staff pages' frame: the full width, the same padding at
                every zoom. */}
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
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

                {!hasOffice && <NoOfficeNotice noun="figures" />}

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span
                            className="size-2 rounded-full bg-brand"
                            aria-hidden="true"
                        />
                        <span className="font-medium">{scope.label}</span>
                        <span className="text-muted-foreground">
                            / {period.label}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {period.range} · Philippine time · updated within a
                        minute
                    </p>
                </div>
                <DashboardFilterBar
                    filters={props.filters}
                    options={props.options}
                />

                <dl
                    aria-label="Overview metrics"
                    className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card xl:grid-cols-4"
                >
                    {[
                        {
                            label: 'Survey responses',
                            value: formatCount(responses.value),
                            icon: ClipboardList,
                            note: changeLabel(responses, period.comparison),
                            detail:
                                surveyCount === 1
                                    ? `${laws[0].code} only`
                                    : `Across ${surveyCount} law surveys`,
                        },
                        {
                            label: 'Participating HEIs',
                            value: formatCount(participation.participating),
                            icon: Building2,
                            note: `${percentOf(participation.participating, participation.total)}% of the network`,
                            detail: `Of ${formatCount(participation.total)} active HEIs`,
                        },
                        {
                            label: 'GAD posts',
                            value: formatCount(posts.value),
                            icon: MessagesSquare,
                            note: changeLabel(posts, period.comparison),
                            detail: `${formatCount(posts.tagged)} tagged with an SDG or A.C.H.I.E.V.E. item`,
                        },
                        {
                            label: 'Accounts',
                            value: formatCount(accounts.active),
                            icon: Users,
                            note:
                                accounts.joined > 0
                                    ? `${formatCount(accounts.joined)} new this period`
                                    : 'No new accounts this period',
                            detail: `${formatCount(accounts.hei)} HEI · ${formatCount(accounts.ched)} CHED${accounts.pending > 0 ? ` · ${formatCount(accounts.pending)} awaiting approval` : ''}`,
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
                    Showing {scope.label}, {period.label}:{' '}
                    {formatCount(responses.value)} survey responses,{' '}
                    {formatCount(posts.value)} GAD posts and{' '}
                    {participation.participating} participating institutions.
                </p>

                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
                    <div className="min-w-0 md:col-span-2 xl:col-span-8">
                        <ActivityChart
                            trend={trend}
                            totals={{
                                responses: responses.value,
                                posts: posts.value,
                            }}
                            range={period.range}
                        />
                    </div>

                    <ReachCard
                        reach={props.reach}
                        participation={participation}
                    />

                    <GoalInsights
                        goals={goals}
                        period={period.label}
                        postsHref={can('posts.view') ? '/community' : undefined}
                    />

                    <PostSourcesChart
                        sources={community.sources}
                        contributors={community.contributors}
                    />
                    <AccountsChart
                        accounts={accounts}
                        footer={
                            can('users.view') && (
                                <div className="mt-auto border-t pt-3">
                                    <ModuleLink href="/settings/users">
                                        Manage users
                                    </ModuleLink>
                                </div>
                            )
                        }
                    />

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
                            {laws.map((survey) => (
                                <div key={survey.id}>
                                    <div className="flex items-center justify-between gap-3 text-sm">
                                        <h3 className="font-medium">
                                            {survey.code}
                                        </h3>
                                        <span className="font-medium tabular-nums">
                                            {formatCount(survey.responses)}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {survey.title}
                                    </p>
                                    <div
                                        className="mt-2 h-2 overflow-hidden rounded-r-[4px] bg-muted"
                                        aria-hidden="true"
                                    >
                                        <div
                                            className="h-full rounded-r-[4px] bg-chart-bar"
                                            style={{
                                                width: `${percentOf(survey.responses, responses.value)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {responses.value === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No responses in this period yet. Answers
                                    from the public law surveys count here.
                                </p>
                            )}
                        </div>
                        {can('surveys.view') && (
                            <div className="mt-auto border-t pt-3">
                                <ModuleLink href="/admin/surveys">
                                    Manage law surveys
                                </ModuleLink>
                            </div>
                        )}
                    </section>

                    <RespondentsChart
                        respondents={respondents}
                        total={responses.value}
                    />

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
                                <UserRound
                                    aria-hidden="true"
                                    className="size-5"
                                />
                            </div>
                            <p className="text-sm">
                                <span className="font-medium">
                                    {community.contributors === 1
                                        ? '1 HEI shared an update'
                                        : `${formatCount(community.contributors)} HEIs shared an update`}
                                </span>
                                <span className="mt-1 block text-xs text-muted-foreground">
                                    Campus stories, initiatives, and ideas.
                                </span>
                            </p>
                        </div>
                        <dl className="mt-4 divide-y">
                            {[
                                {
                                    label: 'Reactions',
                                    count: community.reactions,
                                    icon: Heart,
                                },
                                {
                                    label: 'Comments',
                                    count: community.comments,
                                    icon: MessageCircle,
                                },
                                {
                                    label: 'Shares',
                                    count: community.shares,
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
                                    Upcoming GAD events
                                </h2>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    The next events on the calendar, whatever
                                    the period above
                                </p>
                            </div>
                            {/* Staff manage events on the admin page;
                                /events is the HEI home's calendar. */}
                            {can('events.view') && (
                                <ModuleLink href="/admin/events">
                                    Manage events
                                </ModuleLink>
                            )}
                        </div>
                        {events.length === 0 ? (
                            <p className="mt-5 flex items-center gap-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                                <CalendarDays
                                    aria-hidden="true"
                                    className="size-5 shrink-0"
                                />
                                No upcoming events yet. Trainings, campaigns and
                                deadlines added to the calendar show here.
                            </p>
                        ) : (
                            <div className="mt-5 grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">
                                {events.map((event) => (
                                    <article
                                        key={event.id}
                                        className="flex items-center gap-4"
                                    >
                                        <EventDateBlock
                                            value={event.starts_at}
                                            className="bg-muted"
                                        />
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-medium">
                                                {event.title}
                                            </h3>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {formatEventTime(event)}
                                                {event.location &&
                                                    ` · ${event.location}`}
                                            </p>
                                            <EventCategoryLabel
                                                category={event.category}
                                                className="mt-1"
                                            />
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
                <p className="pb-2 text-xs text-muted-foreground">
                    Built around participation, not individual identities.
                    Survey figures are aggregate counts that remain after
                    individual responses reach the end of their retention
                    period.
                </p>
            </div>
        </>
    );
}

/** "Every campus counts": participation by region, or who is still to join in. */
function ReachCard({
    reach,
    participation,
}: Pick<DashboardProps, 'reach'> & {
    participation: DashboardProps['kpis']['participation'];
}) {
    const { participating, total } = participation;
    const { regions, waiting } = reach;

    return (
        <section
            aria-labelledby="reach-title"
            className="flex min-w-0 flex-col rounded-xl bg-signature-violet p-5 text-on-signature sm:p-6 md:col-span-2 xl:col-span-4"
        >
            <div className="flex items-center justify-between gap-3">
                <h2 id="reach-title" className="text-lg font-medium">
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
                    {percentOf(participating, total)}%
                </span>
                <span className="pb-1 text-sm text-on-signature/80">
                    {formatCount(participating)} of {formatCount(total)} HEIs
                </span>
            </div>
            <div className="flex-1">
                {regions.length > 0 && (
                    <ul className="mt-6 space-y-3.5">
                        {regions.map((region) => (
                            <li key={region.id}>
                                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                                    <span className="truncate">
                                        {region.name}
                                    </span>
                                    <span className="text-on-signature/80 tabular-nums">
                                        {region.participating} / {region.total}
                                    </span>
                                </div>
                                <div
                                    className="h-1.5 overflow-hidden rounded-full bg-on-signature/15"
                                    aria-hidden="true"
                                >
                                    <div
                                        className="h-full rounded-full bg-on-signature/85"
                                        style={{
                                            width: `${percentOf(region.participating, region.total)}%`,
                                        }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {regions.length === 0 && waiting.count > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xs font-medium text-on-signature/80">
                            Yet to contribute
                        </h3>
                        <ul className="mt-2 space-y-1.5 text-sm">
                            {waiting.heis.map((hei) => (
                                <li key={hei.id} className="truncate">
                                    {hei.name}
                                </li>
                            ))}
                        </ul>
                        {waiting.count > waiting.heis.length && (
                            <p className="mt-2 text-xs text-on-signature/80">
                                and{' '}
                                {formatCount(
                                    waiting.count - waiting.heis.length,
                                )}{' '}
                                more
                            </p>
                        )}
                    </div>
                )}
            </div>
            <p className="mt-5 border-t border-on-signature/20 pt-4 text-xs leading-relaxed text-on-signature/80">
                {total === 0
                    ? 'No active HEIs in view yet.'
                    : participating === total
                      ? `All ${formatCount(total)} HEIs contributed survey responses in this period.`
                      : `${formatCount(total - participating)} HEIs have yet to contribute in this period. A check-in with their GAD focal persons could help.`}
            </p>
        </section>
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
