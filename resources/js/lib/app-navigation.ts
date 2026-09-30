import {
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    House,
    Images,
    LayoutGrid,
    MessagesSquare,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavGroup, NavItem } from '@/types';

/**
 * The main navigation, grouped under the sidebar's labels. `heiOnly` (shared
 * as `auth.heiOnly`) marks an account with HEI roles only, which gets the HEI
 * home and header shell. Groups the account has nothing in are left out.
 */
export function appNavigationGroups(
    permissions: string[],
    heiOnly = false,
): NavGroup[] {
    const can = (permission: string) => permissions.includes(permission);
    // Short labels, so the top navigation still fits at 1024px.
    const monitoring: NavItem = {
        title: 'Monitoring',
        href: heiOnly ? '/records' : '/admin/monitoring',
        icon: ClipboardCheck,
    };

    if (heiOnly) {
        return [
            {
                label: 'Menu',
                items: [
                    { title: 'Home', href: dashboard(), icon: House },
                    // HEI focal persons prepare and submit the monitoring report.
                    ...(can('monitoring.submit') ? [monitoring] : []),
                    { title: 'Events', href: '/events', icon: CalendarDays },
                ],
            },
        ];
    }

    return [
        {
            label: 'Overview',
            items: [
                { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
            ],
        },
        {
            label: 'Reporting',
            items: can('monitoring.view') ? [monitoring] : [],
        },
        {
            label: 'Community',
            items: [
                ...(can('posts.view')
                    ? [
                          {
                              title: 'Gender Mainstreaming',
                              href: '/community',
                              icon: MessagesSquare,
                          },
                      ]
                    : []),
                ...(can('events.view')
                    ? [
                          {
                              title: 'Events',
                              href: '/admin/events',
                              icon: CalendarDays,
                          },
                      ]
                    : []),
            ],
        },
        {
            label: 'Public site',
            items: [
                ...(can('surveys.view')
                    ? [
                          {
                              title: 'Surveys',
                              href: '/admin/surveys',
                              icon: ClipboardList,
                          },
                      ]
                    : []),
                ...(can('carousel.view')
                    ? [
                          {
                              title: 'Carousel',
                              href: '/admin/carousels',
                              icon: Images,
                          },
                      ]
                    : []),
            ],
        },
    ].filter((group) => group.items.length > 0);
}

/** The same navigation in one row, for the top bar. */
export function appNavigationItems(
    permissions: string[],
    heiOnly = false,
): NavItem[] {
    return appNavigationGroups(permissions, heiOnly).flatMap(
        (group) => group.items,
    );
}
