import { Link } from '@inertiajs/react';
import { formatCount, percentOf } from '@/lib/dashboard';

export type RankedRow = {
    key: string;
    label: string;
    /** A second line, such as a law's title. */
    note?: string;
    count: number;
    /** Opens the row's own page, such as a law's Summary. */
    href?: string;
};

/**
 * Rows of a name, its figure and its share of the whole, each over a
 * `--chart-bar` bar (square at the baseline, 4px-rounded at the tip) on a
 * `muted` track, as the dashboard draws the laws. The figures are text, so
 * the bars are for the eye only.
 */
export function RankedBars({
    rows,
    total,
    unit,
}: {
    rows: RankedRow[];
    /** What the shares are of. */
    total: number;
    /** "responses", for the screen-reader sentence. */
    unit: string;
}) {
    return (
        <ol className="space-y-4">
            {rows.map((row) => (
                <li key={row.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        {row.href ? (
                            <Link
                                href={row.href}
                                className="min-w-0 rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {row.label}
                            </Link>
                        ) : (
                            <span className="min-w-0 font-medium">
                                {row.label}
                            </span>
                        )}
                        <span className="shrink-0 tabular-nums">
                            <span className="font-medium">
                                {formatCount(row.count)}
                            </span>{' '}
                            <span className="text-muted-foreground">
                                · {percentOf(row.count, total)}%
                            </span>
                            <span className="sr-only"> {unit}</span>
                        </span>
                    </div>
                    {row.note && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {row.note}
                        </p>
                    )}
                    <div
                        aria-hidden="true"
                        className="mt-2 h-2 overflow-hidden rounded-r-[4px] bg-muted"
                    >
                        <div
                            className="h-full rounded-r-[4px] bg-chart-bar"
                            style={{ width: `${percentOf(row.count, total)}%` }}
                        />
                    </div>
                </li>
            ))}
        </ol>
    );
}
