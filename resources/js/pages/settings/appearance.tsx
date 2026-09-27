import { Head } from '@inertiajs/react';
import { Check, Monitor, Moon, PanelLeft, PanelTop, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import Heading from '@/components/heading';
import { useAppearance } from '@/hooks/use-appearance';
import type { Appearance as AppearanceMode } from '@/hooks/use-appearance';
import { useNavigationStyle } from '@/hooks/use-navigation-style';
import type { NavigationStyle } from '@/hooks/use-navigation-style';
import { cn } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';

const themeChoices: {
    value: AppearanceMode;
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        value: 'light',
        label: 'Light',
        description: 'A clean and bright interface for daytime use.',
        icon: Sun,
    },
    {
        value: 'dark',
        label: 'Dark',
        description: 'Easier on the eyes in low-light environments.',
        icon: Moon,
    },
    {
        value: 'system',
        label: 'System',
        description: 'Automatically matches your device settings.',
        icon: Monitor,
    },
];

const navigationChoices: {
    value: NavigationStyle;
    label: string;
    description: string;
    icon: LucideIcon;
}[] = [
    {
        value: 'sidebar',
        label: 'Sidebar Navigation',
        description: 'The menu stays visible on the left side of the page.',
        icon: PanelLeft,
    },
    {
        value: 'header',
        label: 'Header Navigation',
        description: 'The menu is located at the top of the page.',
        icon: PanelTop,
    },
];

function ChoiceCard({
    label,
    description,
    icon: Icon,
    selected,
    onClick,
    children,
}: {
    label: string;
    description: string;
    icon: LucideIcon;
    selected: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={cn(
                'group relative flex min-w-0 flex-col rounded-xl border bg-card p-4 text-left text-card-foreground transition-[border-color,background-color,transform,box-shadow] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-sm',
                selected
                    ? 'border-foreground bg-muted/30'
                    : 'border-border hover:border-foreground/50',
            )}
        >
            <span
                aria-hidden="true"
                className="mb-3 flex size-9 items-center justify-center rounded-lg bg-muted text-foreground"
            >
                <Icon className="size-4" strokeWidth={1.75} />
            </span>
            {selected && (
                <span
                    aria-hidden="true"
                    className="absolute top-4 right-4 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                >
                    <Check className="size-3" strokeWidth={2.5} />
                </span>
            )}
            <span className="text-sm font-medium">{label}</span>
            <span className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">
                {description}
            </span>
            <span aria-hidden="true" className="mt-3 block w-full">
                {children}
            </span>
        </button>
    );
}

function PreviewLines({ dark = false }: { dark?: boolean }) {
    return (
        <span className="flex flex-col gap-1.5 p-2">
            <span
                className={cn(
                    'h-1.5 w-1/2 rounded-full',
                    dark ? 'bg-white/35' : 'bg-neutral-300',
                )}
            />
            <span
                className={cn(
                    'h-1.5 w-full rounded-full',
                    dark ? 'bg-white/20' : 'bg-neutral-200',
                )}
            />
            <span
                className={cn(
                    'h-1.5 w-4/5 rounded-full',
                    dark ? 'bg-white/20' : 'bg-neutral-200',
                )}
            />
            <span
                className={cn(
                    'h-1.5 w-2/3 rounded-full',
                    dark ? 'bg-white/20' : 'bg-neutral-200',
                )}
            />
        </span>
    );
}

function ThemePreview({ mode }: { mode: AppearanceMode }) {
    return (
        <span className="flex h-[72px] overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {mode === 'system' ? (
                <>
                    <span className="w-1/2 overflow-hidden bg-white">
                        <PreviewLines />
                    </span>
                    <span className="w-1/2 overflow-hidden bg-neutral-900">
                        <PreviewLines dark />
                    </span>
                </>
            ) : (
                <span
                    className={cn(
                        'w-full',
                        mode === 'dark' ? 'bg-neutral-900' : 'bg-white',
                    )}
                >
                    <span
                        className={cn(
                            'flex h-4 items-center gap-1 border-b px-2',
                            mode === 'dark'
                                ? 'border-white/10'
                                : 'border-neutral-200',
                        )}
                    >
                        <span className="size-1.5 rounded-full bg-neutral-400" />
                        <span className="h-1 w-5 rounded-full bg-neutral-400/50" />
                    </span>
                    <PreviewLines dark={mode === 'dark'} />
                </span>
            )}
        </span>
    );
}

function NavigationPreview({ style }: { style: NavigationStyle }) {
    return (
        <span className="flex h-[72px] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white p-1.5">
            {style === 'header' && (
                <span className="mb-1.5 flex h-3 items-center gap-1.5 border-b border-neutral-200 pb-1">
                    <span className="h-1.5 w-3 rounded-full bg-neutral-400" />
                    <span className="h-1.5 w-5 rounded-full bg-neutral-300" />
                    <span className="h-1.5 w-4 rounded-full bg-neutral-300" />
                </span>
            )}
            <span className="flex min-h-0 flex-1">
                {style === 'sidebar' && (
                    <span className="mr-1.5 flex w-7 shrink-0 flex-col gap-1.5 border-r border-neutral-200 pr-1.5">
                        <span className="h-1.5 w-full rounded-full bg-neutral-400" />
                        <span className="h-1.5 w-4/5 rounded-full bg-neutral-300" />
                        <span className="h-1.5 w-full rounded-full bg-neutral-300" />
                    </span>
                )}
                <span className="flex flex-1 flex-col gap-1.5 pt-1">
                    <span className="h-1.5 w-3/5 rounded-full bg-neutral-300" />
                    <span className="h-1.5 w-full rounded-full bg-neutral-200" />
                    <span className="h-1.5 w-4/5 rounded-full bg-neutral-200" />
                </span>
            </span>
        </span>
    );
}

export default function Appearance() {
    const { appearance, updateAppearance } = useAppearance();
    const { style, updateStyle } = useNavigationStyle();

    return (
        <>
            <Head title="Appearance settings" />
            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-10">
                <section className="space-y-5" aria-labelledby="theme-heading">
                    <div id="theme-heading">
                        <Heading
                            variant="small"
                            title="Appearance settings"
                            description="Choose how the platform looks for you"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {themeChoices.map((choice) => (
                            <ChoiceCard
                                key={choice.value}
                                label={choice.label}
                                description={choice.description}
                                icon={choice.icon}
                                selected={appearance === choice.value}
                                onClick={() => updateAppearance(choice.value)}
                            >
                                <ThemePreview mode={choice.value} />
                            </ChoiceCard>
                        ))}
                    </div>
                </section>

                <section
                    className="space-y-5 border-t border-border pt-6"
                    aria-labelledby="navigation-heading"
                >
                    <div id="navigation-heading">
                        <Heading
                            variant="small"
                            title="Navigation style"
                            description="Choose how you want to navigate through the platform"
                        />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {navigationChoices.map((choice) => (
                            <ChoiceCard
                                key={choice.value}
                                label={choice.label}
                                description={choice.description}
                                icon={choice.icon}
                                selected={style === choice.value}
                                onClick={() => updateStyle(choice.value)}
                            >
                                <NavigationPreview style={choice.value} />
                            </ChoiceCard>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

Appearance.layout = {
    breadcrumbs: [{ title: 'Appearance settings', href: editAppearance() }],
};
