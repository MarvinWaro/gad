import { CalendarDays } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    monthNames,
    periodLabels,
    type DashboardPeriod,
} from './dashboard-data';

export function DashboardFilters({
    period,
    monthIndex,
    onPeriodChange,
    onMonthChange,
}: {
    period: DashboardPeriod;
    monthIndex: number;
    onPeriodChange: (period: DashboardPeriod) => void;
    onMonthChange: (month: number) => void;
}) {
    const size = period === 'month' ? 1 : period === 'quarter' ? 3 : 6;
    const options =
        period === 'month'
            ? monthNames
            : period === 'quarter'
              ? ['Q1 · Jan–Mar', 'Q2 · Apr–Jun', 'Q3 · Jul–Sep', 'Q4 · Oct–Dec']
              : ['1st semester · Jan–Jun', '2nd semester · Jul–Dec'];
    const triggerClass =
        'w-full min-w-0 rounded-lg bg-card text-base data-[size=default]:h-11 sm:text-sm';
    return (
        <div
            role="group"
            aria-label="Reporting filters"
            className="grid w-full grid-cols-2 items-end gap-3 sm:flex sm:w-auto sm:flex-wrap"
        >
            <div className="min-w-0 sm:w-32">
                <label
                    htmlFor="dashboard-grouping"
                    className="mb-1.5 block text-xs text-muted-foreground"
                >
                    View by
                </label>
                <Select
                    value={period}
                    onValueChange={(value) => {
                        if (
                            value === 'month' ||
                            value === 'quarter' ||
                            value === 'semester' ||
                            value === 'annual'
                        )
                            onPeriodChange(value);
                    }}
                >
                    <SelectTrigger
                        id="dashboard-grouping"
                        className={triggerClass}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(periodLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {period !== 'annual' && (
                <div className="col-span-2 row-start-2 min-w-0 sm:w-56">
                    <label
                        htmlFor="dashboard-period"
                        className="mb-1.5 block text-xs text-muted-foreground"
                    >
                        {periodLabels[period]}
                    </label>
                    <Select
                        value={String(Math.floor(monthIndex / size))}
                        onValueChange={(value) =>
                            onMonthChange(Number(value) * size)
                        }
                    >
                        <SelectTrigger
                            id="dashboard-period"
                            className={triggerClass}
                        >
                            <span className="flex min-w-0 items-center gap-2">
                                <CalendarDays aria-hidden="true" />
                                <SelectValue />
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            {options.map((label, index) => (
                                <SelectItem key={label} value={String(index)}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="col-start-2 row-start-1 min-w-0 sm:w-24">
                <label
                    htmlFor="dashboard-year"
                    className="mb-1.5 block text-xs text-muted-foreground"
                >
                    Year
                </label>
                <Select value="2026" disabled>
                    <SelectTrigger
                        id="dashboard-year"
                        aria-describedby="dashboard-year-help"
                        className={triggerClass}
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2026">2026</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <span
                id="dashboard-year-help"
                className="col-span-2 text-xs text-muted-foreground sm:sr-only"
            >
                Sample data available for 2026.
            </span>
        </div>
    );
}
