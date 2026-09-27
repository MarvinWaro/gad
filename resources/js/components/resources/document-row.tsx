import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { laws, type LawRecord } from '@/data/phlgadis-demo';

const lawsBySlug = new Map(laws.map((law) => [law.slug, law]));
const longDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
});

// One document on a resource page: artwork or a document tile, an optional
// number pill, the title, short facts, extra links, and its actions.
export function DocumentRow({
    id,
    art,
    icon: Icon,
    label,
    title,
    facts = [],
    actions,
    children,
}: {
    id: string;
    art?: { src: string; alt: string };
    icon?: LucideIcon;
    label?: string;
    title: string;
    facts?: ReactNode[];
    actions: ReactNode;
    children?: ReactNode;
}) {
    return (
        <li
            id={id}
            className="resource-row"
            data-media={art ? undefined : 'icon'}
        >
            {art ? (
                <img
                    className="resource-row-art"
                    src={art.src}
                    width="285"
                    height="160"
                    loading="lazy"
                    decoding="async"
                    alt={art.alt}
                />
            ) : (
                Icon && (
                    <span className="resource-row-icon">
                        <Icon aria-hidden="true" strokeWidth={1.5} />
                    </span>
                )
            )}
            <div className="resource-row-body">
                {label && <span className="law-number">{label}</span>}
                <h2>{title}</h2>
                {facts.length > 0 && (
                    <p className="resource-row-facts">
                        {facts.map((fact, index) => (
                            <span key={index}>{fact}</span>
                        ))}
                    </p>
                )}
                {children}
            </div>
            <div className="resource-row-actions">{actions}</div>
        </li>
    );
}

// "Approved February 14, 1995", with a machine-readable date.
export function DatedFact({ label, date }: { label: string; date: string }) {
    return (
        <>
            {label}{' '}
            <time dateTime={date}>{longDate.format(new Date(date))}</time>
        </>
    );
}

// Chips linking each law a document names to its row on the Republic Acts
// page.
export function RelatedLaws({ slugs }: { slugs: LawRecord['slug'][] }) {
    return (
        <div className="resource-row-laws">
            <span>Related laws</span>
            {slugs.map((slug) => {
                const law = lawsBySlug.get(slug);
                if (!law) return null;

                return (
                    <Link
                        key={slug}
                        href={`/resources/gad-enabling-republic-acts#${slug}`}
                        title={law.shortTitle}
                    >
                        {law.number}
                        <span className="sr-only">{`, ${law.shortTitle}`}</span>
                    </Link>
                );
            })}
        </div>
    );
}
