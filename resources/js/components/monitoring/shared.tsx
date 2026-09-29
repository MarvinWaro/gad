import { Link } from '@inertiajs/react';
import {
    CircleAlert,
    CircleCheck,
    PencilLine,
    Send,
    Signature,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MonitoringStage } from '@/types/monitoring';

/**
 * Stage pills say whose turn it is, in the admin tables' status colours:
 * amber while the HEI has work to do, brand while CHED reviews, emerald once
 * reviewed.
 */
const stages: Record<
    MonitoringStage,
    { label: string; icon: LucideIcon; className: string }
> = {
    draft: {
        label: 'Draft',
        icon: PencilLine,
        className:
            'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    },
    returned: {
        label: 'Returned for correction',
        icon: CircleAlert,
        className:
            'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    },
    ready: {
        label: 'Ready to sign',
        icon: Signature,
        className:
            'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    },
    submitted: {
        label: 'Submitted',
        icon: Send,
        className: 'bg-brand-soft text-brand',
    },
    reviewed: {
        label: 'Reviewed',
        icon: CircleCheck,
        className:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    },
};

/** Report statuses for filters, as the server stores them. */
export const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'returned', label: 'Returned for correction' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'reviewed', label: 'Reviewed' },
];

export function StagePill({ stage }: { stage: MonitoringStage }) {
    const { label, icon: Icon, className } = stages[stage];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                className,
            )}
        >
            <Icon aria-hidden className="size-3.5" />
            {label}
        </span>
    );
}

export function semesterLabel(semester: number): string {
    return semester === 1 ? 'First Semester' : 'Second Semester';
}

export function periodLabel(report: {
    academic_year: string;
    semester: number;
}): string {
    return `${report.academic_year} · ${semesterLabel(report.semester)}`;
}

/** Dates and times in Philippine time, whatever the viewer's device says. */
export function localDate(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
    }).format(new Date(value));
}

export const fieldClass =
    'min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive sm:text-sm';

export const panelClass = 'rounded-xl border bg-card p-5 sm:p-6';

export function Field({
    label,
    id,
    error,
    hint,
    children,
}: {
    label: ReactNode;
    id: string;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium">
                {label}
            </label>
            {hint && (
                <p id={`${id}-hint`} className="text-sm text-muted-foreground">
                    {hint}
                </p>
            )}
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
    if (last <= 1) {
        return null;
    }

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
