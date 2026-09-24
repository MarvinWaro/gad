import { useForm } from '@inertiajs/react';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { SourceAvatar } from '@/components/hei/source-avatar';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

const MAX_IMAGES = 4;
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_LENGTH = 5000;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

type ComposerForm = { body: string; images: File[] };

export function PostComposer({
    authorLabel,
    official = false,
    placeholder = 'Share a GAD activity from your campus…',
}: {
    authorLabel: string;
    official?: boolean;
    placeholder?: string;
}) {
    const inputId = useId();
    const fileInput = useRef<HTMLInputElement>(null);
    const textarea = useRef<HTMLTextAreaElement>(null);
    const [previews, setPreviews] = useState<string[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const form = useForm<ComposerForm>({ body: '', images: [] });

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

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post('/posts', {
            forceFormData: true,
            preserveScroll: true,
            reset: ['posts'],
            onSuccess: () => {
                previews.forEach((url) => URL.revokeObjectURL(url));
                setPreviews([]);
                setFileError(null);
                form.reset();
                requestAnimationFrame(resize);
            },
        });
    }

    const imageErrors = Object.entries(form.errors)
        .filter(([key]) => key.startsWith('images'))
        .map(([, message]) => message);
    const hasContent =
        form.data.body.trim().length > 0 || form.data.images.length > 0;
    const remaining = MAX_LENGTH - form.data.body.length;

    return (
        <form
            onSubmit={submit}
            className="rounded-[10px] border bg-card transition-[border-color,box-shadow] duration-150 focus-within:border-ring/60 focus-within:ring-[3px] focus-within:ring-ring/15"
        >
            <div className="flex gap-3 px-4 pt-4">
                <SourceAvatar name={authorLabel} official={official} />
                <label htmlFor={inputId} className="sr-only">
                    New post
                </label>
                <textarea
                    id={inputId}
                    ref={textarea}
                    value={form.data.body}
                    onChange={(event) => {
                        form.setData('body', event.target.value);
                        resize();
                    }}
                    placeholder={placeholder}
                    rows={2}
                    maxLength={MAX_LENGTH}
                    aria-invalid={Boolean(form.errors.body)}
                    className="min-h-[3.25rem] w-full resize-none bg-transparent py-2 text-[0.9375rem] leading-relaxed outline-none placeholder:text-muted-foreground"
                />
            </div>

            {previews.length > 0 && (
                <ul
                    aria-label="Photos to post"
                    className="flex flex-wrap gap-2 px-4 pt-3 sm:pl-[4.25rem]"
                >
                    {previews.map((url, index) => (
                        <li key={url} className="relative">
                            <img
                                src={url}
                                alt={`Photo ${index + 1} to post`}
                                className="size-20 rounded-[10px] border object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border bg-background text-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <X aria-hidden className="size-3.5" />
                                <span className="sr-only">
                                    Remove photo {index + 1}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <div className="px-4 sm:pl-[4.25rem]">
                <InputError message={form.errors.body} className="mt-2" />
                {[fileError, ...imageErrors]
                    .filter((message): message is string => Boolean(message))
                    .map((message) => (
                        <InputError
                            key={message}
                            message={message}
                            className="mt-2"
                        />
                    ))}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t px-3 py-2.5">
                <div className="flex items-center gap-1">
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
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInput.current?.click()}
                        disabled={form.data.images.length >= MAX_IMAGES}
                        className="text-muted-foreground"
                    >
                        <ImagePlus />
                        Add photos
                        {form.data.images.length > 0 && (
                            <span className="tabular-nums">
                                {form.data.images.length}/{MAX_IMAGES}
                            </span>
                        )}
                    </Button>
                    {remaining < 500 && (
                        <span
                            className="text-xs text-muted-foreground tabular-nums"
                            aria-live="polite"
                        >
                            {remaining} characters left
                        </span>
                    )}
                </div>
                <Button
                    type="submit"
                    disabled={!hasContent || form.processing}
                    className="h-9 rounded-[10px] px-5"
                >
                    {form.processing && <Spinner />}
                    Post
                </Button>
            </div>
        </form>
    );
}
