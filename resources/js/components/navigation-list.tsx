import { Link } from '@inertiajs/react';
import { BetaTag } from '@/components/beta-tag';
import { SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';

/**
 * The navigation groups as labelled lists, for a sheet on phones and
 * tablets: the top header's side menu, and the bottom bar's Menu. Each link
 * closes the sheet it is in.
 */
export function NavigationList({
    groups,
    active,
}: {
    groups: NavGroup[];
    active: NavItem | null;
}) {
    return (
        <>
            {groups.map((group) => (
                <div key={group.label}>
                    <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                        {group.label}
                    </p>
                    <ul className="space-y-0.5">
                        {group.items.map((item) => (
                            <li key={item.title}>
                                <SheetClose asChild>
                                    <Link
                                        href={item.href}
                                        aria-current={
                                            item === active ? 'page' : undefined
                                        }
                                        className={cn(
                                            'flex min-h-11 items-center gap-3 rounded-md px-2 text-sm transition-colors outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                                            item === active &&
                                                'bg-sidebar-accent font-medium text-sidebar-accent-foreground',
                                        )}
                                    >
                                        {item.icon && (
                                            <item.icon className="size-4 shrink-0" />
                                        )}
                                        {item.title}
                                        {item.beta && (
                                            <BetaTag className="ml-auto" />
                                        )}
                                    </Link>
                                </SheetClose>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </>
    );
}
