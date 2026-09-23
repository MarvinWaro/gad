import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    ContactRound,
    GraduationCap,
    Map,
    Palette,
    ShieldCheck,
    UserRound,
    UsersRound,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { Auth, NavItem } from '@/types';

const accountNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: UserRound,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { auth } = usePage<{ auth: Auth }>().props;
    const managementNavItems: NavItem[] = [
        ...(auth.permissions.includes('users.view')
            ? [
                  {
                      title: 'Users',
                      href: '/settings/users',
                      icon: UsersRound,
                  },
              ]
            : []),
        ...(auth.permissions.includes('roles.view')
            ? [
                  {
                      title: 'Roles & permissions',
                      href: '/settings/roles',
                      icon: ShieldCheck,
                  },
              ]
            : []),
    ];
    const isManagementPage =
        isCurrentOrParentUrl('/settings/users') ||
        isCurrentOrParentUrl('/settings/roles') ||
        isCurrentOrParentUrl('/settings/regions') ||
        isCurrentOrParentUrl('/settings/clusters') ||
        isCurrentOrParentUrl('/settings/heis') ||
        isCurrentOrParentUrl('/settings/respondent-groups');
    const configurationNavItems: NavItem[] = auth.permissions.includes(
        'survey-directories.view',
    )
        ? [
              {
                  title: 'Regions',
                  href: '/settings/regions',
                  icon: Map,
              },
              {
                  title: 'Clusters',
                  href: '/settings/clusters',
                  icon: Building2,
              },
              {
                  title: 'HEIs',
                  href: '/settings/heis',
                  icon: GraduationCap,
              },
              {
                  title: 'Respondent groups',
                  href: '/settings/respondent-groups',
                  icon: ContactRound,
              },
          ]
        : [];

    return (
        <div className="px-4 py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-56">
                    <nav
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Settings"
                    >
                        <SettingsNavGroup
                            label="Account"
                            items={accountNavItems}
                            isCurrentOrParentUrl={isCurrentOrParentUrl}
                        />
                        {managementNavItems.length > 0 && (
                            <SettingsNavGroup
                                label="User management"
                                items={managementNavItems}
                                isCurrentOrParentUrl={isCurrentOrParentUrl}
                            />
                        )}
                        {configurationNavItems.length > 0 && (
                            <SettingsNavGroup
                                label="System configuration"
                                items={configurationNavItems}
                                isCurrentOrParentUrl={isCurrentOrParentUrl}
                            />
                        )}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div
                    className={cn(
                        'min-w-0 flex-1',
                        !isManagementPage && 'md:max-w-2xl',
                    )}
                >
                    <section
                        className={cn(
                            'space-y-12',
                            isManagementPage ? 'max-w-6xl' : 'max-w-xl',
                        )}
                    >
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}

function SettingsNavGroup({
    label,
    items,
    isCurrentOrParentUrl,
}: {
    label: string;
    items: NavItem[];
    isCurrentOrParentUrl: (href: NavItem['href']) => boolean;
}) {
    return (
        <div className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            {items.map((item, index) => (
                <Button
                    key={`${toUrl(item.href)}-${index}`}
                    size="sm"
                    variant="ghost"
                    asChild
                    className={cn('w-full justify-start', {
                        'bg-muted': isCurrentOrParentUrl(item.href),
                    })}
                >
                    <Link href={item.href}>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        {item.title}
                    </Link>
                </Button>
            ))}
        </div>
    );
}
