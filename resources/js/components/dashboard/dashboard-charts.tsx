import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { SegmentedSwitch } from '@/components/dashboard/segmented-switch';
import { Button } from '@/components/ui/button';
import { formatCount, percentOf } from '@/lib/dashboard';
import { cn } from '@/lib/utils';
import type { BreakdownRow, DashboardProps } from '@/types/dashboard';

function DataTooltip({
    active,
    payload,
}: {
    active?: boolean;
    payload?: ReadonlyArray<{
        name?: string;
        value?: number | string;
        payload?: { title?: string };
    }>;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
            <p className="mb-1 text-xs text-muted-foreground">
                {payload[0].payload?.title}
            </p>
            {payload.map((item) => (
                <p key={item.name}>
                    {item.name}:{' '}
                    <span className="font-medium tabular-nums">
                        {formatCount(Number(item.value))}
                    </span>
                </p>
            ))}
        </div>
    );
}

type ActivityMetric = 'responses' | 'posts';

const metrics: Record<
    ActivityMetric,
    { label: string; color: string; dot: string }
> = {
    responses: {
        label: 'Survey responses',
        color: 'var(--chart-2)',
        dot: 'bg-chart-2',
    },
    posts: {
        label: 'Posts shared',
        color: 'var(--chart-3)',
        dot: 'bg-chart-3',
    },
};

/**
 * Survey responses or posts shared over the period, one at a time, with a
 * table view of the same points.
 */
export function ActivityChart({
    trend,
    totals,
    range,
}: {
    trend: DashboardProps['trend'];
    totals: Record<ActivityMetric, number>;
    range: string;
}) {
    const [metric, setMetric] = useState<ActivityMetric>('responses');
    const [table, setTable] = useState(false);
    const { label, color, dot } = metrics[metric];
    return (
        <section
            aria-labelledby="activity-title"
            className="h-full min-w-0 rounded-xl border bg-card p-5 sm:p-6"
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id="activity-title" className="text-lg font-medium">
                        Participation over time
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Small actions. A more connected GAD network.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTable(!table)}
                    aria-pressed={table}
                    aria-label="Show activity data table"
                >
                    {table ? 'Show chart' : 'View data'}
                </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <SegmentedSwitch
                    label="Activity metric"
                    value={metric}
                    onChange={setMetric}
                    options={(['responses', 'posts'] as const).map((value) => ({
                        value,
                        label: metrics[value].label,
                    }))}
                />
                <span className="text-xs text-muted-foreground">{range}</span>
            </div>
            <div
                className="mt-5 h-56"
                role="group"
                aria-label={`${label}: ${formatCount(totals[metric])} in the selected period`}
            >
                {table ? (
                    <div className="h-full overflow-auto rounded-lg border">
                        <table className="w-full text-left text-sm tabular-nums">
                            <caption className="sr-only">
                                {label} by date
                            </caption>
                            <thead className="sticky top-0 bg-muted">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-4 py-2 font-medium"
                                    >
                                        Date
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-4 py-2 text-right font-medium"
                                    >
                                        {label}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {trend.map((row) => (
                                    <tr key={row.title} className="border-t">
                                        <th
                                            scope="row"
                                            className="px-4 py-2 font-normal"
                                        >
                                            {row.title}
                                        </th>
                                        <td className="px-4 py-2 text-right">
                                            {formatCount(row[metric])}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={0}
                    >
                        <AreaChart
                            data={trend}
                            margin={{ top: 10, right: 8, bottom: 0, left: 0 }}
                            accessibilityLayer
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="var(--border)"
                                strokeDasharray="3 5"
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                    fontSize: 12,
                                }}
                                tickMargin={12}
                                minTickGap={20}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: 'var(--muted-foreground)',
                                    fontSize: 12,
                                }}
                                tickMargin={8}
                                allowDecimals={false}
                            />
                            <Tooltip
                                content={<DataTooltip />}
                                cursor={{
                                    stroke: 'var(--brand)',
                                    strokeDasharray: '4 4',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey={metric}
                                name={label}
                                stroke={color}
                                fill={color}
                                fillOpacity={0.08}
                                strokeWidth={2}
                                dot={{
                                    r: 3,
                                    fill: 'var(--card)',
                                    strokeWidth: 2,
                                }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                    <span
                        aria-hidden
                        className={cn('size-2 rounded-full', dot)}
                    />
                    {label}
                </span>
                <span>
                    <span className="font-medium text-foreground tabular-nums">
                        {formatCount(totals[metric])}
                    </span>{' '}
                    in this period
                </span>
            </div>
        </section>
    );
}

/** A slice's colour slot: four hues in a fixed order, and grey for the rest. */
type Slot = 1 | 2 | 3 | 4 | 'other';

export type DonutSlice = {
    key: string;
    label: string;
    value: number;
    slot: Slot;
};

const slotFill: Record<Slot, string> = {
    1: 'var(--series-1)',
    2: 'var(--series-2)',
    3: 'var(--series-3)',
    4: 'var(--series-4)',
    other: 'var(--series-other)',
};

const slotSwatch: Record<Slot, string> = {
    1: 'bg-series-1',
    2: 'bg-series-2',
    3: 'bg-series-3',
    4: 'bg-series-4',
    other: 'bg-series-other',
};

/**
 * Slices for a list in its own fixed order, so each value keeps its colour
 * whatever the filters leave. Past four, values fold into one grey "Other";
 * unanswered ones are grey too.
 */
export function slicesFor(rows: BreakdownRow[]): DonutSlice[] {
    const named = rows.filter((row) => row.value !== 'not-given');
    const rest = rows.filter((row) => row.value === 'not-given');
    const folded = named.slice(4);
    const slices: DonutSlice[] = named.slice(0, 4).map((row, index) => ({
        key: row.value,
        label: row.label,
        value: row.responses,
        slot: (index + 1) as Slot,
    }));
    const grey = [...folded, ...rest].reduce(
        (sum, row) => sum + row.responses,
        0,
    );

    if (folded.length > 0 || rest.length > 0) {
        slices.push({
            key: 'other',
            label: folded.length > 0 ? 'Other or not given' : 'Not given',
            value: grey,
            slot: 'other',
        });
    }

    return slices;
}

function SliceTooltip({
    active,
    payload,
    total,
}: {
    active?: boolean;
    payload?: ReadonlyArray<{ name?: string; value?: number | string }>;
    total: number;
}) {
    if (!active || !payload?.length) return null;
    const value = Number(payload[0].value);
    return (
        <div className="rounded-lg border bg-popover px-3 py-2 text-sm whitespace-nowrap text-popover-foreground shadow-sm">
            {payload[0].name}:{' '}
            <span className="font-medium tabular-nums">
                {formatCount(value)}
            </span>{' '}
            <span className="text-muted-foreground">
                ({percentOf(value, total)}%)
            </span>
        </div>
    );
}

/**
 * A ring of parts beside a legend table that repeats every figure, so the
 * colours are never the only way to read it. Slices sit 2px apart.
 */
export function DonutChart({
    slices,
    unit,
    caption,
}: {
    slices: DonutSlice[];
    /** The total's noun under the figure, such as "responses". */
    unit: string;
    caption: string;
}) {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    const shown = slices.filter((slice) => slice.value > 0);

    return (
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
            <div className="relative aspect-square w-full" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer={false}>
                        <Pie
                            data={shown}
                            dataKey="value"
                            nameKey="label"
                            innerRadius="68%"
                            outerRadius="100%"
                            startAngle={90}
                            endAngle={-270}
                            stroke="var(--card)"
                            strokeWidth={2}
                            isAnimationActive={false}
                            // The table beside it carries the figures; the
                            // ring itself takes no keyboard focus.
                            rootTabIndex={-1}
                        >
                            {shown.map((slice) => (
                                <Cell
                                    key={slice.key}
                                    fill={slotFill[slice.slot]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<SliceTooltip total={total} />}
                            allowEscapeViewBox={{ x: true, y: true }}
                            wrapperStyle={{ zIndex: 20 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl leading-none font-medium tracking-tight tabular-nums">
                        {formatCount(total)}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                        {unit}
                    </span>
                </div>
            </div>
            <table className="w-full text-sm tabular-nums">
                <caption className="sr-only">{caption}</caption>
                <thead className="sr-only">
                    <tr>
                        <th scope="col">Part</th>
                        <th scope="col">Count</th>
                        <th scope="col">Share</th>
                    </tr>
                </thead>
                <tbody>
                    {slices.map((slice) => (
                        <tr key={slice.key}>
                            <th
                                scope="row"
                                className="py-1 pr-2 text-left font-normal"
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            'size-2.5 shrink-0 rounded-[3px]',
                                            slotSwatch[slice.slot],
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'min-w-0',
                                            slice.value === 0 &&
                                                'text-muted-foreground',
                                        )}
                                    >
                                        {slice.label}
                                    </span>
                                </span>
                            </th>
                            <td className="py-1 text-right font-medium">
                                {formatCount(slice.value)}
                            </td>
                            <td className="w-11 py-1 text-right text-muted-foreground">
                                {percentOf(slice.value, total)}%
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function RespondentsChart({
    respondents,
    total,
}: {
    respondents: DashboardProps['respondents'];
    total: number;
}) {
    return (
        <section
            aria-labelledby="respondents-title"
            className="min-w-0 rounded-xl border bg-card p-5 sm:p-6 xl:col-span-4"
        >
            <h2 id="respondents-title" className="text-lg font-medium">
                Whose voices are we hearing?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Responses by respondent group and by sex
            </p>
            {total === 0 ? (
                <p className="mt-6 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    No survey responses in this period yet. Groups and sex
                    appear here as people answer the law surveys.
                </p>
            ) : (
                <>
                    <h3 className="mt-5 mb-2 text-xs font-medium text-muted-foreground">
                        Respondent group
                    </h3>
                    <DonutChart
                        slices={slicesFor(respondents.groups)}
                        unit="responses"
                        caption="Responses by respondent group"
                    />
                    <h3 className="mt-5 mb-2 text-xs font-medium text-muted-foreground">
                        Sex
                    </h3>
                    <DonutChart
                        slices={slicesFor(respondents.sexes)}
                        unit="responses"
                        caption="Responses by sex"
                    />
                </>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
                Response counts, not unique individuals.
            </p>
        </section>
    );
}

const sourceLabels: Record<string, { label: string; slot: Slot }> = {
    public: { label: 'Public HEIs', slot: 1 },
    private: { label: 'Private HEIs', slot: 2 },
    ched: { label: 'CHED offices', slot: 3 },
    unrecorded: { label: 'HEIs, ownership not recorded', slot: 'other' },
};

/** Who shared the period's GAD posts: public or private HEIs, or CHED. */
export function PostSourcesChart({
    sources,
    contributors,
}: {
    sources: DashboardProps['community']['sources'];
    contributors: number;
}) {
    const slices = sources.map((source) => ({
        key: source.value,
        value: source.posts,
        ...sourceLabels[source.value],
    }));

    return (
        <section
            aria-labelledby="sources-title"
            className="min-w-0 rounded-xl border bg-card p-5 sm:p-6 xl:col-span-6"
        >
            <h2 id="sources-title" className="text-lg font-medium">
                Who shares the work
            </h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
                Original GAD posts in this period, by who posted them
            </p>
            {slices.length === 0 ? (
                <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                    No posts in this period yet. Public and private HEIs and
                    CHED offices appear here as they share their GAD activities.
                </p>
            ) : (
                <>
                    <DonutChart
                        slices={slices}
                        unit="posts"
                        caption="Posts by who posted them"
                    />
                    <p className="mt-4 text-xs text-muted-foreground">
                        {contributors === 1
                            ? '1 HEI posted in this period.'
                            : `${formatCount(contributors)} HEIs posted in this period.`}
                    </p>
                </>
            )}
        </section>
    );
}

/** The accounts in view: HEI people, CHED staff, and who waits to join. */
export function AccountsChart({
    accounts,
    footer,
}: {
    accounts: DashboardProps['kpis']['accounts'];
    /** A link to Settings → Users, for accounts that may open it. */
    footer?: ReactNode;
}) {
    return (
        <section
            aria-labelledby="accounts-title"
            className="flex min-w-0 flex-col rounded-xl border bg-card p-5 sm:p-6 xl:col-span-6"
        >
            <h2 id="accounts-title" className="text-lg font-medium">
                People on PHLGADIS
            </h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
                Active accounts by kind, and those awaiting approval
            </p>
            <DonutChart
                slices={[
                    {
                        key: 'hei',
                        label: 'HEI accounts',
                        value: accounts.hei,
                        slot: 1,
                    },
                    {
                        key: 'ched',
                        label: 'CHED staff',
                        value: accounts.ched,
                        slot: 2,
                    },
                    {
                        key: 'pending',
                        label: 'Awaiting approval',
                        value: accounts.pending,
                        slot: 4,
                    },
                ]}
                unit="accounts"
                caption="Accounts by kind and status"
            />
            <p className="mt-4 text-xs text-muted-foreground">
                {accounts.joined === 1
                    ? '1 account joined in this period.'
                    : `${formatCount(accounts.joined)} accounts joined in this period.`}
            </p>
            {footer}
        </section>
    );
}
