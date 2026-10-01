import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, Menu } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { HeaderActions } from '@/components/header-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { activeNavItem, appNavigationGroups } from '@/lib/app-navigation';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavGroup, NavItem } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

/** A top navigation entry: 40px tall, muted until hovered or current. */
const entryClass =
    'inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * The top header: a brand bar (the name, the icon row and the account), then
 * a row of navigation. On desktop the brand bar scrolls away and the
 * navigation row sticks; on phones the brand bar sticks and holds the menu
 * button. AppShell sets --app-header to match.
 */
export function AppHeader({ breadcrumbs = [] }: Props) {
    const { auth } = usePage().props;
    const groups = appNavigationGroups(auth.permissions, auth.heiOnly);
    const { currentUrl } = useCurrentUrl();
    const active = activeNavItem(groups, currentUrl);

    return (
        <>
            <div className="sticky top-0 z-30 border-b bg-background lg:static lg:border-b-0">
                <div className="mx-auto flex h-14 items-center gap-2 px-4 sm:px-6 md:max-w-7xl lg:px-8">
                    <MobileNavigation groups={groups} active={active} />
                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex min-w-0 items-center gap-1 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        <AppLogo subtitle />
                    </Link>
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                        <HeaderActions navigation="header" />
                        <AccountMenu />
                    </div>
                </div>
            </div>

            <div className="sticky top-0 z-30 hidden border-b bg-background lg:block">
                <nav
                    aria-label="Main"
                    className="mx-auto h-12 px-4 sm:px-6 md:max-w-7xl lg:px-8"
                >
                    {/* Pulled left so the first label lines up with the name. */}
                    <ul className="-ml-3 flex h-full items-stretch gap-1">
                        {groups.flatMap((group) =>
                            group.menu && group.items.length > 1 ? (
                                <TopMenu
                                    key={group.label}
                                    group={group}
                                    active={active}
                                />
                            ) : (
                                group.items.map((item) => (
                                    <TopLink
                                        key={item.title}
                                        item={item}
                                        current={item === active}
                                    />
                                ))
                            ),
                        )}
                    </ul>
                </nav>
            </div>

            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-muted-foreground sm:px-6 md:max-w-7xl lg:px-8">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}

/** The 2px ink line under the current entry, on the row's hairline. */
function CurrentLine() {
    return (
        <span
            aria-hidden
            className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-foreground"
        />
    );
}

function TopLink({ item, current }: { item: NavItem; current: boolean }) {
    return (
        <li className="relative flex items-center">
            <Link
                href={item.href}
                prefetch
                aria-current={current ? 'page' : undefined}
                className={cn(
                    entryClass,
                    current ? 'text-foreground' : 'text-muted-foreground',
                )}
            >
                {item.icon && <item.icon className="size-4" />}
                {item.title}
            </Link>
            {current && <CurrentLine />}
        </li>
    );
}

/** A group shown as one entry that opens its items, like "Monitoring". */
function TopMenu({
    group,
    active,
}: {
    group: NavGroup;
    active: NavItem | null;
}) {
    const current = group.items.some((item) => item === active);

    return (
        <li className="relative flex items-center">
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger
                    className={cn(
                        entryClass,
                        'group/menu data-[state=open]:bg-muted data-[state=open]:text-foreground',
                        current ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {group.icon && <group.icon className="size-4" />}
                    {group.label}
                    <ChevronDown
                        aria-hidden
                        className="size-3.5 transition-transform group-data-[state=open]/menu:rotate-180"
                    />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    {group.items.map((item) => (
                        <DropdownMenuItem
                            key={item.title}
                            asChild
                            className={cn(
                                'min-h-10 cursor-pointer gap-2.5',
                                item === active && 'bg-accent font-medium',
                            )}
                        >
                            <Link
                                href={item.href}
                                prefetch
                                aria-current={
                                    item === active ? 'page' : undefined
                                }
                            >
                                {item.icon && <item.icon className="size-4" />}
                                {item.title}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            {current && <CurrentLine />}
        </li>
    );
}

/** Phones and tablets: the same groups, labelled, in a side sheet. */
function MobileNavigation({
    groups,
    active,
}: {
    groups: NavGroup[];
    active: NavItem | null;
}) {
    return (
        <div className="lg:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 size-10"
                        aria-label="Open navigation menu"
                    >
                        <Menu className="size-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent
                    side="left"
                    className="flex h-full w-72 flex-col gap-0 bg-sidebar p-0"
                >
                    <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                    <SheetHeader className="flex-row items-center gap-1 border-b p-4 text-left">
                        <AppLogo />
                    </SheetHeader>
                    <nav
                        aria-label="Main"
                        className="flex-1 space-y-4 overflow-y-auto p-3"
                    >
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
                                                        item === active
                                                            ? 'page'
                                                            : undefined
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
                                                </Link>
                                            </SheetClose>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    );
}

/** The avatar, with the account's name beside it on wide screens. */
function AccountMenu() {
    const { auth } = usePage().props;
    const getInitials = useInitials();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-10 gap-2 rounded-full p-1 lg:pr-3"
                >
                    <Avatar
                        aria-hidden
                        className="size-8 overflow-hidden rounded-full"
                    >
                        <AvatarImage
                            src={auth.user?.avatar ?? undefined}
                            alt=""
                            className="object-cover"
                        />
                        <AvatarFallback className="rounded-full bg-accent text-accent-foreground">
                            {getInitials(auth.user?.name ?? '')}
                        </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Account menu, </span>
                    <span className="max-w-40 truncate text-sm font-medium max-lg:sr-only">
                        {auth.user?.name}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                {auth.user && <UserMenuContent user={auth.user} />}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
