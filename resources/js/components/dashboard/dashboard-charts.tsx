import { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    formatCount,
    type ActivityMetric,
    type DashboardSnapshot,
} from './dashboard-data';

function DataTooltip({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: ReadonlyArray<{ name?: string; value?: number | string }>;
    label?: string | number;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-sm">
            {label && (
                <p className="mb-1 text-xs text-muted-foreground">{label}</p>
            )}
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

export function ActivityChart({
    data,
    periodLabel,
}: {
    data: DashboardSnapshot;
    periodLabel: string;
}) {
    const [metric, setMetric] = useState<ActivityMetric>('responses');
    const [table, setTable] = useState(false);
    const label = metric === 'responses' ? 'Survey responses' : 'Posts shared';
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
                <div
                    role="group"
                    aria-label="Activity metric"
                    className="inline-flex rounded-lg bg-muted p-1"
                >
                    {(['responses', 'posts'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={metric === value}
                            onClick={() => setMetric(value)}
                            className={cn(
                                'min-h-9 rounded-md px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                metric === value
                                    ? 'bg-card font-medium text-foreground shadow-xs'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {value === 'responses'
                                ? 'Survey responses'
                                : 'Posts shared'}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-muted-foreground">
                    {periodLabel}
                </span>
            </div>
            <div
                className="mt-5 h-56"
                role="group"
                aria-label={`${label}: ${formatCount(data[metric])} in the selected period`}
            >
                {table ? (
                    <div className="h-full overflow-auto rounded-lg border">
                        <table className="w-full text-left text-sm tabular-nums">
                            <caption className="sr-only">
                                {label} by date, sample data
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
                                {data.activity.map((row) => (
                                    <tr key={row.date} className="border-t">
                                        <th
                                            scope="row"
                                            className="px-4 py-2 font-normal"
                                        >
                                            {row.date}
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
                            data={data.activity}
                            margin={{ top: 10, right: 8, bottom: 0, left: 0 }}
                            accessibilityLayer
                        >
                            <CartesianGrid
                                vertical={false}
                                stroke="var(--border)"
                                strokeDasharray="3 5"
                            />
                            <XAxis
                                dataKey="date"
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
                                stroke={
                                    metric === 'responses'
                                        ? 'var(--chart-2)'
                                        : 'var(--chart-3)'
                                }
                                fill={
                                    metric === 'responses'
                                        ? 'var(--chart-2)'
                                        : 'var(--chart-3)'
                                }
                                fillOpacity={0.08}
                                strokeWidth={2.5}
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
                        className={cn(
                            'size-2 rounded-full',
                            metric === 'responses'
                                ? 'bg-chart-2'
                                : 'bg-chart-3',
                        )}
                    />
                    {label}
                </span>
                <span>
                    <span className="font-medium text-foreground tabular-nums">
                        {formatCount(data[metric])}
                    </span>{' '}
                    in this period
                </span>
            </div>
        </section>
    );
}

export function RespondentsChart({ data }: { data: DashboardSnapshot }) {
    return (
        <section
            aria-labelledby="respondents-title"
            className="min-w-0 rounded-xl border bg-card p-5 sm:p-6 xl:col-span-4"
        >
            <h2 id="respondents-title" className="text-lg font-medium">
                Whose voices are we hearing?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Responses by respondent group
            </p>
            <div
                className="relative mx-auto my-4 h-44 w-44"
                aria-hidden="true"
                inert
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data.respondents}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={62}
                            outerRadius={82}
                            paddingAngle={3}
                            stroke="none"
                            isAnimationActive={false}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-medium tracking-tight tabular-nums">
                        {formatCount(data.responses)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        responses
                    </span>
                </div>
            </div>
            <table className="w-full text-sm tabular-nums">
                <caption className="sr-only">
                    Sample responses by respondent group
                </caption>
                <thead className="sr-only">
                    <tr>
                        <th scope="col">Group</th>
                        <th scope="col">Responses</th>
                        <th scope="col">Share</th>
                    </tr>
                </thead>
                <tbody>
                    {data.respondents.map((group) => (
                        <tr key={group.name} className="border-b last:border-0">
                            <th
                                scope="row"
                                className="py-2.5 text-left font-normal"
                            >
                                <span
                                    className="mr-2.5 inline-block size-2 rounded-full"
                                    style={{ backgroundColor: group.fill }}
                                />
                                {group.name}
                            </th>
                            <td className="py-2.5 text-right font-medium">
                                {formatCount(group.value)}
                            </td>
                            <td className="py-2.5 pl-3 text-right text-muted-foreground">
                                {Math.round(
                                    (group.value / data.responses) * 100,
                                )}
                                %
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
                Response counts, not unique individuals.
            </p>
        </section>
    );
}
