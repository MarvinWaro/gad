import type { ComponentProps } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PublicPage } from '@/components/public/public-page';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/file-size';

const backToResources = { href: '/#resources', label: 'Back to Resources' };

// Every /resources/{area} page: the public page frame, labelled Resources,
// with a back link to the homepage Resources section.
export function ResourcePage(
    props: Omit<ComponentProps<typeof PublicPage>, 'eyebrow' | 'back'> & {
        summary: string;
    },
) {
    return <PublicPage eyebrow="Resources" back={backToResources} {...props} />;
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
