import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export type QuickLink = { label: string; href: string };

/**
 * Links to what works today, and an honest list of modules that are planned
 * but not built, so nothing pretends to be available.
 */
export function QuickLinks({
    links,
    comingSoon,
    className,
}: {
    links: QuickLink[];
    comingSoon: string[];
    className?: string;
}) {
    const titleId = useId();
    const soonId = useId();

    return (
        <section
            aria-labelledby={titleId}
            className={cn('rounded-[10px] border bg-card', className)}
        >
            <h2 id={titleId} className="px-4 pt-4 text-base font-medium">
                Quick links
            </h2>
            <ul className="px-2 pt-2 pb-2">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className="group flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {link.label}
                            <ArrowUpRight
                                aria-hidden
                                className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                            />
                        </Link>
                    </li>
                ))}
            </ul>

            {comingSoon.length > 0 && (
                <div className="border-t px-4 pt-3 pb-4">
                    <h3 id={soonId} className="text-sm text-muted-foreground">
                        Coming to PHLGADIS
                    </h3>
                    <ul aria-labelledby={soonId} className="mt-2 space-y-2">
                        {comingSoon.map((label) => (
                            <li
                                key={label}
                                className="flex items-center justify-between gap-3 text-sm text-muted-foreground"
                            >
                                {label}
                                <span className="rounded-[6px] border px-1.5 py-0.5 text-[0.6875rem] leading-none">
                                    Soon
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
