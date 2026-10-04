import { useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ImagePlus,
    Pencil,
    Smile,
    Target,
    UserPlus,
    X,
} from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
    FeelingView,
    GoalsView,
    PhotosView,
    TagPeopleView,
} from '@/components/hei/post-composer-views';
import { GoalBadges } from '@/components/hei/post-goals';
import { PhotoMosaic } from '@/components/hei/post-images';
import { SourceAvatar } from '@/components/hei/source-avatar';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import type { AchieveCode } from '@/data/achieve';
import { POST_FEELINGS, taggedSummary } from '@/lib/post-feelings';
import { MAX_ACHIEVE_ITEMS, MAX_SDGS, toggleWithin } from '@/lib/post-goals';
import { cn } from '@/lib/utils';
import type { TaggedUser } from '@/types';

// Mirrors App\Models\Post::MAX_IMAGES and MAX_TAGS.
const MAX_IMAGES = 10;
const MAX_TAGS = 20;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_LENGTH = 5000;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

type ComposerForm = {
    body: string;
    images: File[];
    tags: number[];
    feeling: string;
    sdgs: number[];
    achieve_items: AchieveCode[];
};

type View = 'compose' | 'tag' | 'feeling' | 'photos' | 'goals';

const titles: Record<View, string> = {
    compose: 'Create post',
    tag: 'Tag people',
    feeling: 'How are you feeling?',
    photos: 'Photos',
    goals: 'What does this support?',
};

/** The action that picks the SDGs and A.C.H.I.E.V.E. items. */
const GOALS_LABEL = 'SDGs & ACHIEVE';

/**
 * The feed's "Create post": a compact prompt that opens a modal for writing,
 * up to ten photos, tagging people, a feeling, and the SDGs and A.C.H.I.E.V.E.
 * items the activity supports. The draft survives closing the modal and
 * clears only once the post is shared.
 */
export function PostComposer({
    authorLabel,
    official = false,
    placeholder = 'Share a GAD activity from your campus…',
}: {
    authorLabel: string;
    official?: boolean;
    placeholder?: string;
}) {
    const { auth } = usePage().props;
    const inputId = useId();
    const fileInput = useRef<HTMLInputElement>(null);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<View>('compose');
    const [previews, setPreviews] = useState<string[]>([]);
    const [tagged, setTagged] = useState<TaggedUser[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const form = useForm<ComposerForm>({
        body: '',
        images: [],
        tags: [],
        feeling: '',
        sdgs: [],
        achieve_items: [],
    });

    const latestPreviews = useRef(previews);

    useEffect(() => {
        latestPreviews.current = previews;
    }, [previews]);

    // Release whatever preview URLs are left when the composer unmounts.
    useEffect(
        () => () =>
            latestPreviews.current.forEach((url) => URL.revokeObjectURL(url)),
        [],
    );

    function resize() {
        const element = textarea.current;

        if (element) {
            element.style.height = 'auto';
            element.style.height = `${Math.min(element.scrollHeight, 320)}px`;
        }
    }

    // Re-fit the text box whenever it remounts or photos change its
    // minimum height, so it never keeps a stale, too-tall size.
    useLayoutEffect(() => {
        if (open && view === 'compose') {
            resize();
        }
    }, [open, view, previews.length]);

    function openComposer(next: View = 'compose') {
        setView(next);
        setOpen(true);
    }

    function pickPhotos() {
        fileInput.current?.click();
    }

    function addFiles(event: ChangeEvent<HTMLInputElement>) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = '';
        const room = MAX_IMAGES - form.data.images.length;
        const accepted = files
            .filter(
                (file) =>
                    ACCEPTED.includes(file.type) && file.size <= MAX_BYTES,
            )
            .slice(0, Math.max(room, 0));

        if (files.length > accepted.length) {
            setFileError(
                room < files.length
                    ? `You can add up to ${MAX_IMAGES} photos.`
                    : 'Photos must be JPG, PNG, or WebP and 5 MB or smaller.',
            );
        } else {
            setFileError(null);
        }

        if (accepted.length === 0) {
            return;
        }

        form.setData('images', [...form.data.images, ...accepted]);
        setPreviews((current) => [
            ...current,
            ...accepted.map((file) => URL.createObjectURL(file)),
        ]);
        openComposer(view === 'photos' ? 'photos' : 'compose');
    }

    function removeImage(index: number) {
        URL.revokeObjectURL(previews[index]);
        setPreviews((current) => current.filter((_, i) => i !== index));
        form.setData(
            'images',
            form.data.images.filter((_, i) => i !== index),
        );
        setFileError(null);
    }

    function removeAllImages() {
        previews.forEach((url) => URL.revokeObjectURL(url));
        setPreviews([]);
        form.setData('images', []);
        setFileError(null);
    }

    function toggleTag(person: TaggedUser) {
        const next = tagged.some((item) => item.id === person.id)
            ? tagged.filter((item) => item.id !== person.id)
            : tagged.length < MAX_TAGS
              ? [...tagged, person]
              : tagged;

        setTagged(next);
        form.setData(
            'tags',
            next.map((item) => item.id),
        );
    }

    function pickFeeling(value: string) {
        form.setData('feeling', value);
        setView('compose');
    }

    function toggleSdg(goal: number) {
        form.setData('sdgs', toggleWithin(form.data.sdgs, goal, MAX_SDGS));
    }

    function toggleAchieve(code: AchieveCode) {
        form.setData(
            'achieve_items',
            toggleWithin(form.data.achieve_items, code, MAX_ACHIEVE_ITEMS),
        );
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/posts', {
            forceFormData: true,
            preserveScroll: true,
            reset: ['posts'],
            // A post can earn a badge, which the bell tells of at once.
            only: ['inbox'],
            onSuccess: () => {
                previews.forEach((url) => URL.revokeObjectURL(url));
                setPreviews([]);
                setTagged([]);
                setFileError(null);
                form.reset();
                setOpen(false);
                setView('compose');
            },
        });
    }

    const feeling = POST_FEELINGS.find(
        (item) => item.value === form.data.feeling,
    );
    const errors = [
        form.errors.body,
        fileError,
        form.errors.feeling,
        ...Object.entries(form.errors)
            .filter(([key]) =>
                ['images', 'tags', 'sdgs', 'achieve_items'].some((field) =>
                    key.startsWith(field),
                ),
            )
            .map(([, message]) => message),
    ].filter((message, index, all): message is string =>
        Boolean(message && all.indexOf(message) === index),
    );
    const goalsCount = form.data.sdgs.length + form.data.achieve_items.length;
    const goalBadges = (tone: 'media' | 'surface') => (
        <GoalBadges
            sdgs={form.data.sdgs}
            achieveItems={form.data.achieve_items}
            tone={tone}
            onEdit={() => setView('goals')}
        />
    );
    const hasContent =
        form.data.body.trim().length > 0 || form.data.images.length > 0;
    const hasDraft =
        hasContent ||
        form.data.tags.length > 0 ||
        form.data.feeling !== '' ||
        goalsCount > 0;
    const remaining = MAX_LENGTH - form.data.body.length;
    const firstLine = form.data.body.trim().split('\n')[0];
    // The prompt shows a saved draft only once the modal is closed, so it
    // never mirrors typing behind the overlay.
    const showDraft = hasDraft && !open;
    const draftLabel =
        firstLine ||
        (form.data.images.length > 0
            ? `${form.data.images.length} ${form.data.images.length === 1 ? 'photo' : 'photos'} ready to post`
            : 'Continue your post…');

    return (
        <section
            aria-label="Create a post"
            className="rounded-[10px] border bg-card"
        >
            <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED.join(',')}
                multiple
                onChange={addFiles}
                className="sr-only"
                tabIndex={-1}
                aria-hidden
            />

            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                <SourceAvatar
                    name={authorLabel}
                    official={official}
                    photo={auth.user.avatar}
                />
                <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={() => openComposer()}
                    className={cn(
                        'h-11 min-w-0 flex-1 truncate rounded-[10px] border bg-muted/60 px-4 text-left text-[0.9375rem] transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        showDraft ? 'text-foreground' : 'text-muted-foreground',
                    )}
                >
                    {showDraft ? draftLabel : placeholder}
                </button>
            </div>

            <div className="flex border-t px-2 py-1.5">
                <ComposerShortcut
                    label="Photos"
                    count={form.data.images.length}
                    onClick={() => {
                        openComposer();
                        pickPhotos();
                    }}
                >
                    <ImagePlus className="text-emerald-600 dark:text-emerald-400" />
                </ComposerShortcut>
                <ComposerShortcut
                    label="Tag people"
                    count={form.data.tags.length}
                    onClick={() => openComposer('tag')}
                >
                    <UserPlus className="text-chart-3" />
                </ComposerShortcut>
                <ComposerShortcut
                    label="Feeling"
                    count={feeling ? 1 : 0}
                    onClick={() => openComposer('feeling')}
                >
                    <Smile className="text-signature-mustard" />
                </ComposerShortcut>
                <ComposerShortcut
                    label={GOALS_LABEL}
                    count={goalsCount}
                    onClick={() => openComposer('goals')}
                >
                    <Target className="text-brand" />
                </ComposerShortcut>
            </div>

            <Dialog
                open={open}
                onOpenChange={(value) => {
                    setOpen(value);

                    if (!value) {
                        setView('compose');
                    }
                }}
            >
                <DialogContent
                    data-surface="hei"
                    onEscapeKeyDown={(event) => {
                        // Escape steps back out of a sub-view before closing.
                        if (view !== 'compose') {
                            event.preventDefault();
                            setView('compose');
                        }
                    }}
                    className={cn(
                        'gap-0 overflow-hidden p-0 sm:max-w-[31.25rem]',
                        '[&>button:last-child]:top-3 [&>button:last-child]:right-3 [&>button:last-child]:flex [&>button:last-child]:size-9 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:rounded-full [&>button:last-child]:bg-muted [&>button:last-child]:opacity-100 [&>button:last-child]:hover:bg-accent',
                        view !== 'compose' && '[&>button:last-child]:hidden',
                    )}
                >
                    <header className="relative flex h-15 items-center justify-center border-b px-14">
                        {view !== 'compose' && (
                            <button
                                type="button"
                                onClick={() => setView('compose')}
                                className="absolute left-3 flex size-9 items-center justify-center rounded-full bg-muted outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <ArrowLeft aria-hidden className="size-4" />
                                <span className="sr-only">Back to post</span>
                            </button>
                        )}
                        <DialogTitle className="text-base font-medium">
                            {titles[view]}
                        </DialogTitle>
                        {(view === 'tag' ||
                            view === 'photos' ||
                            view === 'goals') && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setView('compose')}
                                className="absolute right-3 font-medium"
                            >
                                Done
                            </Button>
                        )}
                    </header>
                    <DialogDescription className="sr-only">
                        Write a post, add up to ten photos, tag people, add a
                        feeling, or pick the SDGs and A.C.H.I.E.V.E. items it
                        supports.
                    </DialogDescription>

                    <div
                        key={view}
                        className={cn(
                            'flex max-h-[min(80dvh,42rem)] min-h-0 animate-in flex-col duration-200 fade-in-0 motion-reduce:animate-none',
                            view !== 'compose' && 'slide-in-from-right-2',
                        )}
                    >
                        {view === 'tag' && (
                            <TagPeopleView
                                selected={tagged}
                                onToggle={toggleTag}
                                max={MAX_TAGS}
                            />
                        )}
                        {view === 'feeling' && (
                            <FeelingView
                                value={form.data.feeling}
                                onPick={pickFeeling}
                            />
                        )}
                        {view === 'photos' && (
                            <PhotosView
                                previews={previews}
                                max={MAX_IMAGES}
                                onRemove={removeImage}
                                onAdd={pickPhotos}
                            />
                        )}
                        {view === 'goals' && (
                            <GoalsView
                                sdgs={form.data.sdgs}
                                achieveItems={form.data.achieve_items}
                                onToggleSdg={toggleSdg}
                                onToggleAchieve={toggleAchieve}
                            />
                        )}
                        {view === 'compose' && (
                            <form
                                onSubmit={submit}
                                className="flex min-h-0 flex-1 flex-col"
                            >
                                {/* The post scrolls; "Add to your post" and
                                    the Post button stay pinned below it. */}
                                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-4 pb-3">
                                    <div className="flex items-start gap-3">
                                        <SourceAvatar
                                            name={authorLabel}
                                            official={official}
                                            photo={auth.user.avatar}
                                        />
                                        <div className="min-w-0 pt-0.5">
                                            <p className="truncate text-sm font-medium">
                                                {authorLabel}
                                            </p>
                                            {(feeling || tagged.length > 0) && (
                                                <p className="text-sm text-muted-foreground">
                                                    {feeling && (
                                                        <>
                                                            is feeling{' '}
                                                            <StatusLink
                                                                onClick={() =>
                                                                    setView(
                                                                        'feeling',
                                                                    )
                                                                }
                                                            >
                                                                <span
                                                                    aria-hidden
                                                                >
                                                                    {
                                                                        feeling.emoji
                                                                    }
                                                                </span>{' '}
                                                                {feeling.label}
                                                            </StatusLink>
                                                        </>
                                                    )}
                                                    {tagged.length > 0 && (
                                                        <>
                                                            {feeling
                                                                ? ' with '
                                                                : 'with '}
                                                            <StatusLink
                                                                onClick={() =>
                                                                    setView(
                                                                        'tag',
                                                                    )
                                                                }
                                                            >
                                                                {taggedSummary(
                                                                    tagged.map(
                                                                        (
                                                                            person,
                                                                        ) =>
                                                                            person.name,
                                                                    ),
                                                                )}
                                                            </StatusLink>
                                                        </>
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <label
                                        htmlFor={inputId}
                                        className="sr-only"
                                    >
                                        Post text
                                    </label>
                                    <textarea
                                        id={inputId}
                                        ref={textarea}
                                        value={form.data.body}
                                        onChange={(event) => {
                                            form.setData(
                                                'body',
                                                event.target.value,
                                            );
                                            resize();
                                        }}
                                        placeholder={placeholder}
                                        rows={previews.length > 0 ? 2 : 4}
                                        maxLength={MAX_LENGTH}
                                        autoFocus
                                        aria-invalid={Boolean(form.errors.body)}
                                        className={cn(
                                            'w-full resize-none bg-transparent leading-relaxed caret-brand outline-none placeholder:text-muted-foreground',
                                            previews.length === 0 &&
                                                form.data.body.length < 90
                                                ? 'text-lg'
                                                : 'text-base',
                                        )}
                                    />

                                    {previews.length > 0 && (
                                        <div className="relative">
                                            <PhotoMosaic
                                                images={previews.map(
                                                    (url, index) => ({
                                                        key: url,
                                                        url,
                                                        alt: `Photo ${index + 1} of ${previews.length} to post`,
                                                    }),
                                                )}
                                                onSelect={() =>
                                                    setView('photos')
                                                }
                                                overlay={
                                                    goalsCount > 0
                                                        ? goalBadges('media')
                                                        : undefined
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() =>
                                                    setView('photos')
                                                }
                                                className="absolute top-2 left-2 bg-background/95 shadow-[0_1px_3px_rgb(0_0_0/0.2)] hover:bg-background"
                                            >
                                                <Pencil />
                                                Edit all
                                            </Button>
                                            <button
                                                type="button"
                                                onClick={removeAllImages}
                                                className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-background/95 text-foreground shadow-[0_1px_3px_rgb(0_0_0/0.2)] outline-none hover:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/60"
                                            >
                                                <X
                                                    aria-hidden
                                                    className="size-4"
                                                />
                                                <span className="sr-only">
                                                    Remove all photos
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Without photos, the badges sit under
                                        the text, as they will in the feed. */}
                                    {previews.length === 0 &&
                                        goalsCount > 0 &&
                                        goalBadges('surface')}

                                    {errors.map((message) => (
                                        <InputError
                                            key={message}
                                            message={message}
                                        />
                                    ))}
                                </div>

                                <div className="space-y-3 px-4 pb-4">
                                    <div className="flex items-center justify-between gap-3 rounded-[10px] border py-1 pr-1 pl-3">
                                        <span className="text-sm font-medium">
                                            Add to your post
                                        </span>
                                        <div className="flex items-center gap-0.5">
                                            <IconAction
                                                label={
                                                    form.data.images.length >=
                                                    MAX_IMAGES
                                                        ? `Photos (${MAX_IMAGES} of ${MAX_IMAGES})`
                                                        : 'Photos'
                                                }
                                                onClick={pickPhotos}
                                                disabled={
                                                    form.data.images.length >=
                                                    MAX_IMAGES
                                                }
                                                className={cn(
                                                    'rounded-full text-emerald-600 dark:text-emerald-400',
                                                    previews.length > 0 &&
                                                        'bg-muted',
                                                )}
                                            >
                                                <ImagePlus className="size-5" />
                                            </IconAction>
                                            <IconAction
                                                label="Tag people"
                                                onClick={() => setView('tag')}
                                                className={cn(
                                                    'rounded-full text-chart-3',
                                                    tagged.length > 0 &&
                                                        'bg-muted',
                                                )}
                                            >
                                                <UserPlus className="size-5" />
                                            </IconAction>
                                            <IconAction
                                                label="Feeling"
                                                onClick={() =>
                                                    setView('feeling')
                                                }
                                                className={cn(
                                                    'rounded-full text-signature-mustard',
                                                    feeling && 'bg-muted',
                                                )}
                                            >
                                                <Smile className="size-5" />
                                            </IconAction>
                                            <IconAction
                                                label={GOALS_LABEL}
                                                onClick={() => setView('goals')}
                                                className={cn(
                                                    'rounded-full text-brand',
                                                    goalsCount > 0 &&
                                                        'bg-muted',
                                                )}
                                            >
                                                <Target className="size-5" />
                                            </IconAction>
                                        </div>
                                    </div>

                                    {remaining < 500 && (
                                        <p
                                            className="-mt-1 text-xs text-muted-foreground tabular-nums"
                                            aria-live="polite"
                                        >
                                            {remaining} characters left
                                        </p>
                                    )}

                                    {form.data.images.length > 0 && (
                                        <p className="-mt-1 text-xs text-muted-foreground">
                                            Photo posts the network reacts to
                                            most may be featured on the public
                                            PHLGADIS homepage, credited to your
                                            institution or office.
                                        </p>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={
                                            !hasContent || form.processing
                                        }
                                        className="h-10 w-full rounded-[10px]"
                                    >
                                        {form.processing && <Spinner />}
                                        {form.processing ? 'Posting…' : 'Post'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
}

function ComposerShortcut({
    label,
    count,
    onClick,
    children,
}: {
    label: string;
    count: number;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            onClick={onClick}
            className="h-9 min-w-0 flex-1 gap-2 rounded-[10px] text-muted-foreground hover:text-foreground"
        >
            {children}
            {/* Four don't fit with names on a phone; the icons stay. */}
            <span className="max-sm:sr-only">{label}</span>
            {count > 0 && (
                <span className="text-xs text-foreground tabular-nums">
                    ({count})
                </span>
            )}
        </Button>
    );
}

function StatusLink({
    onClick,
    children,
}: {
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
            {children}
        </button>
    );
}
