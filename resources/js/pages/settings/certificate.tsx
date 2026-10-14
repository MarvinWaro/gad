import { Head, Link, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CertificatePreview } from '@/components/certificates/certificate-preview';
import {
    BODY_MAX,
    LogoField,
    WordingField,
} from '@/components/certificates/design-fields';
import type { LogoItem } from '@/components/certificates/design-fields';
import {
    BackgroundPicker,
    KindPicker,
    SignatoryPicker,
} from '@/components/certificates/design-pickers';
import { DesignPair } from '@/components/certificates/design-pair';
import { EventUses } from '@/components/certificates/event-uses';
import InputError from '@/components/input-error';
import { fieldClass, selectClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index, store, update } from '@/routes/settings/certificates';
import { index as signatoriesIndex } from '@/routes/settings/certificate-signatories';
import type {
    CertificateDesign,
    CertificateDocument,
    CertificateKind,
    CertificateKindOption,
    CertificateOffice,
    EventCertificate,
    Signatory,
} from '@/types/certificates';

const MAX_LOGOS = 3;
const MAX_SIGNATORIES = 3;

/**
 * What the preview prints in place of a person and their event; the number
 * and its QR come from the server (`sample`).
 */
const SAMPLE = {
    name: 'JUAN DELA CRUZ',
    affiliation: 'Sample State University',
    event: {
        title: 'Sample GAD Event',
        starts_at: '2026-10-14T08:00:00',
        ends_at: '2026-10-15T17:00:00',
        is_all_day: false,
        location: 'Sample venue',
    },
    days: ['2026-10-14', '2026-10-15'],
    released_on: '2026-10-15',
} as const;

type DesignForm = {
    /** The Central Office's pick; empty for its own. */
    region: string;
    kind: CertificateKind;
    name: string;
    background: string;
    body: string;
    signatories: string[];
    kept_logos: string[];
    new_logos: File[];
};

/**
 * Settings → Certificates → a design (docs/certificates.md): its office,
 * kind, background, wording, logos and signatories, beside a preview drawn
 * from the PDF itself, and the events it is used on.
 */
export default function CertificateEditor({
    design,
    uses,
    kinds,
    signatories,
    offices,
    nationalAccess,
    ownRegion,
    sample,
}: {
    design: CertificateDesign | null;
    uses: EventCertificate[];
    kinds: CertificateKindOption[];
    backgrounds: string[];
    blanks: string[];
    signatories: Signatory[];
    offices: CertificateOffice[];
    nationalAccess: boolean;
    ownRegion: number | null;
    sample: Pick<CertificateDocument, 'number' | 'verify_url' | 'qr'>;
}) {
    const id = useId();
    const first = kinds[0];
    // The design as saved: a fresh form starts from it, and so does the
    // form once a save comes back.
    const saved = (from: CertificateDesign | null): DesignForm => ({
        region: from?.region
            ? String(from.region.id)
            : ownRegion !== null
              ? String(ownRegion)
              : '',
        kind: from?.kind ?? first.value,
        name: from?.name ?? '',
        background: from?.background ?? 'frame',
        body: from?.body ?? first.body,
        signatories: from?.signatories?.map((signatory) => signatory.id) ?? [],
        kept_logos: from?.logos.map((logo) => logo.key) ?? [],
        new_logos: [],
    });
    const form = useForm<DesignForm>(saved(design));
    const [newLogoUrls, setNewLogoUrls] = useState<string[]>([]);
    const created = useRef(new Set<string>());
    const kind =
        kinds.find((option) => option.value === form.data.kind) ?? first;
    const office =
        offices.find((option) => String(option.id) === form.data.region) ??
        null;
    const regionId = form.data.region === '' ? null : Number(form.data.region);
    const options = signatories.filter(
        (signatory) => (signatory.region?.id ?? null) === regionId,
    );
    const chosen = form.data.signatories
        .map((signatoryId) =>
            options.find((option) => option.id === signatoryId),
        )
        .filter((option): option is Signatory => option !== undefined);
    const logos: LogoItem[] = [
        ...form.data.kept_logos
            .map((key) => design?.logos.find((logo) => logo.key === key))
            .filter((logo): logo is LogoItem => logo !== undefined),
        ...newLogoUrls.map((url) => ({ key: url, url })),
    ];
    const used = (design?.uses ?? 0) > 0;

    // New logos' previews live until they are removed, saved or left.
    useEffect(() => {
        const urls = created.current;

        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    function forgetNewLogos(urls: string[]) {
        urls.forEach((url) => {
            URL.revokeObjectURL(url);
            created.current.delete(url);
        });
    }

    const preview: CertificateDocument = {
        ...SAMPLE,
        days: [...SAMPLE.days],
        ...sample,
        kind: kind.value,
        title: kind.title,
        lead: kind.lead,
        background: form.data.background,
        body: form.data.body,
        office: office ? { name: office.name, city: office.city } : null,
        logos: logos.map((logo) => logo.url),
        signatories: chosen.map((signatory) => ({
            name: signatory.name,
            position: signatory.position,
            signature: signatory.signature,
        })),
    };

    function pickKind(next: CertificateKindOption) {
        form.setData((data) => ({
            ...data,
            kind: next.value,
            // Untouched wording follows the kind.
            body: data.body === kind.body ? next.body : data.body,
        }));
    }

    function pickRegion(region: string) {
        form.setData((data) => ({ ...data, region, signatories: [] }));
    }

    function addLogo(file: File) {
        const url = URL.createObjectURL(file);
        created.current.add(url);
        form.setData((data) => ({
            ...data,
            new_logos: [...data.new_logos, file],
        }));
        setNewLogoUrls((urls) => [...urls, url]);
    }

    function removeLogo(key: string) {
        const index = newLogoUrls.indexOf(key);

        if (index === -1) {
            form.setData((data) => ({
                ...data,
                kept_logos: data.kept_logos.filter((kept) => kept !== key),
            }));

            return;
        }

        form.setData((data) => ({
            ...data,
            new_logos: data.new_logos.filter(
                (_, position) => position !== index,
            ),
        }));
        setNewLogoUrls((urls) => urls.filter((url) => url !== key));
        forgetNewLogos([key]);
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            // The saved design now holds the new logos.
            onSuccess: (page: { props: object }) => {
                const fresh = (
                    page.props as { design?: CertificateDesign | null }
                ).design;
                forgetNewLogos(newLogoUrls);
                setNewLogoUrls([]);
                form.setData(saved(fresh ?? null));
            },
        };

        if (design) {
            // Logos need multipart, which PHP reads only from POST.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(update.url(design.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    return (
        <>
            <Head title={design ? design.name : 'New certificate'} />
            <div className="space-y-6">
                <Link
                    href={index.url()}
                    className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-md px-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <ChevronLeft aria-hidden className="size-4" />
                    Certificates
                </Link>

                <header>
                    <h1 className="text-xl font-medium">
                        {design ? design.name : 'New certificate'}
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">
                        Every certificate prints the CHED seal, Bagong Pilipinas
                        and your office&apos;s letterhead. The person&apos;s
                        name is printed in capitals.
                    </p>
                </header>

                <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:items-start">
                    <form
                        className="order-2 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 xl:order-1"
                        onSubmit={submit}
                        noValidate
                    >
                        {nationalAccess && (
                            <div className="grid gap-2">
                                <Label htmlFor={`${id}-region`}>Office</Label>
                                <FormSelect
                                    id={`${id}-region`}
                                    className={selectClass}
                                    value={form.data.region}
                                    disabled={used}
                                    onChange={pickRegion}
                                    placeholder="CHED Central Office"
                                    allowEmpty
                                    emptyLabel="CHED Central Office"
                                    options={offices.map((option) => ({
                                        value: String(option.id),
                                        label: option.name,
                                    }))}
                                />
                                <p className="text-[13px] text-muted-foreground">
                                    {used
                                        ? 'Used on events, so it stays with its office.'
                                        : 'Its letterhead and signatories. The Central Office’s certificates are for events of every region.'}
                                </p>
                                <InputError message={form.errors.region} />
                            </div>
                        )}

                        <KindPicker
                            kinds={kinds}
                            value={form.data.kind}
                            locked={used}
                            onChange={pickKind}
                        />
                        <InputError message={form.errors.kind} />
                        {design && (
                            <DesignPair
                                design={design}
                                otherTitle={
                                    kinds.find(
                                        (kind) => kind.value !== design.kind,
                                    )?.title ?? 'other kind'
                                }
                            />
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-name`}>
                                Name in your list
                            </Label>
                            <input
                                id={`${id}-name`}
                                className={fieldClass}
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                maxLength={120}
                                required
                                placeholder="Such as GAD Orientation 2026"
                                aria-describedby={`${id}-name-hint`}
                                aria-invalid={
                                    form.errors.name ? true : undefined
                                }
                            />
                            <p
                                id={`${id}-name-hint`}
                                className="text-[13px] text-muted-foreground"
                            >
                                Only your office sees it. It isn&apos;t printed.
                            </p>
                            <InputError message={form.errors.name} />
                        </div>

                        <BackgroundPicker
                            value={form.data.background}
                            onChange={(background) =>
                                form.setData('background', background)
                            }
                        />

                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-body`}>Wording</Label>
                            <p
                                id={`${id}-body-hint`}
                                className="-mt-1 text-[13px] text-pretty text-muted-foreground"
                            >
                                Printed after “{kind.lead}”, the name and their
                                institution. Blanks are filled in for each
                                person; the event&apos;s title prints in bold.
                            </p>
                            <WordingField
                                id={`${id}-body`}
                                value={form.data.body}
                                defaultBody={kind.body}
                                invalid={Boolean(form.errors.body)}
                                describedBy={`${id}-body-hint`}
                                onChange={(body) =>
                                    form.setData(
                                        'body',
                                        body.slice(0, BODY_MAX),
                                    )
                                }
                            />
                            <InputError message={form.errors.body} />
                        </div>

                        <div className="grid gap-2">
                            <p className="text-sm font-medium">Extra logos</p>
                            <p
                                id={`${id}-logos-hint`}
                                className="-mt-1 text-[13px] text-pretty text-muted-foreground"
                            >
                                Optional: up to three, such as a partner
                                HEI&apos;s, between the CHED seal and Bagong
                                Pilipinas. PNG or JPG, under 1 MB.
                            </p>
                            <LogoField
                                id={`${id}-logos`}
                                logos={logos}
                                max={MAX_LOGOS}
                                onAdd={addLogo}
                                onRemove={removeLogo}
                                describedBy={`${id}-logos-hint`}
                            />
                            <InputError
                                message={
                                    form.errors.new_logos ??
                                    Object.entries(form.errors).find(([key]) =>
                                        key.startsWith('new_logos.'),
                                    )?.[1]
                                }
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor={`${id}-signatories`}>
                                Signatories
                            </Label>
                            <p className="-mt-1 text-[13px] text-pretty text-muted-foreground">
                                Up to three, left to right on the certificate.{' '}
                                <Link
                                    href={signatoriesIndex.url()}
                                    className="underline underline-offset-2 hover:text-foreground"
                                >
                                    Manage signatories
                                </Link>
                            </p>
                            <SignatoryPicker
                                id={`${id}-signatories`}
                                options={options}
                                value={form.data.signatories}
                                max={MAX_SIGNATORIES}
                                onChange={(ids) =>
                                    form.setData('signatories', ids)
                                }
                                invalid={Boolean(form.errors.signatories)}
                            />
                            <InputError message={form.errors.signatories} />
                        </div>

                        <div className="flex flex-wrap gap-2 border-t pt-6">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing && <Spinner />}
                                {design
                                    ? 'Save certificate'
                                    : 'Create certificate'}
                            </Button>
                        </div>
                    </form>

                    <div className="order-1 min-w-0 space-y-8 xl:sticky xl:top-6 xl:order-2">
                        <CertificatePreview certificate={preview} />
                        {design && <EventUses design={design} uses={uses} />}
                    </div>
                </div>
            </div>
        </>
    );
}
