import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowUpRight,
    ClipboardList,
    FileSpreadsheet,
    Folder,
    LayoutGrid,
    VenusAndMars,
} from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export type QuickLink = { key: string; label: string; href: string | null };

// The icons follow the old portal's quick links.
const icons: Record<string, LucideIcon> = {
    'upload-monitoring': FileSpreadsheet,
    'gad-training-survey': VenusAndMars,
    'gad-compliance-survey': ClipboardList,
    records: Folder,
};

/**
 * The HEI modules, each with its icon. A module without an href is not built
 * yet, so it shows a "Soon" tag instead of pretending to be a link.
 */
export function QuickLinks({
    links,
    className,
}: {
    links: QuickLink[];
    className?: string;
}) {
    const titleId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className={cn('rounded-[10px] border bg-card', className)}
        >
            <h2 id={titleId} className="px-4 pt-4 text-base font-medium">
                Quick links
            </h2>
            <ul className="space-y-0.5 px-2 pt-2 pb-2">
                {links.map((link) => {
                    const Icon = icons[link.key] ?? LayoutGrid;
                    const label = (
                        <>
                            <span
                                aria-hidden
                                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
                            >
                                <Icon className="size-[1.125rem]" />
                            </span>
                            <span className="min-w-0 flex-1">{link.label}</span>
                        </>
                    );

                    return (
                        <li key={link.key}>
                            {link.href ? (
                                <Link
                                    href={link.href}
                                    className="group flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    {label}
                                    <ArrowUpRight
                                        aria-hidden
                                        className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    />
                                </Link>
                            ) : (
                                <div className="flex items-center gap-3 px-2 py-2 text-sm">
                                    {label}
                                    <span className="rounded-[6px] border px-1.5 py-0.5 text-xs leading-none text-muted-foreground">
                                        Soon
                                    </span>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
