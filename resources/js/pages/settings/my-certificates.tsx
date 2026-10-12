import { Head } from '@inertiajs/react';
import { ExternalLink, ScrollText } from 'lucide-react';
import { DownloadCertificateButton } from '@/components/certificates/download-certificate-button';
import Heading from '@/components/heading';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { certificateDates } from '@/lib/certificate-text';
import type { MyCertificatePage } from '@/types/certificates';

/**
 * Settings → My certificates: the certificates released to you for the GAD
 * events you were checked in to (docs/certificates.md), to download as PDFs.
 */
export default function MyCertificates({
    certificates,
}: {
    certificates: MyCertificatePage;
}) {
    return (
        <>
            <Head title="My certificates" />

            <h1 className="sr-only">My certificates</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="My certificates"
                    description="Certificates from the GAD events you attended. Download them as PDFs to print or share; each has a QR code anyone can scan to check it."
                />

                {certificates.data.length > 0 ? (
                    <section
                        aria-label="Certificates"
                        className="overflow-hidden rounded-xl border bg-card"
                    >
                        <ul className="divide-y">
                            {certificates.data.map((certificate) => (
                                <li
                                    key={certificate.id}
                                    className="flex gap-4 px-4 py-4 sm:px-5"
                                >
                                    <span
                                        aria-hidden
                                        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
                                    >
                                        <ScrollText className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">
                                            {certificate.title}
                                        </p>
                                        <p className="mt-0.5 text-sm text-pretty">
                                            {certificate.event?.title}
                                        </p>
                                        <p className="mt-1 text-[13px] text-muted-foreground">
                                            {certificate.event &&
                                                certificateDates(
                                                    certificate.event.starts_at,
                                                    certificate.event.ends_at,
                                                )}
                                            {certificate.office &&
                                                ` · ${certificate.office}`}
                                        </p>
                                        <p className="mt-0.5 text-[13px] text-muted-foreground tabular-nums">
                                            No. {certificate.number}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <DownloadCertificateButton
                                                id={certificate.id}
                                                label={`Download ${certificate.title ?? 'certificate'} for ${certificate.event?.title ?? 'the event'}`}
                                                compact
                                            />
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="min-h-10"
                                            >
                                                <a
                                                    href={
                                                        certificate.verify_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink aria-hidden />
                                                    Verify page
                                                    <span className="sr-only">
                                                        (opens in a new tab)
                                                    </span>
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <Pagination
                            page={certificates.meta}
                            label="certificates"
                            className="sm:px-5"
                        />
                    </section>
                ) : (
                    <div className="flex flex-col items-center rounded-xl border border-dashed px-6 py-10 text-center">
                        <ScrollText
                            aria-hidden
                            className="size-8 text-muted-foreground"
                        />
                        <p className="mt-3 font-medium">No certificates yet</p>
                        <p className="mt-1 max-w-sm text-sm text-pretty text-muted-foreground">
                            When you attend a GAD event and staff release its
                            certificates, they appear here.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
