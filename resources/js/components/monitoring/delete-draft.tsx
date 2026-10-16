import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import { ConfirmPopover } from '@/components/confirm-popover';
import { periodLabel } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MonitoringReport } from '@/types/monitoring';

/**
 * Deletes a first draft, never sent to CHED, after asking. Colleagues at the
 * HEI share the report, so it says it goes for them too. `compact` shows the
 * bin alone, for a report's card.
 */
export function DeleteDraft({
    report,
    compact = false,
    className,
}: {
    report: MonitoringReport;
    compact?: boolean;
    className?: string;
}) {
    if (!report.abilities.delete) {
        return null;
    }

    return (
        <ConfirmPopover
            title="Delete this draft?"
            description={`The ${periodLabel(report)} report and every answer in it are deleted for everyone at ${report.place.hei.name}. This cannot be undone.`}
            confirmLabel="Delete draft"
            onConfirm={(visit) =>
                router.delete(
                    MonitoringController.destroy.url(report.id),
                    visit,
                )
            }
        >
            <Button
                type="button"
                variant="ghost"
                size={compact ? 'icon' : 'default'}
                className={cn(
                    'text-destructive hover:text-destructive',
                    compact && 'size-9',
                    className,
                )}
            >
                <Trash2 />
                {compact ? (
                    <span className="sr-only">
                        Delete the {periodLabel(report)} draft
                    </span>
                ) : (
                    'Delete draft'
                )}
            </Button>
        </ConfirmPopover>
    );
}
