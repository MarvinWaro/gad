import {
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    FileText,
    Folder,
    Gamepad2,
    GraduationCap,
    Images,
    LayoutGrid,
    ListChecks,
    MessageSquareText,
    MessagesSquare,
    Users,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { toUrl } from '@/lib/utils';
import type { NavGroup, NavItem } from '@/types';

/**
 * The main navigation, grouped under the sidebar's labels. `heiOnly` (shared
 * as `auth.heiOnly`) marks an account with HEI roles only, which gets the HEI
 * home and header shell; `playsQuests` (`auth.playsQuests`) one that plays
 * GAD Quest. Groups the account has nothing in are left out.
 */
export function appNavigationGroups(
    permissions: string[],
    heiOnly = false,
    playsQuests = false,
): NavGroup[] {
    const can = (permission: string) => permissions.includes(permission);
    // The old CHED Focal's section: the monitoring report and the two GAD
    // surveys. HEI focal persons answer them; CHED staff read them.
    const base = heiOnly ? '/records' : '/admin/monitoring';
    const monitoring: NavGroup = {
        label: 'Monitoring',
        icon: ClipboardCheck,
        menu: true,
        items: can(heiOnly ? 'monitoring.submit' : 'monitoring.view')
            ? [
                  heiOnly
                      ? { title: 'Records', href: base, icon: Folder }
                      : { title: 'Reports', href: base, icon: FileText },
                  {
                      title: 'Training Survey',
                      href: `${base}/training`,
                      icon: GraduationCap,
                  },
                  {
                      title: 'Compliance Survey',
                      href: `${base}/compliance`,
                      icon: ListChecks,
                  },
              ]
            : [],
    };

    // GAD Quest: players go to their quests; those who only run quests
    // (administrators) to the staff list.
    const quest: NavItem[] =
        playsQuests || can('quests.view')
            ? [
                  {
                      title: 'GAD Quest',
                      href: playsQuests ? '/quests' : '/quests/manage',
                      icon: Gamepad2,
                      beta: true,
                  },
              ]
            : [];

    // Short labels, so the top navigation still fits at 1024px.
    const groups: NavGroup[] = heiOnly
        ? [
              {
                  label: 'Menu',
                  items: [
                      // The HEI home is the community feed.
                      {
                          title: 'Community',
                          href: dashboard(),
                          icon: Users,
                      },
                      { title: 'Events', href: '/events', icon: CalendarDays },
                      ...quest,
                  ],
              },
              monitoring,
          ]
        : [
              {
                  label: 'Overview',
                  items: [
                      {
                          title: 'Dashboard',
                          href: dashboard(),
                          icon: LayoutGrid,
                      },
                  ],
              },
              monitoring,
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
                      ...quest,
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
                      // What visitors send through the website feedback form.
                      ...(can('feedback.view')
                          ? [
                                {
                                    title: 'Feedback',
                                    href: '/admin/feedback',
                                    icon: MessageSquareText,
                                },
                            ]
                          : []),
                  ],
              },
          ];

    return groups.filter((group) => group.items.length > 0);
}

/**
 * The item the page belongs to: the longest href its path starts with, so
 * Training Survey, not Reports, is current on the Training Survey page.
 */
export function activeNavItem(
    groups: NavGroup[],
    path: string,
): NavItem | null {
    let active: NavItem | null = null;
    let length = -1;

    for (const item of groups.flatMap((group) => group.items)) {
        const href = new URL(toUrl(item.href), 'http://localhost').pathname;

        if (
            (path === href || path.startsWith(`${href}/`)) &&
            href.length > length
        ) {
            active = item;
            length = href.length;
        }
    }

    return active;
}
