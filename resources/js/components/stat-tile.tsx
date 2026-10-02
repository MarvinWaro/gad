/**
 * A headline figure for an admin page's summary row, inside a `<dl>`: what
 * it counts, the figure, and a short note under it.
 */
export function StatTile({
    label,
    value,
    note,
}: {
    label: string;
    value: string;
    note: string;
}) {
    return (
        <div className="rounded-xl border bg-card px-5 py-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-3xl font-semibold">{value}</dd>
            <dd className="text-xs text-muted-foreground">{note}</dd>
        </div>
    );
}
