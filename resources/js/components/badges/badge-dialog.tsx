import { useForm } from '@inertiajs/react';
import { ImageUp, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import { Medal } from '@/components/badges/medal';
import InputError from '@/components/input-error';
import { fieldClass, selectClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FormSelect } from '@/components/ui/form-select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { squareImage } from '@/lib/square-image';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/settings/badges';
import type { BadgeRow } from '@/types/badges';
import type { DirectoryOption } from '@/types/monitoring';

type BadgeForm = {
    name: string;
    description: string;
    is_active: boolean;
    /** The Central Office's pick; empty for every region. */
    region: string;
    image: File | null;
    remove_image: boolean;
};

/**
 * New badge, or Edit badge: its name, what it is for, its picture and
 * whether it is on. A picture is shrunk in the browser to a 256px square
 * before it is sent. A system badge's rule is shown, not edited.
 */
export function BadgeDialog({
    badge,
    regions,
    nationalAccess,
    children,
}: {
    badge: BadgeRow | null;
    regions: DirectoryOption[];
    nationalAccess: boolean;
    /** The button that opens it. */
    children: ReactElement;
}) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(badge?.image ?? null);
    const [pictureError, setPictureError] = useState<string>();
    const form = useForm<BadgeForm>({
        name: badge?.name ?? '',
        description: badge?.description ?? '',
        is_active: badge?.is_active ?? true,
        region: badge?.region ? String(badge.region.id) : '',
        image: null,
        remove_image: false,
    });

    // A chosen picture's preview lives until another replaces it.
    useEffect(
        () => () => {
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        },
        [preview],
    );

    async function choose(file: File | undefined) {
        if (!file) {
            return;
        }

        try {
            const small = await squareImage(file);
            form.setData((data) => ({
                ...data,
                image: small,
                remove_image: false,
            }));
            setPreview(URL.createObjectURL(small));
            setPictureError(undefined);
        } catch {
            setPictureError('That picture could not be read. Try a PNG.');
        }
    }

    function removePicture() {
        form.setData((data) => ({ ...data, image: null, remove_image: true }));
        setPreview(null);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);

                if (!badge) {
                    form.reset();
                    setPreview(null);
                }
            },
        };

        if (badge) {
            // A picture needs multipart, which PHP reads only from POST.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(update.url(badge.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {badge ? 'Edit badge' : 'New badge'}
                    </DialogTitle>
                    <DialogDescription>
                        {badge?.criterion
                            ? 'People earn this badge by sharing GAD work. You can change its words and picture.'
                            : 'You award this badge by hand, from its page, to people who did something worth marking.'}
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit} noValidate>
                    <div className="flex items-center gap-4">
                        <Medal
                            kind={badge?.medal ?? 'custom'}
                            image={preview}
                            className="size-20"
                        />
                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="min-h-10"
                                    onClick={() => input.current?.click()}
                                >
                                    <ImageUp />
                                    {preview
                                        ? 'Change picture'
                                        : 'Upload picture'}
                                </Button>
                                {preview && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="min-h-10 text-muted-foreground"
                                        onClick={removePicture}
                                    >
                                        <Trash2 />
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <p
                                id={`${id}-picture-hint`}
                                className="text-[13px] text-muted-foreground"
                            >
                                Optional. A square PNG with a clear background
                                looks best. Without one, the badge uses its
                                medal.
                            </p>
                            <input
                                ref={input}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="sr-only"
                                tabIndex={-1}
                                aria-label="Badge picture"
                                aria-describedby={`${id}-picture-hint`}
                                onChange={(event) => {
                                    void choose(event.target.files?.[0]);
                                    event.target.value = '';
                                }}
                            />
                            <InputError
                                message={pictureError ?? form.errors.image}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-name`}>Name</Label>
                        <input
                            id={`${id}-name`}
                            className={fieldClass}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            maxLength={60}
                            required
                            aria-invalid={form.errors.name ? true : undefined}
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-description`}>
                            What it is for
                        </Label>
                        <textarea
                            id={`${id}-description`}
                            className={cn(fieldClass, 'min-h-20')}
                            rows={3}
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            maxLength={200}
                            required
                            aria-invalid={
                                form.errors.description ? true : undefined
                            }
                        />
                        <InputError message={form.errors.description} />
                    </div>

                    {badge?.criterion ? (
                        <p className="rounded-lg bg-muted px-4 py-3 text-sm">
                            <span className="text-muted-foreground">
                                Earned by:{' '}
                            </span>
                            {badge.criterion}
                        </p>
                    ) : (
                        nationalAccess && (
                            <div className="grid gap-2">
                                <Label htmlFor={`${id}-region`}>
                                    Who can receive it
                                </Label>
                                <FormSelect
                                    id={`${id}-region`}
                                    className={selectClass}
                                    value={form.data.region}
                                    onChange={(region) =>
                                        form.setData('region', region)
                                    }
                                    placeholder="People of every region"
                                    allowEmpty
                                    emptyLabel="People of every region"
                                    options={regions.map((region) => ({
                                        value: String(region.id),
                                        label: `People of ${region.name}`,
                                    }))}
                                />
                                <InputError message={form.errors.region} />
                            </div>
                        )
                    )}

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p
                                id={`${id}-active`}
                                className="text-sm font-medium"
                            >
                                On
                            </p>
                            <p
                                id={`${id}-active-hint`}
                                className="text-[13px] text-muted-foreground"
                            >
                                Off: nobody receives it; those who hold it keep
                                it.
                            </p>
                        </div>
                        <Switch
                            checked={form.data.is_active}
                            onCheckedChange={(active) =>
                                form.setData('is_active', active)
                            }
                            aria-labelledby={`${id}-active`}
                            aria-describedby={`${id}-active-hint`}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            {badge ? 'Save badge' : 'Create badge'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
