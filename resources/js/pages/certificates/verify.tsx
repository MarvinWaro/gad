import { Head, router } from '@inertiajs/react';
import { CircleAlert, CircleCheck, SearchX } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { fieldClass } from '@/components/monitoring/shared';
import { PublicPage } from '@/components/public/public-page';
import { Button } from '@/components/ui/button';
import { certificateDates } from '@/lib/certificate-text';
import { localDay } from '@/lib/manila-time';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { index, show } from '@/routes/verify';
import type { CertificateVerification } from '@/types/certificates';
import '../../../css/public.css';

/** A day as the server sends it, "2026-10-15", read as that day. */
function day(value: string): string {
    return localDay(`${value}T12:00:00+08:00`);
}

/**
 * The public page a certificate's QR opens (docs/certificates.md): whether
 * PHLGADIS gave it, to whom and for what, and whether it still stands.
 * Anyone may type a number here too.
 */
export default function VerifyCertificate({
    number,
    certificate,
}: {
    number: string | null;
    certificate: CertificateVerification | null;
}) {
    const id = useId();
    const [value, setValue] = useState(number ?? '');

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const typed = value.replace(/[^A-Za-z0-9 -]/g, '').trim();

        router.get(typed === '' ? index.url() : show.url(typed));
    }

    return (
        <PublicPage
            title="Verify a certificate"
            eyebrow="Certificates"
            back={{ href: home.url(), label: 'Back to home' }}
            description="Check that a certificate from a GAD event is one PHLGADIS gave: scan its QR code, or type the number printed on it."
            metaDescription="Check that a PHLGADIS event certificate is genuine."
        >
            <Head>
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <div className="public-container space-y-6 pb-24">
                <form
                    role="search"
                    onSubmit={submit}
                    className="grid max-w-xl gap-2"
                >
                    <label htmlFor={id} className="text-sm font-medium">
                        Certificate number
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            id={id}
                            className={cn(fieldClass, 'uppercase')}
                            value={value}
                            onChange={(event) => setValue(event.target.value)}
                            placeholder="CERT-7K2M-Q9XA"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            maxLength={30}
                        />
                        <Button type="submit" className="min-h-11 shrink-0">
                            Check
                        </Button>
                    </div>
                </form>

                {number !== null && (
                    <section
                        aria-live="polite"
                        aria-label="Result"
                        className="max-w-xl"
                    >
                        {certificate ? (
                            <Result certificate={certificate} />
                        ) : (
                            <div className="flex gap-3 rounded-xl border bg-card p-5">
                                <SearchX
                                    aria-hidden
                                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                                />
                                <div>
                                    <p className="font-medium">
                                        No certificate has this number
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Check it against the certificate and try
                                        again. Numbers look like CERT-7K2M-Q9XA.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </PublicPage>
    );
}

function Result({ certificate }: { certificate: CertificateVerification }) {
    const valid = certificate.status === 'valid';
    const event = certificate.event;
    const details: [string, string | null][] = [
        ['Certificate', certificate.title],
        ['Given to', certificate.name],
        ['Of', certificate.affiliation],
        ['For', event?.title ?? null],
        [
            'Held',
            event
                ? `${certificateDates(event.starts_at, event.ends_at)}${event.location ? `, ${event.location}` : ''}`
                : null,
        ],
        ['Given by', certificate.office],
        ['Released', day(certificate.issued_on)],
        ['Number', certificate.number],
    ];

    return (
        <div className="overflow-hidden rounded-xl border bg-card">
            <div
                className={cn(
                    'flex gap-3 px-5 py-4',
                    tones[valid ? 'positive' : 'danger'].badge,
                )}
            >
                {valid ? (
                    <CircleCheck
                        aria-hidden
                        className="mt-0.5 size-5 shrink-0"
                    />
                ) : (
                    <CircleAlert
                        aria-hidden
                        className="mt-0.5 size-5 shrink-0"
                    />
                )}
                <div>
                    <p className="font-medium">
                        {valid
                            ? 'This certificate is genuine'
                            : 'This certificate was withdrawn'}
                    </p>
                    <p className="mt-0.5 text-sm">
                        {valid
                            ? 'PHLGADIS gave it, and it still stands.'
                            : `The office that gave it withdrew it${certificate.withdrawn_on ? ` on ${day(certificate.withdrawn_on)}` : ''}, so it no longer stands.`}
                    </p>
                </div>
            </div>
            <dl className="divide-y">
                {details
                    .filter((detail): detail is [string, string] =>
                        Boolean(detail[1]),
                    )
                    .map(([label, text]) => (
                        <div
                            key={label}
                            className="grid gap-1 px-5 py-3 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4"
                        >
                            <dt className="text-sm text-muted-foreground">
                                {label}
                            </dt>
                            <dd
                                className={cn(
                                    'text-sm text-pretty',
                                    label === 'Number' && 'tabular-nums',
                                    label === 'Given to' && 'font-medium',
                                )}
                            >
                                {text}
                            </dd>
                        </div>
                    ))}
            </dl>
        </div>
    );
}
