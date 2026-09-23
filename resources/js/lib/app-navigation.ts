import { ClipboardList, Images, LayoutGrid } from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function appNavigationItems(permissions: string[]): NavItem[] {
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
    ];
}
