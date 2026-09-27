import type { MouseEventHandler, ReactNode } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/public/site-layout';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/file-size';

// The shared frame of every /resources/{area} page: public header, a back
// link to the homepage Resources section, the intro, and the footer.
export function ResourcePage({
    title,
    description,
    summary,
    metaDescription,
    onMainClick,
    children,
}: {
    title: string;
    description: string;
    summary: string;
    metaDescription: string;
    onMainClick?: MouseEventHandler<HTMLElement>;
    children: ReactNode;
}) {
    const { auth } = usePage().props;

    return (
        <div className="public-theme dot-backdrop">
            <Head>
                <title>{`PHLGADIS | ${title}`}</title>
                <meta name="description" content={metaDescription} />
            </Head>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <SiteHeader authenticated={Boolean(auth.user)} homeUrl="/" />
            <main id="main" className="resource-page" onClick={onMainClick}>
                <div className="public-container resource-intro">
                    <Link className="page-back-link" href="/#resources">
                        <ArrowLeft aria-hidden="true" />
                        Back to Resources
                    </Link>
                    <p className="section-label">
                        <span />
                        Resources
                    </p>
                    <h1>{title}</h1>
                    <p className="section-description">{description}</p>
                    <p className="resource-meta">{summary}</p>
                </div>
                {children}
            </main>
            <SiteFooter homeUrl="/" />
        </div>
    );
}

// Screen-reader suffix for a link to a document, which is either a PDF
// served from public/ or a web page.
export function documentHint(href: string, bytes?: number) {
    if (!href.endsWith('.pdf')) return ' (opens in a new tab)';

    return bytes
        ? ` (PDF, ${formatFileSize(bytes)}, opens in a new tab)`
        : ' (PDF, opens in a new tab)';
}

// A row's main action: open the document in a new tab, with its format and
// size (or the site it lives on) written underneath.
export function DocumentButton({
    href,
    label,
    name,
    bytes,
}: {
    href: string;
    label: string;
    // Names the document for screen readers, e.g. "RA 7877".
    name: string;
    bytes?: number;
}) {
    const isPdf = href.endsWith('.pdf');

    return (
        <>
            <Button asChild variant="outline">
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                    <span className="sr-only">
                        {' '}
                        {name}
                        {documentHint(href, bytes)}
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                </a>
            </Button>
            <span className="resource-row-source" aria-hidden="true">
                {isPdf
                    ? bytes
                        ? `PDF · ${formatFileSize(bytes)}`
                        : 'PDF'
                    : new URL(href).hostname}
            </span>
        </>
    );
}
