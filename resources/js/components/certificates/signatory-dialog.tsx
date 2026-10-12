import { useForm } from '@inertiajs/react';
import { ImageUp } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactElement } from 'react';
import InputError from '@/components/input-error';
import { fieldClass, selectClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/settings/certificate-signatories';
import type { Signatory } from '@/types/certificates';
import type { DirectoryOption } from '@/types/monitoring';

type SignatoryForm = {
    name: string;
    position: string;
    /** The Central Office's pick; empty for its own. */
    region: string;
    signature: File | null;
    consent: boolean;
};

/** The e-signature on white, as certificates print it. */
export function SignatureTile({
    src,
    name,
    className,
}: {
    src: string | null;
    name: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'flex items-center justify-center overflow-hidden rounded-md border bg-paper p-1.5',
                className,
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={`E-signature of ${name}`}
                    className="max-h-full max-w-full object-contain"
                />
            ) : (
                <span className="text-xs text-paper-foreground/70">
                    No signature yet
                </span>
            )}
        </span>
    );
}

/**
 * Add signatory, or Edit signatory: the name and position certificates
 * print, and the e-signature, uploaded only with the signatory's consent
 * (docs/certificates.md). A new signature leaves the old one on certificates
 * already released.
 */
export function SignatoryDialog({
    signatory,
    regions,
    nationalAccess,
    children,
}: {
    signatory: Signatory | null;
    regions: DirectoryOption[];
    nationalAccess: boolean;
    /** The button that opens it. */
    children: ReactElement;
}) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(
        signatory?.signature ?? null,
    );
    const saved = (): SignatoryForm => ({
        name: signatory?.name ?? '',
        position: signatory?.position ?? '',
        region: signatory?.region ? String(signatory.region.id) : '',
        signature: null,
        consent: false,
    });
    const form = useForm<SignatoryForm>(saved());

    // A chosen picture's preview lives until another replaces it.
    useEffect(
        () => () => {
            if (preview?.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        },
        [preview],
    );

    function choose(file: File | undefined) {
        if (!file) {
            return;
        }

        form.setData((data) => ({ ...data, signature: file }));
        form.clearErrors('signature');
        setPreview(URL.createObjectURL(file));
    }

    function changeOpen(next: boolean) {
        if (next) {
            form.setData(saved());
            form.clearErrors();
            setPreview(signatory?.signature ?? null);
        }
        setOpen(next);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };

        if (signatory) {
            // A picture needs multipart, which PHP reads only from POST.
            form.transform((data) => ({
                ...data,
                consent: data.consent ? '1' : '',
                _method: 'put',
            }));
            form.post(update.url(signatory.id), options);
        } else {
            form.transform((data) => ({
                ...data,
                consent: data.consent ? '1' : '',
            }));
            form.post(store.url(), options);
        }
    }

    const needsConsent = form.data.signature !== null;

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {signatory ? 'Edit signatory' : 'Add signatory'}
                    </DialogTitle>
                    <DialogDescription>
                        Certificates print the name in capitals over the
                        e-signature, with the position under it.
                    </DialogDescription>
                </DialogHeader>
                <form className="grid gap-5" onSubmit={submit} noValidate>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-name`}>Name</Label>
                        <input
                            id={`${id}-name`}
                            className={fieldClass}
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            maxLength={120}
                            required
                            placeholder="Such as Dr. Maria Santos, CESO III"
                            aria-invalid={form.errors.name ? true : undefined}
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`${id}-position`}>Position</Label>
                        <input
                            id={`${id}-position`}
                            className={fieldClass}
                            value={form.data.position}
                            onChange={(event) =>
                                form.setData('position', event.target.value)
                            }
                            maxLength={150}
                            required
                            placeholder="Such as Regional Director"
                            aria-invalid={
                                form.errors.position ? true : undefined
                            }
                        />
                        <InputError message={form.errors.position} />
                    </div>

                    {nationalAccess && (
                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-region`}>Office</Label>
                            <FormSelect
                                id={`${id}-region`}
                                className={selectClass}
                                value={form.data.region}
                                onChange={(region) =>
                                    form.setData('region', region)
                                }
                                placeholder="CHED Central Office"
                                allowEmpty
                                emptyLabel="CHED Central Office"
                                options={regions.map((region) => ({
                                    value: String(region.id),
                                    label: region.name,
                                }))}
                            />
                            <InputError message={form.errors.region} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <p
                            id={`${id}-signature`}
                            className="text-sm font-medium"
                        >
                            E-signature
                        </p>
                        <SignatureTile
                            src={preview}
                            name={form.data.name || 'the signatory'}
                            className="h-24"
                        />
                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="min-h-10"
                                aria-describedby={`${id}-signature-hint`}
                                onClick={() => input.current?.click()}
                            >
                                <ImageUp />
                                {preview
                                    ? 'Change signature'
                                    : 'Upload signature'}
                            </Button>
                        </div>
                        <p
                            id={`${id}-signature-hint`}
                            className="text-[13px] text-muted-foreground"
                        >
                            A PNG or JPG of the signature on a white or
                            transparent background, at least 300 pixels wide and
                            under 2 MB.
                        </p>
                        <input
                            ref={input}
                            type="file"
                            accept="image/png,image/jpeg"
                            className="sr-only"
                            tabIndex={-1}
                            aria-labelledby={`${id}-signature`}
                            onChange={(event) => {
                                choose(event.target.files?.[0]);
                                event.target.value = '';
                            }}
                        />
                        <InputError message={form.errors.signature} />
                    </div>

                    {needsConsent && (
                        <div className="grid gap-2">
                            <label className="flex items-start gap-3 text-sm leading-relaxed">
                                <Checkbox
                                    className="mt-0.5"
                                    checked={form.data.consent}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'consent',
                                            checked === true,
                                        )
                                    }
                                    aria-invalid={
                                        form.errors.consent ? true : undefined
                                    }
                                />
                                <span>
                                    The signatory allowed this e-signature to be
                                    used on PHLGADIS certificates.
                                </span>
                            </label>
                            <InputError message={form.errors.consent} />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                form.processing ||
                                (needsConsent && !form.data.consent)
                            }
                        >
                            {form.processing && <Spinner />}
                            {signatory ? 'Save signatory' : 'Add signatory'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
