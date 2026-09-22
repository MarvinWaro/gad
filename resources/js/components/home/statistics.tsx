import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from 'recharts';
import {
    BarChart3,
    ChartNoAxesCombined,
    Info,
    Table2,
    Users,
} from 'lucide-react';
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
    AcademicDataset,
    DatasetKind,
    ProgramRecord,
    SexFilter,
} from '@/data/phlgadis-demo';
import { filterRecords, formatNumber, summarize } from '@/lib/gad-statistics';

const chartConfig = {
    male: { label: 'Male', color: 'var(--data-male)' },
    female: { label: 'Female', color: 'var(--data-female)' },
    total: { label: 'Total', color: 'var(--data-total)' },
};

type DisplayView = 'line' | 'bar' | 'table';

export function Statistics({
    datasets,
    status = 'ready',
    onRetry,
}: {
    datasets: AcademicDataset[];
    status?: 'ready' | 'loading' | 'error';
    onRetry?: () => void;
}) {
    const [selectedYear, setSelectedYear] = useState(datasets[0]?.year ?? '');
    const [kind, setKind] = useState<DatasetKind>('enrollment');
    const [sex, setSex] = useState<SexFilter>('all');
    const [view, setView] = useState<DisplayView>('line');
    const dataset =
        datasets.find((item) => item.year === selectedYear) ?? datasets[0];
    const records = dataset?.[kind] ?? [];
    const visibleRecords = filterRecords(records, sex);
    const totals = summarize(visibleRecords);
    const kindLabel = kind === 'enrollment' ? 'Enrollment' : 'Graduates';

    return (
        <section id="statistics" className="statistics-section">
            <div className="public-container public-section">
                <SectionHeading
                    label="Evidence for equity"
                    title="See the people behind the numbers."
                    description="CHEDRO XII Higher Education GAD Statistical Data"
                >
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
                    <span className="demo-badge">
                        <span />
                        Demo data
                    </span>
                </div>
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
                                <strong>{formatNumber(totals.total)}</strong>
                                <p>
                                    {sex === 'all'
                                        ? 'Across all demo programs'
                                        : `${sex === 'male' ? 'Male' : 'Female'} records only`}
                                </p>
                            </Card>
                        </div>
                        <Card className="chart-card">
                            <div className="chart-heading">
                                <div>
                                    <h3>{kindLabel} by program</h3>
                                    <p>
                                        Sex-disaggregated data across academic
                                        programs
                                    </p>
                                </div>
                                <div
                                    className="chart-view-toggle"
                                    role="group"
                                    aria-label="Data display"
                                >
                                    <Button
                                        variant={
                                            view === 'line'
                                                ? 'secondary'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        aria-pressed={view === 'line'}
                                        onClick={() => setView('line')}
                                    >
                                        <ChartNoAxesCombined />
                                        Line
                                    </Button>
                                    <Button
                                        variant={
                                            view === 'bar'
                                                ? 'secondary'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        aria-pressed={view === 'bar'}
                                        onClick={() => setView('bar')}
                                    >
                                        <BarChart3 />
                                        Bar
                                    </Button>
                                    <Button
                                        variant={
                                            view === 'table'
                                                ? 'secondary'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        aria-pressed={view === 'table'}
                                        onClick={() => setView('table')}
                                    >
                                        <Table2 />
                                        Table
                                    </Button>
                                </div>
                            </div>
                            <div className="chart-controls">
                                <div
                                    className="sex-filter"
                                    role="group"
                                    aria-label="Filter by sex"
                                >
                                    {(['all', 'male', 'female'] as const).map(
                                        (item) => (
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
                                        ),
                                    )}
                                </div>
                                <div className="chart-legend">
                                    {sex !== 'female' && (
                                        <span>
                                            <i className="male-dot" />
                                            Male
                                        </span>
                                    )}
                                    {sex !== 'male' && (
                                        <span>
                                            <i className="female-dot" />
                                            Female
                                        </span>
                                    )}
                                    {view === 'line' && sex === 'all' && (
                                        <span>
                                            <i className="total-dot" />
                                            Total
                                        </span>
                                    )}
                                </div>
                            </div>
                            {view === 'table' ? (
                                <DataTable
                                    records={visibleRecords}
                                    sex={sex}
                                    caption={`${kindLabel} by program, academic year ${dataset?.year}. Demonstration data.`}
                                />
                            ) : (
                                <ProgramChart
                                    records={visibleRecords}
                                    sex={sex}
                                    kindLabel={kindLabel}
                                    type={view}
                                />
                            )}
                            <div className="chart-footnote">
                                <Info size={14} />
                                <p>
                                    Demonstration data only. Program breakdowns
                                    and academic year are illustrative; headline
                                    totals come from the design brief.
                                </p>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </section>
    );
}

function ProgramChart({
    records,
    sex,
    kindLabel,
    type,
}: {
    records: ProgramRecord[];
    sex: SexFilter;
    kindLabel: string;
    type: Exclude<DisplayView, 'table'>;
}) {
    const chartRecords = records.map((record) => ({
        ...record,
        total: record.male + record.female,
    }));
    const formatTick = (value: number) =>
        value >= 1000 ? `${value / 1000}k` : String(value);

    return (
        <div
            className="chart-scroll"
            role="region"
            aria-label={`${kindLabel} ${type} chart. Use the Table button for exact figures.`}
            tabIndex={0}
        >
            <ChartContainer
                config={chartConfig}
                className={type === 'line' ? 'line-chart-container' : undefined}
            >
                {type === 'line' ? (
                    <LineChart
                        accessibilityLayer
                        data={chartRecords}
                        margin={{ top: 12, right: 20, bottom: 10, left: 4 }}
                    >
                        <CartesianGrid
                            vertical={false}
                            stroke="var(--border)"
                            strokeDasharray="3 4"
                        />
                        <XAxis
                            dataKey="program"
                            interval={0}
                            angle={-24}
                            textAnchor="end"
                            height={82}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fill: 'var(--muted-foreground)',
                                fontSize: 10,
                            }}
                        />
                        <YAxis
                            width={48}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fill: 'var(--muted-foreground)',
                                fontSize: 10,
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
                ) : (
                    <BarChart
                        accessibilityLayer
                        data={chartRecords}
                        layout="vertical"
                        margin={{ top: 8, right: 28, bottom: 4, left: 0 }}
                        barGap={4}
                        barSize={10}
                    >
                        <CartesianGrid
                            horizontal={false}
                            stroke="var(--border)"
                            strokeDasharray="3 4"
                        />
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fill: 'var(--muted-foreground)',
                                fontSize: 11,
                            }}
                            tickFormatter={formatTick}
                        />
                        <YAxis
                            dataKey="program"
                            type="category"
                            width={153}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                                fill: 'var(--foreground)',
                                fontSize: 11,
                            }}
                        />
                        <ChartTooltip
                            cursor={{ fill: 'var(--muted)' }}
                            content={<ChartTooltipContent />}
                        />
                        {sex !== 'female' && (
                            <Bar
                                dataKey="male"
                                name="Male"
                                fill="var(--color-male)"
                                radius={[0, 3, 3, 0]}
                                isAnimationActive={false}
                            />
                        )}
                        {sex !== 'male' && (
                            <Bar
                                dataKey="female"
                                name="Female"
                                fill="var(--color-female)"
                                radius={[0, 3, 3, 0]}
                                isAnimationActive={false}
                            />
                        )}
                    </BarChart>
                )}
            </ChartContainer>
        </div>
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
            aria-label="Program statistics table"
            tabIndex={0}
        >
            <table className="data-table">
                <caption>{caption}</caption>
                <thead>
                    <tr>
                        <th scope="col">Program</th>
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
