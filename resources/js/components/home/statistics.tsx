import { router } from '@inertiajs/react';
import {
    ChartBar,
    ChartNoAxesCombined,
    Info,
    Scale,
    Table2,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DataState, SectionHeading } from '@/components/public/shared';
import type {
    DatasetKind,
    HomepageStatistics,
    ProgramRecord,
    SexFilter,
    StatisticsSource,
} from '@/data/phlgadis-demo';
import {
    axisLines,
    byFemaleShare,
    byTotal,
    femaleShare,
    filterRecords,
    formatNumber,
    largestBar,
    summarize,
} from '@/lib/gad-statistics';
import { localDay } from '@/lib/manila-time';

type DisplayView = 'line' | 'counts' | 'balance' | 'table';

const views = [
    { value: 'line', label: 'Line', icon: ChartNoAxesCombined },
    { value: 'counts', label: 'Counts', icon: ChartBar },
    { value: 'balance', label: 'Balance', icon: Scale },
    { value: 'table', label: 'Table', icon: Table2 },
] as const;

/** Groups listed in Counts before "Show all". */
const COUNT_ROWS = 10;

const chartConfig = {
    male: { label: 'Male', color: 'var(--data-male)' },
    female: { label: 'Female', color: 'var(--data-female)' },
    total: { label: 'Total', color: 'var(--data-total)' },
};

/**
 * The line chart's room per group: enough for its slanted two-line name. A
 * narrower screen scrolls the chart sideways rather than squeezing names.
 */
const LINE_GROUP_WIDTH = 52;
const LINE_AXIS_ROOM = 150;

/** The Select's value for every region; Radix reserves the empty string. */
const ALL_REGIONS = 'all';

/**
 * "See the people behind the numbers.": the enrollment and graduates that
 * regional offices import (App\Support\StudentStatistics), for one region or
 * all of them. The line chart follows the old system's; Counts and Balance
 * list the groups as rows, so every name reads in full at any width.
 */
export function Statistics({
    datasets,
    source,
    regions,
    region,
    place,
    status = 'ready',
    onRetry,
}: HomepageStatistics & {
    status?: 'ready' | 'loading' | 'error';
    onRetry?: () => void;
}) {
    const [selectedYear, setSelectedYear] = useState(datasets[0]?.year ?? '');
    const [kind, setKind] = useState<DatasetKind>('enrollment');
    const [sex, setSex] = useState<SexFilter>('all');
    const [view, setView] = useState<DisplayView>('line');
    const [loading, setLoading] = useState(false);
    const dataset =
        datasets.find((item) => item.year === selectedYear) ?? datasets[0];
    const records = dataset?.[kind] ?? [];
    const visibleRecords = filterRecords(records, sex);
    const totals = summarize(visibleRecords);
    const kindLabel = kind === 'enrollment' ? 'Enrollment' : 'Graduates';
    const noun = kind === 'enrollment' ? 'students' : 'graduates';
    // In the order the marks show them: Balance starts with women, and the
    // line chart adds the total.
    const legend: ('male' | 'female' | 'total')[] =
        view === 'balance'
            ? ['female', 'male']
            : [
                  ...(['male', 'female'] as const).filter(
                      (tone) => sex === 'all' || sex === tone,
                  ),
                  ...(view === 'line' && sex === 'all'
                      ? (['total'] as const)
                      : []),
              ];

    function chooseRegion(value: string) {
        router.get('/', value === ALL_REGIONS ? {} : { region: value }, {
            only: ['statistics'],
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    }

    return (
        <section id="statistics" className="statistics-section">
            <div className="public-container public-section">
                <SectionHeading
                    label="Evidence for equity"
                    title="See the people behind the numbers."
                    description={
                        place
                            ? `${place} Higher Education GAD Statistical Data`
                            : 'Higher Education GAD Statistical Data, all regions'
                    }
                >
                    <div className="statistics-filters">
                        {regions.length > 0 && (
                            <div className="year-control">
                                <label htmlFor="statistics-region">
                                    Region
                                </label>
                                <Select
                                    value={region || ALL_REGIONS}
                                    onValueChange={chooseRegion}
                                >
                                    <SelectTrigger
                                        id="statistics-region"
                                        aria-label="Region"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="public-theme">
                                        <SelectItem value={ALL_REGIONS}>
                                            All regions
                                        </SelectItem>
                                        {regions.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={String(option.id)}
                                            >
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="year-control">
                            <label htmlFor="academic-year">Academic year</label>
                            <Select
                                value={dataset?.year ?? ''}
                                onValueChange={setSelectedYear}
                                disabled={!datasets.length}
                            >
                                <SelectTrigger
                                    id="academic-year"
                                    aria-label="Academic year"
                                >
                                    <SelectValue placeholder="No years available" />
                                </SelectTrigger>
                                <SelectContent className="public-theme">
                                    {datasets.map((item) => (
                                        <SelectItem
                                            key={item.year}
                                            value={item.year}
                                        >
                                            {item.year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </SectionHeading>
                <div className="statistics-toolbar">
                    <div
                        className="segmented-control"
                        role="group"
                        aria-label="Dataset"
                    >
                        {(['enrollment', 'graduates'] as const).map((item) => (
                            <button
                                key={item}
                                aria-pressed={kind === item}
                                onClick={() => setKind(item)}
                            >
                                {item === 'enrollment'
                                    ? 'Enrollment'
                                    : 'Graduates'}
                            </button>
                        ))}
                    </div>
                </div>
                <div
                    aria-busy={loading}
                    className={loading ? 'statistics-loading' : undefined}
                >
                    {status !== 'ready' ? (
                        <DataState state={status} onRetry={onRetry} />
                    ) : records.length === 0 ? (
                        <DataState state="empty" />
                    ) : (
                        <>
                            <div className="stat-grid" aria-live="polite">
                                {sex !== 'female' && (
                                    <StatCard
                                        title={
                                            kind === 'enrollment'
                                                ? 'Male students'
                                                : 'Male graduates'
                                        }
                                        value={totals.male}
                                        percentage={totals.malePercentage}
                                        tone="male"
                                    />
                                )}{' '}
                                {sex !== 'male' && (
                                    <StatCard
                                        title={
                                            kind === 'enrollment'
                                                ? 'Female students'
                                                : 'Female graduates'
                                        }
                                        value={totals.female}
                                        percentage={totals.femalePercentage}
                                        tone="female"
                                    />
                                )}
                                <Card className="stat-card stat-total">
                                    <div className="stat-label">
                                        <span>
                                            {sex === 'all'
                                                ? `Total ${kind}`
                                                : `Selected ${kind}`}
                                        </span>
                                        <Users size={18} />
                                    </div>
                                    <strong>
                                        {formatNumber(totals.total)}
                                    </strong>
                                    <p>
                                        {sex === 'all'
                                            ? `Across ${records.length} discipline groups`
                                            : `${sex === 'male' ? 'Male' : 'Female'} records only`}
                                    </p>
                                </Card>
                            </div>
                            <Card className="chart-card">
                                <div className="chart-heading">
                                    <div>
                                        <h3>{kindLabel} by discipline group</h3>
                                        <p>
                                            {view === 'balance'
                                                ? 'Women’s share of each group, from most to least'
                                                : 'Sex-disaggregated data across CHED discipline groups'}
                                        </p>
                                    </div>
                                    <div
                                        className="chart-view-toggle"
                                        role="group"
                                        aria-label="Data display"
                                    >
                                        {views.map(
                                            ({ value, label, icon: Icon }) => (
                                                <Button
                                                    key={value}
                                                    variant={
                                                        view === value
                                                            ? 'secondary'
                                                            : 'ghost'
                                                    }
                                                    size="sm"
                                                    aria-pressed={
                                                        view === value
                                                    }
                                                    onClick={() =>
                                                        setView(value)
                                                    }
                                                >
                                                    <Icon />
                                                    {label}
                                                </Button>
                                            ),
                                        )}
                                    </div>
                                </div>
                                <div className="chart-controls">
                                    {/* A share needs both, so Balance has no sex filter. */}
                                    {view !== 'balance' && (
                                        <div
                                            className="sex-filter"
                                            role="group"
                                            aria-label="Filter by sex"
                                        >
                                            {(
                                                [
                                                    'all',
                                                    'male',
                                                    'female',
                                                ] as const
                                            ).map((item) => (
                                                <button
                                                    key={item}
                                                    aria-pressed={sex === item}
                                                    onClick={() => setSex(item)}
                                                >
                                                    {item === 'all'
                                                        ? 'All'
                                                        : item === 'male'
                                                          ? 'Male'
                                                          : 'Female'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="chart-legend">
                                        {legend.map((tone) => (
                                            <span key={tone}>
                                                <i className={`${tone}-dot`} />
                                                {chartConfig[tone].label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {view === 'line' ? (
                                    <GroupLineChart
                                        records={visibleRecords}
                                        sex={sex}
                                        kindLabel={kindLabel}
                                    />
                                ) : view === 'table' ? (
                                    <DataTable
                                        records={visibleRecords}
                                        sex={sex}
                                        caption={`${kindLabel} by discipline group, academic year ${dataset?.year}.`}
                                    />
                                ) : view === 'balance' ? (
                                    <BalanceRows
                                        records={records}
                                        noun={noun}
                                    />
                                ) : (
                                    // Remounted per dataset, so "Show all"
                                    // starts folded for each.
                                    <CountRows
                                        key={`${dataset?.year}-${kind}`}
                                        records={records}
                                        sex={sex}
                                        noun={noun}
                                    />
                                )}
                                <div className="chart-footnote">
                                    <Info size={14} />
                                    <p>{sourceNote(source)}</p>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

/** Where the figures come from and when they last changed. */
function sourceNote(source?: StatisticsSource): string {
    const regions = source?.regions.length
        ? `, from ${source.regions.join(', ')}`
        : '';
    const updated = source?.updated_at
        ? ` Updated ${localDay(source.updated_at)}.`
        : '';

    return `Counts by CHED discipline group${regions}.${updated}`;
}

/**
 * A group's name under its point, slanted and on up to two lines (no word is
 * cut), at 12px like the rest of the chart's text.
 */
function GroupTick({
    x = 0,
    y = 0,
    payload,
}: {
    x?: number;
    y?: number;
    payload?: { value: string };
}) {
    const lines = axisLines(payload?.value ?? '');

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                transform="rotate(-40)"
                textAnchor="end"
                fontSize={12}
                fill="var(--muted-foreground)"
            >
                {lines.map((line, index) => (
                    <tspan key={line} x={0} dy={index === 0 ? 8 : 14}>
                        {line}
                    </tspan>
                ))}
            </text>
        </g>
    );
}

/**
 * Line: the old system's chart, male, female and total across the groups in
 * CHED's order. Each group gets room for its full name; on a narrow screen
 * the chart scrolls sideways inside its card.
 */
function GroupLineChart({
    records,
    sex,
    kindLabel,
}: {
    records: ProgramRecord[];
    sex: SexFilter;
    kindLabel: string;
}) {
    const data = records.map((record) => ({
        ...record,
        total: record.male + record.female,
    }));
    const formatTick = (value: number) =>
        value >= 1000 ? `${value / 1000}k` : String(value);

    return (
        <>
            <div
                className="chart-scroll"
                role="region"
                aria-label={`${kindLabel} line chart. Use the Table button for exact figures.`}
                tabIndex={0}
            >
                <ChartContainer
                    config={chartConfig}
                    style={{
                        minWidth:
                            records.length * LINE_GROUP_WIDTH + LINE_AXIS_ROOM,
                    }}
                >
                    <LineChart
                        accessibilityLayer
                        data={data}
                        margin={{ top: 12, right: 24, bottom: 4, left: 64 }}
                    >
                        <CartesianGrid
                            vertical={false}
                            stroke="var(--border)"
                            strokeDasharray="3 4"
                        />
                        <XAxis
                            dataKey="program"
                            interval={0}
                            height={124}
                            tickLine={false}
                            axisLine={false}
                            tick={<GroupTick />}
                        />
                        <YAxis
                            width={48}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fill: 'var(--muted-foreground)',
                                fontSize: 12,
                            }}
                            tickFormatter={formatTick}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        {sex !== 'female' && (
                            <Line
                                dataKey="male"
                                name="Male"
                                type="linear"
                                stroke="var(--color-male)"
                                strokeWidth={2}
                                dot={{ r: 3, strokeWidth: 2 }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={false}
                            />
                        )}
                        {sex !== 'male' && (
                            <Line
                                dataKey="female"
                                name="Female"
                                type="linear"
                                stroke="var(--color-female)"
                                strokeWidth={2}
                                dot={{ r: 3, strokeWidth: 2 }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={false}
                            />
                        )}
                        {sex === 'all' && (
                            <Line
                                dataKey="total"
                                name="Total"
                                type="linear"
                                stroke="var(--color-total)"
                                strokeWidth={2.5}
                                dot={{ r: 3, strokeWidth: 2 }}
                                activeDot={{ r: 5 }}
                                isAnimationActive={false}
                            />
                        )}
                    </LineChart>
                </ChartContainer>
            </div>
            <p className="chart-scroll-hint">
                Swipe the chart sideways to see every group.
            </p>
        </>
    );
}

/** A row's words for screen readers; the bars themselves are hidden. */
function rowSummary(row: ProgramRecord, noun: string): string {
    return `${row.program}: ${formatNumber(row.male + row.female)} ${noun}; ${formatNumber(row.female)} female, ${formatNumber(row.male)} male.`;
}

/**
 * Counts: each group, largest first, with a bar for men and one for women
 * drawn against the longest bar in view, and every figure printed.
 */
function CountRows({
    records,
    sex,
    noun,
}: {
    records: ProgramRecord[];
    sex: SexFilter;
    noun: string;
}) {
    const [expanded, setExpanded] = useState(false);
    const ranked = byTotal(records);
    const shown = expanded ? ranked : ranked.slice(0, COUNT_ROWS);
    const longest = largestBar(records, sex);
    const bar = (tone: 'male' | 'female', value: number) => (
        <div className="stat-row-bar">
            <span className="stat-row-track">
                <span
                    className={`${tone}-bar`}
                    style={{
                        width: `${longest ? (value / longest) * 100 : 0}%`,
                    }}
                />
            </span>
            <span className="stat-row-value">{formatNumber(value)}</span>
        </div>
    );

    return (
        <>
            <ol className="stat-rows">
                {shown.map((row) => (
                    <li key={row.program} className="stat-row">
                        <div className="stat-row-head" aria-hidden="true">
                            <span>{row.program}</span>
                            <strong>
                                {formatNumber(
                                    (sex === 'female' ? 0 : row.male) +
                                        (sex === 'male' ? 0 : row.female),
                                )}
                            </strong>
                        </div>
                        <span className="sr-only">{rowSummary(row, noun)}</span>
                        <div className="stat-row-bars" aria-hidden="true">
                            {sex !== 'female' && bar('male', row.male)}
                            {sex !== 'male' && bar('female', row.female)}
                        </div>
                    </li>
                ))}
            </ol>
            {ranked.length > COUNT_ROWS && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="stat-rows-more"
                    aria-expanded={expanded}
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded
                        ? 'Show fewer discipline groups'
                        : `Show all ${ranked.length} discipline groups`}
                </Button>
            )}
        </>
    );
}

/**
 * Balance: each group's women and men as one bar, women from the start, with
 * a line at an even split. Ranked by women's share, so the groups read as a
 * spectrum from mostly women to mostly men.
 */
function BalanceRows({
    records,
    noun,
}: {
    records: ProgramRecord[];
    noun: string;
}) {
    return (
        <>
            <ol className="stat-rows stat-rows-compact">
                {byFemaleShare(records).map((row) => {
                    const female = femaleShare(row);
                    const total = row.male + row.female;

                    return (
                        <li key={row.program} className="stat-row">
                            <div className="stat-row-head" aria-hidden="true">
                                <span>{row.program}</span>
                                <strong>{formatNumber(total)}</strong>
                            </div>
                            <span className="sr-only">
                                {rowSummary(row, noun)} {female}% female.
                            </span>
                            <div className="stat-row-split" aria-hidden="true">
                                <span>{female}% female</span>
                                <span className="stat-row-split-track">
                                    {row.female > 0 && (
                                        <span
                                            className="female-bar"
                                            style={{ width: `${female}%` }}
                                        />
                                    )}
                                    {row.male > 0 && (
                                        <span className="male-bar" />
                                    )}
                                    <i />
                                </span>
                                <span>{total ? 100 - female : 0}% male</span>
                            </div>
                        </li>
                    );
                })}
            </ol>
            <p className="stat-rows-note">
                The line marks an even split between women and men.
            </p>
        </>
    );
}

function StatCard({
    title,
    value,
    percentage,
    tone,
}: {
    title: string;
    value: number;
    percentage: number;
    tone: 'male' | 'female';
}) {
    return (
        <Card className="stat-card">
            <div className="stat-label">
                <span>{title}</span>
                <i className={`${tone}-dot`} />
            </div>
            <strong>{formatNumber(value)}</strong>
            <p>
                <span>{percentage.toFixed(1)}%</span> of selected records
            </p>
            <div className="stat-track">
                <span
                    className={`${tone}-bar`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </Card>
    );
}

function DataTable({
    records,
    sex,
    caption,
}: {
    records: ProgramRecord[];
    sex: SexFilter;
    caption: string;
}) {
    const totals = summarize(records);
    return (
        <div
            className="data-table-scroll"
            role="region"
            aria-label="Discipline group statistics table"
            tabIndex={0}
        >
            <table className="data-table">
                <caption>{caption}</caption>
                <thead>
                    <tr>
                        <th scope="col">Discipline group</th>
                        {sex !== 'female' && <th scope="col">Male</th>}
                        {sex !== 'male' && <th scope="col">Female</th>}
                        <th scope="col">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((row) => (
                        <tr key={row.program}>
                            <th scope="row">{row.program}</th>
                            {sex !== 'female' && (
                                <td>{formatNumber(row.male)}</td>
                            )}
                            {sex !== 'male' && (
                                <td>{formatNumber(row.female)}</td>
                            )}
                            <td>{formatNumber(row.male + row.female)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <th scope="row">Total</th>
                        {sex !== 'female' && (
                            <td>{formatNumber(totals.male)}</td>
                        )}
                        {sex !== 'male' && (
                            <td>{formatNumber(totals.female)}</td>
                        )}
                        <td>{formatNumber(totals.total)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
}
