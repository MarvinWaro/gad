import { ArrowUpRight, Globe } from 'lucide-react';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { home } from '@/routes';

/**
 * The public website (the landing page) as visitors see it, at the foot of
 * the sidebar. It opens in a new tab, so the staff page stays where it was.
 */
export function NavPublicSite() {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    tooltip={{
                        children: 'View public site (opens in a new tab)',
                    }}
                >
                    <a href={home.url()} target="_blank" rel="noopener">
                        <Globe />
                        <span>View public site</span>
                        <ArrowUpRight
                            aria-hidden
                            className="ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden"
                        />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
