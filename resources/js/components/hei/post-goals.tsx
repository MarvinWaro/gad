import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { PostImages } from '@/components/hei/post-images';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    achieveAgenda,
    achieveItemsFor,
    achievePage,
    type AchieveCode,
    type AchieveItem,
} from '@/data/achieve';
import {
    sdgDisclaimer,
    sdgSite,
    sdgsFor,
    type SustainableGoal,
} from '@/data/sdgs';
import { badgeSize, goalsSummary } from '@/lib/post-goals';
import { cn } from '@/lib/utils';
import type { PostContent } from '@/types';

/** On a photo (`media`), or on the card itself under the text (`surface`). */
type Tone = 'media' | 'surface';

type Goals = Pick<PostContent, 'sdgs' | 'achieve_items'>;

export function hasGoals(post: Goals): boolean {
    return post.sdgs.length > 0 || post.achieve_items.length > 0;
}

/** Whether a post shows anything under its text: photos or goal badges. */
export function hasPostMedia(post: PostContent): boolean {
    return post.images.length > 0 || hasGoals(post);
}

/**
 * What a post shows under its text: its photos with the goal badges in the
 * corner, or, without photos, the badges on a row of their own.
 */
export function PostMedia({
    post,
    sharedBy,
}: {
    post: PostContent;
    sharedBy: string;
}) {
    const badges = (tone: Tone) => (
        <GoalBadges
            sdgs={post.sdgs}
            achieveItems={post.achieve_items}
            tone={tone}
        />
    );

    if (post.images.length > 0) {
        return (
            <PostImages
                images={post.images}
                sharedBy={sharedBy}
                overlay={hasGoals(post) ? badges('media') : undefined}
            />
        );
    }

    return hasGoals(post) ? badges('surface') : null;
}

/**
 * The SDG icons a post supports, then the A.C.H.I.E.V.E. strip, in one line
 * as the UN's icon guidelines ask. The icons stay whole, square, unshadowed
 * and in their own colours. On photos they scale with the photos' width and
 * shrink as the row fills; on the card they are 32px.
 *
 * The row is a single button: it opens the details, or, with `onEdit` (the
 * composer), the picker.
 */
export function GoalBadges({
    sdgs,
    achieveItems,
    tone,
    onEdit,
}: {
    sdgs: readonly number[];
    achieveItems: readonly AchieveCode[];
    tone: Tone;
    onEdit?: () => void;
}) {
    const goals = sdgsFor(sdgs);
    const agenda = achieveItemsFor(achieveItems);

    if (goals.length === 0 && agenda.length === 0) {
        return null;
    }

    const summary = goalsSummary(goals, agenda);
    const size =
        tone === 'media' ? badgeSize(goals.length, agenda.length > 0) : '32px';
    const row = (
        <span className="flex items-center gap-[max(6px,calc(var(--badge)*0.2))]">
            {goals.length > 0 && (
                <span className="flex gap-[max(3px,calc(var(--badge)*0.08))]">
                    {goals.map((goal) => (
                        <img
                            key={goal.number}
                            src={goal.image}
                            alt=""
                            width={320}
                            height={320}
                            decoding="async"
                            className="block size-(--badge) shrink-0"
                        />
                    ))}
                </span>
            )}
            {agenda.length > 0 && (
                <AchieveStrip lit={achieveItems} tone={tone} />
            )}
        </span>
    );
    const triggerProps = {
        style: { '--badge': size } as CSSProperties,
        className: cn(
            'block rounded-[4px] outline-none focus-visible:ring-[3px]',
            tone === 'media'
                ? 'focus-visible:ring-on-signature'
                : 'focus-visible:ring-ring/50',
        ),
    };

    if (onEdit) {
        return (
            <button type="button" onClick={onEdit} {...triggerProps}>
                {row}
                <span className="sr-only">
                    Edit what this supports: {summary}
                </span>
            </button>
        );
    }

    return (
        <Popover>
            <PopoverTrigger {...triggerProps}>
                {row}
                <span className="sr-only">Supports {summary}</span>
            </PopoverTrigger>
            <PopoverContent
                align={tone === 'media' ? 'end' : 'start'}
                className="w-80 p-0"
            >
                <GoalDetails goals={goals} agenda={agenda} />
            </PopoverContent>
        </Popover>
    );
}

/**
 * "A C H I E V E" with the chosen items lit: thrusts in flag blue and
 * enablers in flag red, CHED's own agenda colours. Each letter keeps its
 * place, so the two E's read apart. Sized from the row's --badge and never
 * taller than the SDG icons; on photos it sits on a near-opaque panel so the
 * unlit letters read on any picture. Screen readers get the badge row's
 * summary instead.
 */
export function AchieveStrip({
    lit,
    tone,
}: {
    lit: readonly AchieveCode[];
    tone: Tone;
}) {
    return (
        <span
            aria-hidden
            className={cn(
                'flex h-(--badge) shrink-0 items-center gap-[0.12em] rounded-[max(3px,calc(var(--badge)*0.1))] px-[0.3em] text-[length:max(12px,calc(var(--badge)*0.36))] leading-none font-semibold',
                tone === 'media' ? 'bg-media-panel' : 'border bg-muted',
            )}
        >
            {achieveAgenda.map((item) => (
                <span
                    key={item.code}
                    className={cn(
                        'grid h-[1.4em] w-[0.95em] place-items-center rounded-[0.2em]',
                        !lit.includes(item.code)
                            ? tone === 'media'
                                ? 'text-on-signature/65'
                                : 'text-muted-foreground'
                            : item.role === 'thrust'
                              ? 'bg-thrust text-on-signature'
                              : 'bg-enabler text-on-signature',
                    )}
                >
                    {item.letter}
                </span>
            ))}
        </span>
    );
}

/** An agenda item's letter on its thrust-blue or enabler-red tile. */
export function AgendaTile({
    item,
    className,
}: {
    item: AchieveItem;
    className?: string;
}) {
    return (
        <span
            aria-hidden
            className={cn(
                'grid shrink-0 place-items-center rounded-[6px] font-semibold text-on-signature',
                item.role === 'thrust' ? 'bg-thrust' : 'bg-enabler',
                className,
            )}
        >
            {item.letter}
        </span>
    );
}

/** The link and statement the UN asks for wherever its SDG icons appear. */
export function SdgCredit({ className }: { className?: string }) {
    return (
        <p
            className={cn(
                'text-xs leading-relaxed text-muted-foreground',
                className,
            )}
        >
            SDG icons from the{' '}
            <a
                href={sdgSite}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm text-foreground underline underline-offset-2 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                United Nations
                <span className="sr-only"> (opens in a new tab)</span>
            </a>
            . {sdgDisclaimer}
        </p>
    );
}

const detailLink =
    'flex items-center gap-3 rounded-[10px] px-2 py-1.5 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** "This post supports": each goal and agenda item, linking to more. */
function GoalDetails({
    goals,
    agenda,
}: {
    goals: SustainableGoal[];
    agenda: AchieveItem[];
}) {
    return (
        <div className="max-h-[min(70vh,30rem)] overflow-y-auto">
            <p className="border-b px-4 py-3 text-sm font-medium">
                This post supports
            </p>
            <ul className="space-y-0.5 p-2">
                {goals.map((goal) => (
                    <li key={goal.number}>
                        <a
                            href={goal.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={detailLink}
                        >
                            <img
                                src={goal.image}
                                alt=""
                                width={320}
                                height={320}
                                decoding="async"
                                className="size-10 shrink-0"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs text-muted-foreground">
                                    Goal {goal.number}
                                </span>
                                <span className="block text-sm">
                                    {goal.name}
                                </span>
                            </span>
                            <ArrowUpRight
                                aria-hidden
                                className="size-4 shrink-0 text-muted-foreground"
                            />
                            <span className="sr-only">
                                (opens the UN page in a new tab)
                            </span>
                        </a>
                    </li>
                ))}
                {agenda.map((item) => (
                    <li key={item.code}>
                        <a
                            href={achievePage}
                            target="_blank"
                            rel="noopener"
                            className={detailLink}
                        >
                            <AgendaTile item={item} className="size-10" />
                            <span className="min-w-0 flex-1">
                                <span className="block text-xs text-muted-foreground">
                                    A.C.H.I.E.V.E. {item.role}
                                </span>
                                <span className="block text-sm">
                                    {item.title}
                                </span>
                            </span>
                            <ArrowUpRight
                                aria-hidden
                                className="size-4 shrink-0 text-muted-foreground"
                            />
                            <span className="sr-only">
                                (opens the agenda in a new tab)
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
            {goals.length > 0 && <SdgCredit className="border-t px-4 py-3" />}
        </div>
    );
}
