import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    ClipboardList,
    Gamepad2,
    LibraryBig,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { Fragment, type ReactNode, useState } from 'react';
import { responsesLabel, SurveyActions } from '@/components/hei/survey-panel';
import { firstName, greeting } from '@/components/hei/welcome-band';
import { PersonAvatar } from '@/components/person-avatar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { resources } from '@/data/phlgadis-demo';
import { resourceIcons } from '@/lib/resource-icons';
import { cn } from '@/lib/utils';
import { about, dashboard, home, myProfile } from '@/routes';
import { create as feedback } from '@/routes/feedback';
import { faq } from '@/routes/help';
import type { HeiSummary, HeiSurvey } from '@/types';

/** A row of the list: 44px, rounded, a muted tint on hover. */
const rowClass =
    'flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-1 text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50';

/**
 * The HEI home's left column from 1280px, laid out like Facebook's: you,
 * where you are, the law surveys and resources as groups that fold, the
 * coming GAD Quest, then a small footer. Events and Records are left to the
 * top bar and Quick links rather than listed twice. A plain list on the
 * page, without cards, so the feed stays the centre of attention.
 *
 * The column is at least as tall as the screen beside the feed, so the
 * footer rests at its bottom, as on Facebook; open groups that outgrow it
 * push the footer down instead of running under it.
 */
export function HomeRail({
    hei,
    surveys,
}: {
    hei: HeiSummary | null;
    surveys: HeiSurvey[];
}) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-[calc(100dvh-var(--app-header)-3rem)] flex-col gap-3">
            <Link href={myProfile()} className={cn(rowClass, 'min-h-14 py-2')}>
                <PersonAvatar
                    name={auth.user.name}
                    src={auth.user.avatar}
                    className="size-9"
                />
                <div className="min-w-0 flex-1">
                    <h1 className="text-[15px] leading-snug font-medium text-balance">
                        {hei?.display_name ?? auth.user.name}
                    </h1>
                    <p className="text-[13px] text-muted-foreground">
                        {greeting()}, {firstName(auth.user.name)}
                        <span className="sr-only">. Open your profile</span>
                    </p>
                </div>
                <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                />
            </Link>

            <nav aria-label="Your PHLGADIS">
                <ul className="space-y-0.5">
                    <li>
                        {/* The HEI home is the community feed. */}
                        <Link
                            href={dashboard()}
                            aria-current="page"
                            className={cn(
                                rowClass,
                                'bg-accent font-medium text-accent-foreground hover:bg-accent',
                            )}
                        >
                            <IconTile icon={Users} />
                            Community
                        </Link>
                    </li>
                    <li>
                        {/* Not built yet: a row that says so, not a link. */}
                        <div className={cn(rowClass, 'hover:bg-transparent')}>
                            <IconTile icon={Gamepad2} />
                            <span className="flex-1">GAD Quest</span>
                            <SoonTag />
                        </div>
                    </li>
                </ul>
            </nav>

            <hr className="mx-2 border-border" />

            <Group
                id="law-surveys"
                title="Law surveys"
                icon={ClipboardList}
                defaultOpen
            >
                <ul className="space-y-3 pt-1 pb-2">
                    {surveys.map((survey) => (
                        <li key={survey.id} className="pr-2 pl-14">
                            <p
                                className="truncate text-sm"
                                title={survey.law_title}
                            >
                                <span className="font-medium">
                                    {survey.code}
                                </span>{' '}
                                <span className="text-muted-foreground">
                                    · {survey.law_title}
                                </span>
                            </p>
                            {survey.is_open ? (
                                <>
                                    <p className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
                                        {responsesLabel(
                                            survey.responses_from_hei,
                                        )}{' '}
                                        from your HEI
                                    </p>
                                    <SurveyActions
                                        survey={survey}
                                        className="mt-1.5 gap-x-3 text-[13px]"
                                    />
                                </>
                            ) : (
                                <p className="mt-0.5 text-[13px] text-muted-foreground">
                                    Opening soon
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            </Group>

            <Group id="resources" title="Resources" icon={LibraryBig}>
                <ul className="space-y-0.5 pb-1">
                    {resources.map((resource) => {
                        const Icon = resourceIcons[resource.id];
                        const body = (
                            <>
                                <Icon
                                    aria-hidden
                                    className="ml-11 size-4 shrink-0 text-muted-foreground"
                                />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate">
                                        {resource.title}
                                    </span>
                                    <span className="block text-[13px] text-muted-foreground">
                                        {resource.summary ?? 'Coming soon'}
                                    </span>
                                </span>
                            </>
                        );

                        return (
                            <li key={resource.id}>
                                {resource.href ? (
                                    <Link
                                        href={resource.href}
                                        className={rowClass}
                                    >
                                        {body}
                                    </Link>
                                ) : (
                                    <div
                                        className={cn(
                                            rowClass,
                                            'hover:bg-transparent',
                                        )}
                                    >
                                        {body}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </Group>

            <hr className="mx-2 border-border" />

            <GadQuestCard />

            <div className="mt-auto space-y-3 pt-3">
                <hr className="mx-2 border-border" />
                <RailFooter />
            </div>
        </div>
    );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
    return (
        <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
        >
            <Icon className="size-[1.125rem]" />
        </span>
    );
}

function SoonTag({ children = 'Soon' }: { children?: ReactNode }) {
    return (
        <span className="rounded-[6px] border px-1.5 py-0.5 text-xs leading-none text-muted-foreground">
            {children}
        </span>
    );
}

/** Whether a group was left open, remembered in this browser. */
function useRememberedOpen(id: string, initial: boolean) {
    const key = `hei-rail:${id}`;
    const [open, setOpen] = useState(() => {
        try {
            const saved = window.localStorage.getItem(key);
            return saved === null ? initial : saved === 'open';
        } catch {
            return initial;
        }
    });

    function change(next: boolean) {
        setOpen(next);
        try {
            window.localStorage.setItem(key, next ? 'open' : 'closed');
        } catch {
            // A private window may refuse; the group still opens and closes.
        }
    }

    return [open, change] as const;
}

/** A folding group of the list, like Facebook's "See more". */
function Group({
    id,
    title,
    icon,
    defaultOpen = false,
    children,
}: {
    id: string;
    title: string;
    icon: LucideIcon;
    defaultOpen?: boolean;
    children: ReactNode;
}) {
    const [open, setOpen] = useRememberedOpen(id, defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className={cn(rowClass, 'group/fold')}>
                <IconTile icon={icon} />
                <span className="flex-1">{title}</span>
                <ChevronDown
                    aria-hidden
                    className="size-4 text-muted-foreground transition-transform group-data-[state=open]/fold:rotate-180"
                />
            </CollapsibleTrigger>
            <CollapsibleContent>{children}</CollapsibleContent>
        </Collapsible>
    );
}

/** GAD Quest is coming; until then the card only says what it will be. */
function GadQuestCard() {
    return (
        <section
            aria-labelledby="gad-quest-title"
            className="relative mx-1 flex items-center gap-2 overflow-hidden rounded-xl border bg-card p-4"
        >
            <div className="min-w-0 flex-1">
                <h2 id="gad-quest-title" className="font-medium">
                    GAD Quest
                </h2>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                    A quick game on gender and development, for your whole
                    campus.
                </p>
                <p className="mt-3">
                    <SoonTag>Coming soon</SoonTag>
                </p>
            </div>
            <img
                src="/assets/img/persona-card.webp"
                alt=""
                width="240"
                height="201"
                loading="lazy"
                decoding="async"
                className="w-20 shrink-0"
            />
        </section>
    );
}

/** A small footer, as Facebook's left column ends with one. */
function RailFooter() {
    const links = [
        { label: 'About', href: about.url() },
        { label: 'Resources', href: `${home.url()}#resources` },
        { label: 'FAQ', href: faq.url() },
        { label: 'Feedback', href: feedback.url() },
    ];

    return (
        <footer className="px-2 text-xs leading-relaxed text-muted-foreground">
            <nav aria-label="About PHLGADIS" className="inline">
                {/* Each link keeps its dot; the spaces between let the line
                    wrap inside the column. */}
                {links.map((link) => (
                    <Fragment key={link.label}>
                        <span className="whitespace-nowrap">
                            <Link
                                href={link.href}
                                className="rounded-sm outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                {link.label}
                            </Link>
                            <span aria-hidden> ·</span>
                        </span>{' '}
                    </Fragment>
                ))}
            </nav>
            <span className="whitespace-nowrap">
                PHLGADIS © {new Date().getFullYear()}
            </span>
        </footer>
    );
}
