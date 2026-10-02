import { Head, router } from '@inertiajs/react';
import { Download, Star, Trash2 } from 'lucide-react';
import { ConfirmPopover } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { Pagination, type Paginated } from '@/components/pagination';
import { StatTile } from '@/components/stat-tile';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
    button,
    destroy,
    exportMethod,
    index,
} from '@/routes/settings/ratings';

type Rating = {
    id: string;
    rating: number;
    suggestion: string | null;
    submitted_at: string;
};
type Summary = {
    total: number;
    average: number | null;
    withSuggestions: number;
    distribution: { rating: number; count: number }[];
};

const submitted = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

/**
 * Settings → Site ratings: the anonymous answers from the homepage's "Rate
 * PHLGADIS" button (components/home/rate-widget.tsx), and the switch that
 * shows or hides that button.
 */
export default function Ratings({
    summary,
    ratings,
    filters,
    buttonEnabled,
    permissions,
}: {
    summary: Summary;
    ratings: Paginated<Rating>;
    filters: { rating: number | null };
    buttonEnabled: boolean;
    permissions: { export: boolean; delete: boolean; update: boolean };
}) {
    const filter = (rating: number | null) =>
        router.get(index.url(), rating ? { rating } : {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });

    return (
        <>
            <Head title="Site ratings" />
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <Heading
                            variant="small"
                            title="Site ratings"
                            description="Anonymous answers from the Rate PHLGADIS button on the homepage. Only the stars, the suggestion and the time are stored."
                        />
                    </div>
                    {permissions.export && summary.total > 0 && (
                        <Button asChild variant="outline" className="shrink-0">
                            <a
                                href={exportMethod.url(
                                    filters.rating
                                        ? { query: { rating: filters.rating } }
                                        : undefined,
                                )}
                            >
                                <Download />
                                Export CSV
                            </a>
                        </Button>
                    )}
                </div>

                <ButtonSwitch
                    enabled={buttonEnabled}
                    canUpdate={permissions.update}
                />

                <dl className="grid gap-3 sm:grid-cols-3">
                    <StatTile
                        label="Average rating"
                        value={
                            summary.average === null
                                ? '—'
                                : summary.average.toFixed(1)
                        }
                        note={
                            summary.average === null
                                ? 'No ratings yet'
                                : 'out of 5'
                        }
                    />
                    <StatTile
                        label="Ratings"
                        value={summary.total.toLocaleString()}
                        note="in total"
                    />
                    <StatTile
                        label="With a suggestion"
                        value={summary.withSuggestions.toLocaleString()}
                        note={
                            summary.total > 0
                                ? `${Math.round((summary.withSuggestions / summary.total) * 100)}% of ratings`
                                : 'Suggestions are optional'
                        }
                    />
                </dl>

                <Breakdown
                    summary={summary}
                    active={filters.rating}
                    onFilter={filter}
                />

                <section
                    className="overflow-hidden rounded-xl border bg-card"
                    aria-labelledby="ratings-list-title"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
                        <h3
                            id="ratings-list-title"
                            className="text-sm font-medium"
                        >
                            {filters.rating
                                ? `${ratings.total.toLocaleString()} ${filters.rating}-star ${ratings.total === 1 ? 'rating' : 'ratings'}`
                                : `${ratings.total.toLocaleString()} ${ratings.total === 1 ? 'rating' : 'ratings'}`}
                        </h3>
                        {filters.rating && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => filter(null)}
                            >
                                Show all ratings
                            </Button>
                        )}
                    </div>
                    {ratings.data.length === 0 ? (
                        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                            {summary.total === 0
                                ? 'No ratings yet. They appear here as visitors use the Rate PHLGADIS button on the homepage.'
                                : 'No ratings with this many stars.'}
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-left text-sm">
                                <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">
                                            Rating
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Suggestion
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Submitted
                                        </th>
                                        {permissions.delete && (
                                            <th className="px-5 py-3 text-right font-medium">
                                                <span className="sr-only">
                                                    Actions
                                                </span>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {ratings.data.map((row) => (
                                        <tr key={row.id} className="align-top">
                                            <td className="px-5 py-4">
                                                <Stars value={row.rating} />
                                            </td>
                                            <td className="max-w-md px-5 py-4 whitespace-pre-line">
                                                {row.suggestion ?? (
                                                    <span className="text-muted-foreground">
                                                        No suggestion
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                                                {submitted.format(
                                                    new Date(row.submitted_at),
                                                )}
                                            </td>
                                            {permissions.delete && (
                                                <td className="px-5 py-3 text-right">
                                                    <ConfirmPopover
                                                        title="Delete this rating?"
                                                        description="Its stars and suggestion are removed for good, and the summary above updates."
                                                        confirmLabel="Delete"
                                                        onConfirm={(visit) =>
                                                            router.delete(
                                                                destroy.url(
                                                                    row.id,
                                                                ),
                                                                {
                                                                    preserveScroll: true,
                                                                    ...visit,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 />
                                                            <span className="sr-only">
                                                                Delete this{' '}
                                                                {row.rating}
                                                                -star rating
                                                            </span>
                                                        </Button>
                                                    </ConfirmPopover>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
                <Pagination page={ratings} label="ratings" />
            </div>
        </>
    );
}

// Shows or hides the homepage's Rate PHLGADIS button.
function ButtonSwitch({
    enabled,
    canUpdate,
}: {
    enabled: boolean;
    canUpdate: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4">
            <div>
                <p id="rating-button-label" className="text-sm font-medium">
                    Rate PHLGADIS button
                </p>
                <p className="text-sm text-muted-foreground">
                    {enabled
                        ? 'Shown at the bottom-left of the homepage.'
                        : 'Hidden. Visitors cannot rate PHLGADIS right now.'}
                </p>
            </div>
            <Switch
                checked={enabled}
                aria-labelledby="rating-button-label"
                disabled={!canUpdate}
                onCheckedChange={(checked) =>
                    router.put(
                        button.url(),
                        { enabled: checked },
                        { preserveScroll: true },
                    )
                }
            />
        </div>
    );
}

// How many ratings gave each number of stars, 5 down to 1. Each row filters
// the list below to that rating, and says its count and share in text.
function Breakdown({
    summary,
    active,
    onFilter,
}: {
    summary: Summary;
    active: number | null;
    onFilter: (rating: number | null) => void;
}) {
    return (
        <section
            className="rounded-xl border bg-card px-5 py-4"
            aria-labelledby="ratings-breakdown-title"
        >
            <h3 id="ratings-breakdown-title" className="text-sm font-medium">
                Ratings by stars
            </h3>
            <p className="text-xs text-muted-foreground">
                Choose a row to list only those ratings.
            </p>
            <ul className="mt-3 space-y-1">
                {summary.distribution.map(({ rating, count }) => {
                    const share = summary.total > 0 ? count / summary.total : 0;
                    const pressed = active === rating;

                    return (
                        <li key={rating}>
                            <button
                                type="button"
                                aria-pressed={pressed}
                                onClick={() =>
                                    onFilter(pressed ? null : rating)
                                }
                                className={cn(
                                    'grid w-full grid-cols-[3.5rem_minmax(0,1fr)_6.5rem] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                    pressed && 'bg-muted',
                                )}
                            >
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                    {rating}
                                    <Star
                                        className="size-3.5 text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">
                                        {rating === 1 ? 'star' : 'stars'}
                                    </span>
                                </span>
                                <span
                                    className="h-2.5 overflow-hidden rounded-r-[4px] bg-muted"
                                    aria-hidden="true"
                                >
                                    <span
                                        className="block h-full rounded-r-[4px] bg-chart-bar"
                                        style={{ width: `${share * 100}%` }}
                                    />
                                </span>
                                <span className="text-right text-xs text-muted-foreground tabular-nums">
                                    {count.toLocaleString()} ·{' '}
                                    {Math.round(share * 100)}%
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

function Stars({ value }: { value: number }) {
    return (
        <span className="inline-flex gap-0.5" title={`${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    aria-hidden="true"
                    className={cn(
                        'size-4',
                        star <= value
                            ? 'fill-chart-bar text-chart-bar'
                            : 'text-muted-foreground/40',
                    )}
                />
            ))}
            <span className="sr-only">{value} out of 5 stars</span>
        </span>
    );
}
