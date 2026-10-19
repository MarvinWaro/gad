import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import type { ProgramRecord, SexFilter } from '@/data/phlgadis-demo';
import { axisLines } from '@/lib/gad-statistics';

/**
 * The line chart's room per group: enough for its slanted two-line name. A
 * narrower screen scrolls the chart sideways rather than squeezing names.
 */
const LINE_GROUP_WIDTH = 52;
const LINE_AXIS_ROOM = 150;

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
 * the chart scrolls sideways inside its card. Its own module, so the chart
 * library loads only once the homepage shows it.
 */
export default function StatisticsLineChart({
    records,
    sex,
    kindLabel,
    config,
}: {
    records: ProgramRecord[];
    sex: SexFilter;
    kindLabel: string;
    config: ChartConfig;
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
                    config={config}
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
