import { Link } from '@inertiajs/react';
import { BetaTag } from '@/components/beta-tag';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { activeNavItem } from '@/lib/app-navigation';
import type { NavGroup } from '@/types';

export function NavMain({ groups }: { groups: NavGroup[] }) {
    const { currentUrl } = useCurrentUrl();
    const active = activeNavItem(groups, currentUrl);

    return groups.map((group) => (
        <SidebarGroup key={group.label} className="px-2 py-0">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
                {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={item === active}
                            tooltip={{ children: item.title }}
                        >
                            <Link
                                href={item.href}
                                prefetch
                                aria-current={
                                    item === active ? 'page' : undefined
                                }
                            >
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                                {item.beta && <BetaTag className="ml-auto" />}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    ));
}
