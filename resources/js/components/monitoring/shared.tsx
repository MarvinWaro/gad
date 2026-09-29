import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { MonitoringStatus } from '@/types/monitoring';

export const statusLabels: Record<MonitoringStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    returned: 'Returned for correction',
    reviewed: 'Reviewed',
};
export const fieldClass =
    'min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm';
export const panelClass = 'rounded-xl border bg-card p-5 sm:p-6';
export function localDate(value: string) {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
    }).format(new Date(value));
}
export function Status({ status }: { status: MonitoringStatus }) {
    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${status === 'returned' ? 'bg-signature-cream text-foreground' : status === 'reviewed' ? 'bg-brand-soft text-brand' : 'bg-muted text-muted-foreground'}`}
        >
            {statusLabels[status]}
        </span>
    );
}
export function Field({
    label,
    id,
    error,
    children,
}: {
    label: string;
    id: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium">
                {label}
            </label>
            {children}
            {error && (
                <p
                    id={`${id}-error`}
                    role="alert"
                    className="text-sm text-destructive"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
export function Errors({ errors }: { errors: Record<string, string> }) {
    const messages = [...new Set(Object.values(errors).filter(Boolean))];
    return messages.length ? (
        <div
            role="alert"
            className="rounded-lg border border-destructive/40 bg-card p-4 text-sm text-destructive"
        >
            <p className="font-medium">Please check the report.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
                {messages.map((message) => (
                    <li key={message}>{message}</li>
                ))}
            </ul>
        </div>
    ) : null;
}
export function Pagination({
    prev,
    next,
    page,
    last,
}: {
    prev: string | null;
    next: string | null;
    page: number;
    last: number;
}) {
    return (
        <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"
        >
            <p className="text-sm text-muted-foreground">
                Page {page} of {last}
            </p>
            <div className="flex gap-2">
                {prev ? (
                    <Button variant="outline" asChild>
                        <Link href={prev}>Previous</Link>
                    </Button>
                ) : (
                    <Button variant="outline" disabled>
                        Previous
                    </Button>
                )}
                {next ? (
                    <Button variant="outline" asChild>
                        <Link href={next}>Next</Link>
                    </Button>
                ) : (
                    <Button variant="outline" disabled>
                        Next
                    </Button>
                )}
            </div>
        </nav>
    );
}
