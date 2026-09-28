import {
    Forward,
    Heart,
    Link2,
    Mail,
    MessageCircle,
    Repeat2,
    Send,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from '@/lib/toast';
import { hasPostMedia, PostMedia } from '@/components/hei/post-goals';
import { SourceAvatar } from '@/components/hei/source-avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useClipboard } from '@/hooks/use-clipboard';
import { formatFull, formatRelative } from '@/lib/relative-time';
import { cn } from '@/lib/utils';
import type { PostContent } from '@/types';

export const CHED_LABEL = 'CHED Regional Office XII';

export type LikeState = { liked: boolean; likes_count: number };

/** Who a post speaks for: its school, or CHED for staff posts. */
export function sourceOf(post: PostContent): string {
    return post.hei?.display_name ?? CHED_LABEL;
}

/**
 * Avatar, school, author, time, and the feeling/tag line. The feed card, the
 * post modal, and a shared original all introduce a post this way.
 */
export function PostByline({
    post,
    edited = false,
    titleId,
    action,
    children,
}: {
    post: PostContent;
    edited?: boolean;
    titleId?: string;
    /** What the source did, e.g. "shared a post", after their name. */
    action?: string;
    children?: ReactNode;
}) {
    const source = sourceOf(post);

    return (
        <div className="flex items-start gap-3">
            <SourceAvatar
                name={source}
                official={!post.hei}
                photo={post.author.avatar}
            />
            <div className="min-w-0 flex-1">
                <p
                    id={titleId}
                    className={cn(
                        'text-sm font-medium',
                        action ? 'line-clamp-2' : 'truncate',
                    )}
                >
                    {source}
                    {action && (
                        <span className="font-normal text-muted-foreground">
                            {' '}
                            {action}
                        </span>
                    )}
                </p>
                <p className="text-xs text-muted-foreground">
                    {post.author.name}
                    {post.author.deactivated && (
                        <>
                            <span aria-hidden> · </span>
                            <span className="italic">Deactivated account</span>
                        </>
                    )}
                    <span aria-hidden> · </span>
                    <time
                        dateTime={post.created_at ?? undefined}
                        title={formatFull(post.created_at)}
                    >
                        {formatRelative(post.created_at)}
                    </time>
                    {edited && (
                        <>
                            <span aria-hidden> · </span>Edited
                        </>
                    )}
                </p>
                <PostStatus post={post} />
            </div>
            {children}
        </div>
    );
}

/**
 * "😊 feeling happy · with Ana Cruz, Ben Reyes and 3 others": the first two
 * tagged names, the rest (with their schools) in a tooltip.
 */
function PostStatus({ post }: { post: PostContent }) {
    const { feeling, tags } = post;

    if (!feeling && tags.length === 0) {
        return null;
    }

    const shown = tags.length > 3 ? tags.slice(0, 2) : tags;
    const others = tags.slice(shown.length);
    const personLabel = (person: PostContent['tags'][number]) =>
        `${person.name}, ${person.hei ?? CHED_LABEL}`;

    return (
        <p className="mt-0.5 text-xs text-muted-foreground">
            {feeling && (
                <>
                    <span aria-hidden>{feeling.emoji}</span> feeling{' '}
                    <span className="text-foreground">{feeling.label}</span>
                </>
            )}
            {feeling && tags.length > 0 && <span aria-hidden> · </span>}
            {tags.length > 0 && (
                <>
                    with{' '}
                    {shown.map((person, index) => (
                        <span key={person.id}>
                            {index > 0 &&
                                (index === shown.length - 1 &&
                                others.length === 0
                                    ? ' and '
                                    : ', ')}
                            <span
                                className="text-foreground"
                                title={personLabel(person)}
                            >
                                {person.name}
                            </span>
                        </span>
                    ))}
                    {others.length > 0 && (
                        <>
                            {' and '}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className="rounded-sm text-foreground underline decoration-foreground/30 underline-offset-2 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        {others.length} others
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <ul className="space-y-0.5">
                                        {others.map((person) => (
                                            <li key={person.id}>
                                                {personLabel(person)}
                                            </li>
                                        ))}
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                        </>
                    )}
                </>
            )}
        </p>
    );
}

/** The original post, framed inside the post that shares it. */
export function SharedPostEmbed({ post }: { post: PostContent }) {
    return (
        <div className="overflow-hidden rounded-[10px] border">
            <div className="px-3 pt-3 sm:px-4">
                <PostByline post={post} />
            </div>
            {post.body && (
                <p className="line-clamp-6 px-3 pt-2.5 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line sm:px-4">
                    {post.body}
                </p>
            )}
            {hasPostMedia(post) ? (
                <div className="px-3 pt-3 pb-3 sm:px-4">
                    <PostMedia post={post} sharedBy={sourceOf(post)} />
                </div>
            ) : (
                <div className="pb-3" />
            )}
        </div>
    );
}

const actionClass =
    'inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm tabular-nums transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50';

/** What the Share menu needs: the post to link and how to repost it. */
export type ShareTarget = {
    postId: string;
    /** A short title for messages and email subjects. */
    title: string;
    /** A line of the post's text for the message body. */
    text: string;
    onShareToFeed: () => void;
};

/** The post's own page. Built on click, so it never runs during SSR. */
function postUrl(postId: string): string {
    return new URL(`/posts/${postId}`, window.location.origin).href;
}

/**
 * Share: repost to the feed, or send a members-only link through the
 * device's share sheet (Messenger, Facebook, email…), email, or clipboard.
 */
function ShareMenu({
    sharesCount,
    share,
}: {
    sharesCount: number;
    share: ShareTarget;
}) {
    const [, copy] = useClipboard();

    async function copyLink() {
        if (await copy(postUrl(share.postId))) {
            toast.success(
                'Link copied. It opens for PHLGADIS members after they sign in.',
            );
        } else {
            toast.error('Could not copy the link.');
        }
    }

    async function sendVia() {
        try {
            await navigator.share({
                title: share.title,
                text: share.text,
                url: postUrl(share.postId),
            });
        } catch (error) {
            // Closing the share sheet is not a failure.
            if (
                !(error instanceof DOMException && error.name === 'AbortError')
            ) {
                void copyLink();
            }
        }
    }

    function email() {
        const body = `${share.text}\n\n${postUrl(share.postId)}\n\nOpens after signing in to PHLGADIS.`;
        window.location.href = `mailto:?subject=${encodeURIComponent(share.title)}&body=${encodeURIComponent(body)}`;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        actionClass,
                        'text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground',
                    )}
                >
                    <Forward aria-hidden className="size-4" />
                    {sharesCount > 0 ? sharesCount : 'Share'}
                    <span className="sr-only">
                        {sharesCount > 0 &&
                            (sharesCount === 1 ? ' share' : ' shares')}
                        , share options
                    </span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
                <DropdownMenuItem onSelect={share.onShareToFeed}>
                    <Repeat2 />
                    Share to feed
                </DropdownMenuItem>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <DropdownMenuItem onSelect={() => void sendVia()}>
                        <Send />
                        Send via Messenger, email…
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={email}>
                    <Mail />
                    Email
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void copyLink()}>
                    <Link2 />
                    Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                    Links open for PHLGADIS members after they sign in.
                </p>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** Like, Comment, and Share, each showing its count once it has one. */
export function PostActions({
    like,
    onToggleLike,
    commentsCount,
    onComment,
    sharesCount,
    share,
}: {
    like: LikeState;
    onToggleLike: () => void;
    commentsCount: number;
    onComment: () => void;
    sharesCount: number;
    share: ShareTarget;
}) {
    return (
        <div className="flex items-center gap-1 border-t px-2 py-1.5 sm:px-3">
            <button
                type="button"
                onClick={onToggleLike}
                aria-pressed={like.liked}
                className={cn(
                    actionClass,
                    like.liked
                        ? 'text-signature-red'
                        : 'text-muted-foreground hover:text-foreground',
                )}
            >
                <Heart
                    aria-hidden
                    className={cn(
                        'size-4 transition-transform duration-200 ease-out',
                        like.liked && 'scale-110 fill-current',
                    )}
                />
                <span>{like.likes_count > 0 ? like.likes_count : 'Like'}</span>
                <span className="sr-only">
                    {like.likes_count > 0 &&
                        (like.likes_count === 1 ? ' like' : ' likes')}
                    {like.liked ? ', you liked this' : ''}
                </span>
            </button>
            <button
                type="button"
                onClick={onComment}
                className={cn(
                    actionClass,
                    'text-muted-foreground hover:text-foreground',
                )}
            >
                <MessageCircle aria-hidden className="size-4" />
                {commentsCount > 0 ? commentsCount : 'Comment'}
                <span className="sr-only">
                    {commentsCount > 0 &&
                        (commentsCount === 1 ? ' comment' : ' comments')}
                </span>
            </button>
            <ShareMenu sharesCount={sharesCount} share={share} />
        </div>
    );
}
