import { useForm, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useId } from 'react';
import type { FormEvent } from 'react';
import { SharedPostEmbed } from '@/components/hei/post-parts';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { PersonAvatar } from '@/components/person-avatar';
import type { Post } from '@/types';

/**
 * "Share post": repost into the Region XII feed with an optional message.
 * Sharing a share passes along the original, as the server does.
 */
export function SharePostDialog({
    post,
    open,
    onOpenChange,
}: {
    post: Post;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { auth } = usePage().props;
    const inputId = useId();
    const form = useForm({ body: '' });
    const original = post.shared_post ?? post;

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        form.post(`/posts/${post.id}/share`, {
            preserveScroll: true,
            reset: ['posts'],
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                data-surface="hei"
                showCloseButton={false}
                className="flex max-h-[min(90dvh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[31.25rem]"
            >
                <header className="relative flex h-15 shrink-0 items-center justify-center border-b px-14">
                    <DialogTitle className="text-base font-medium">
                        Share post
                    </DialogTitle>
                    <DialogClose className="absolute right-3 flex size-9 items-center justify-center rounded-full bg-muted outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50">
                        <X aria-hidden className="size-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </header>
                <DialogDescription className="sr-only">
                    Share this post to Gender Mainstreaming, with a message if
                    you like.
                </DialogDescription>

                <form
                    onSubmit={submit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pt-4 pb-3">
                        <div className="flex items-center gap-3">
                            <PersonAvatar
                                name={auth.user.name}
                                src={auth.user.avatar}
                                className="size-10"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {auth.user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Sharing to Gender Mainstreaming
                                </p>
                            </div>
                        </div>

                        <label htmlFor={inputId} className="sr-only">
                            Your message (optional)
                        </label>
                        <textarea
                            id={inputId}
                            value={form.data.body}
                            onChange={(event) =>
                                form.setData('body', event.target.value)
                            }
                            rows={3}
                            maxLength={5000}
                            autoFocus
                            placeholder="Say something about this… (optional)"
                            aria-invalid={Boolean(form.errors.body)}
                            className="w-full resize-none bg-transparent text-base leading-relaxed caret-brand outline-none placeholder:text-muted-foreground"
                        />
                        <InputError message={form.errors.body} />

                        <SharedPostEmbed post={original} />
                    </div>

                    <div className="shrink-0 px-4 pt-1 pb-4">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 w-full rounded-[10px]"
                        >
                            {form.processing && <Spinner />}
                            {form.processing ? 'Sharing…' : 'Share now'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
