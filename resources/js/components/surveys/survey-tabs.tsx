import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { summary } from '@/routes/admin/surveys';
import { index as responses } from '@/routes/admin/surveys/responses';

/**
 * Summary | Responses on a survey's pages, as underlined links like
 * Enrollment | Graduates: its answers as charts, or the responses one by one.
 * Accounts that may not read single responses (`survey-responses.view`),
 * such as CHED Focals, have the Summary alone, so no tabs.
 */
export function SurveyTabs({
    surveyId,
    current,
}: {
    surveyId: number;
    current: 'summary' | 'responses';
}) {
    const { auth } = usePage().props;

    if (!auth.permissions.includes('survey-responses.view')) {
        return null;
    }

    const tabs = [
        { key: 'summary', label: 'Summary', href: summary.url(surveyId) },
        { key: 'responses', label: 'Responses', href: responses.url(surveyId) },
    ] as const;

    return (
        <nav aria-label="Survey results" className="flex gap-1 border-b">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={tab.href}
                    aria-current={tab.key === current ? 'page' : undefined}
                    className={cn(
                        '-mb-px flex h-11 items-center border-b-2 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        tab.key === current
                            ? 'border-foreground font-medium text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground',
                    )}
                >
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
}
