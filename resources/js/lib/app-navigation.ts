import {
    CalendarDays,
    ClipboardList,
    House,
    Images,
    LayoutGrid,
    MessagesSquare,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

/** An HEI account with no staff role gets the HEI home and header shell. */
export function isHeiOnly(roles: string[]): boolean {
    return roles.length === 1 && roles[0] === 'hei';
}

export function appNavigationItems(
    permissions: string[],
    roles: string[] = [],
): NavItem[] {
    if (isHeiOnly(roles)) {
        return [
            { title: 'Home', href: dashboard(), icon: House },
            { title: 'Events', href: '/events', icon: CalendarDays },
        ];
    }

    return [
        { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
        ...(permissions.includes('carousel.view')
            ? [{ title: 'Carousel', href: '/admin/carousels', icon: Images }]
            : []),
        ...(permissions.includes('surveys.view')
            ? [
                  {
                      title: 'Surveys',
                      href: '/admin/surveys',
                      icon: ClipboardList,
                  },
              ]
            : []),
        ...(permissions.includes('events.view')
            ? [{ title: 'Events', href: '/admin/events', icon: CalendarDays }]
            : []),
        ...(permissions.includes('posts.moderate')
            ? [
                  {
                      title: 'Community',
                      href: '/community',
                      icon: MessagesSquare,
                  },
              ]
            : []),
    ];
}
