import { Link } from '@inertiajs/react';
import { House, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavigationList } from '@/components/navigation-list';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem } from '@/types';

type Tab = {
    key: string;
    label: string;
    icon: LucideIcon;
    href: NavItem['href'];
    /** The pages that light it: one, or a group's (Monitoring). */
    items: NavItem[];
    /** Where the HEI home's guided tour points. */
    tour?: string;
};

/** Text fields that open the phone's keyboard. */
const TYPING =
    'textarea, [contenteditable="true"], input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]):not([type=file]):not([type=range]):not([type=color])';

/**
 * The HEI accounts' navigation on phones and tablets (below 1024px), as a
 * phone app's tab bar: Home, Events, Quest, Monitoring for the HEI's focal
 * persons, and Menu, which opens every page in a sheet from the bottom.
 * A pill floating above the bottom edge: each tab has its icon and name,
 * and a soft purple pill glides behind the current one. It leaves room for the iPhone home indicator and
 * Android's gesture or button bar (safe areas), steps aside while the
 * keyboard is open, and tells the page how much room it takes
 * (--app-bottom-nav on <html>).
 */
export function BottomNav({
    groups,
    active,
}: {
    groups: NavGroup[];
    active: NavItem | null;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    const typing = useTyping();
    const tabs = tabsOf(groups);
    const current = menuOpen
        ? tabs.length
        : tabs.findIndex(
              (tab) => active !== null && tab.items.includes(active),
          );
    const count = tabs.length + 1;

    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('has-bottom-nav');

        return () => root.classList.remove('has-bottom-nav');
    }, []);

    return (
        <nav
            aria-label="Main"
            inert={typing}
            className={cn(
                // Floats above the bottom edge, clear of the iPhone home
                // indicator, Android's gesture or button bar, and the notch
                // when turned sideways; only the pill takes touches.
                'pointer-events-none fixed inset-x-0 bottom-0 z-40 pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:hidden',
                typing && 'translate-y-[150%]',
            )}
        >
            <ul
                className="pointer-events-auto relative mx-auto grid max-w-md rounded-full border bg-background/85 p-1.5 shadow-lg backdrop-blur-md"
                style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}
            >
                {/* The pill behind the current tab: it glides across when
                    the tab changes. */}
                <li
                    aria-hidden
                    className={cn(
                        'pointer-events-none absolute inset-y-1.5 left-1.5 transition-[translate,opacity] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                        current < 0 && 'opacity-0',
                    )}
                    style={{
                        width: `calc((100% - 0.75rem) / ${count})`,
                        translate: `${Math.max(current, 0) * 100}% 0`,
                    }}
                >
                    <span className="block size-full rounded-full bg-brand-soft" />
                </li>
                {tabs.map((tab, index) => (
                    <li key={tab.key}>
                        <Link
                            href={tab.href}
                            prefetch
                            aria-current={
                                index === current ? 'page' : undefined
                            }
                            data-tour={tab.tour}
                            className={tabClass(index === current)}
                        >
                            <TabIcon
                                icon={tab.icon}
                                current={index === current}
                            />
                            {tab.label}
                        </Link>
                    </li>
                ))}
                <li>
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger
                            className={cn(
                                tabClass(menuOpen),
                                'w-full cursor-pointer',
                            )}
                        >
                            <TabIcon icon={Menu} current={menuOpen} />
                            Menu
                        </SheetTrigger>
                        <SheetContent
                            side="bottom"
                            className="max-h-[85dvh] gap-0 rounded-t-2xl bg-sidebar p-0 pb-[max(1rem,env(safe-area-inset-bottom))]"
                        >
                            <SheetHeader className="flex-row items-center gap-1 border-b p-4 text-left">
                                <SheetTitle className="sr-only">
                                    Menu
                                </SheetTitle>
                                <AppLogo />
                            </SheetHeader>
                            <nav
                                aria-label="All pages"
                                className="space-y-4 overflow-y-auto p-3"
                            >
                                <NavigationList
                                    groups={groups}
                                    active={active}
                                />
                            </nav>
                        </SheetContent>
                    </Sheet>
                </li>
            </ul>
        </nav>
    );
}

function tabClass(current: boolean): string {
    return cn(
        'relative flex h-12 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-medium transition-colors duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        current ? 'text-brand' : 'text-muted-foreground',
    );
}

/** The tab's icon: lightly filled and full size while current. */
function TabIcon({
    icon: Icon,
    current,
}: {
    icon: LucideIcon;
    current: boolean;
}) {
    return (
        <Icon
            aria-hidden
            strokeWidth={current ? 2.25 : 2}
            className={cn(
                'size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                current ? 'scale-100 fill-brand/15' : 'scale-[0.92]',
            )}
        />
    );
}

/**
 * The bar's tabs from the one navigation list: each page of the HEI menu
 * (the home under a house, as on a phone), then a group shown as a menu on
 * the desktop header (Monitoring) as one tab to its first page.
 */
function tabsOf(groups: NavGroup[]): Tab[] {
    const home = dashboard.url();

    return groups.flatMap((group): Tab[] =>
        group.menu
            ? group.items.length > 0 && group.icon
                ? [
                      {
                          key: group.label,
                          label: group.label,
                          icon: group.icon,
                          href: group.items[0].href,
                          items: group.items,
                          tour: group.tour,
                      },
                  ]
                : []
            : group.items.map((item) => ({
                  key: item.title,
                  label: item.shortTitle ?? item.title,
                  icon:
                      toUrl(item.href) === home ? House : (item.icon ?? House),
                  href: item.href,
                  items: [item],
                  tour: item.tour,
              })),
    );
}

/** Whether a text field has the keyboard open. */
function useTyping(): boolean {
    const [typing, setTyping] = useState(false);

    useEffect(() => {
        const onFocusIn = (event: FocusEvent) =>
            setTyping(
                event.target instanceof Element && event.target.matches(TYPING),
            );
        const onFocusOut = () => setTyping(false);

        document.addEventListener('focusin', onFocusIn);
        document.addEventListener('focusout', onFocusOut);

        return () => {
            document.removeEventListener('focusin', onFocusIn);
            document.removeEventListener('focusout', onFocusOut);
        };
    }, []);

    return typing;
}
