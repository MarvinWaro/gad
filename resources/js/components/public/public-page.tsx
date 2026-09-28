import type { MouseEventHandler, ReactNode } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/public/site-layout';

// The frame of every standalone public page (/resources/{area}, /help/*):
// public header, a back link, the intro, and the footer.
export function PublicPage({
    title,
    eyebrow,
    back,
    description,
    summary,
    metaDescription,
    onMainClick,
    children,
}: {
    title: string;
    /** The small label above the title, naming the part of the site. */
    eyebrow: string;
    back: { href: string; label: string };
    description?: string;
    summary?: string;
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
            <main id="main" className="public-page" onClick={onMainClick}>
                <div className="public-container public-page-intro">
                    <Link className="page-back-link" href={back.href}>
                        <ArrowLeft aria-hidden="true" />
                        {back.label}
                    </Link>
                    <p className="section-label">
                        <span />
                        {eyebrow}
                    </p>
                    <h1>{title}</h1>
                    {description && (
                        <p className="section-description">{description}</p>
                    )}
                    {summary && <p className="public-page-meta">{summary}</p>}
                </div>
                {children}
            </main>
            <SiteFooter homeUrl="/" />
        </div>
    );
}
