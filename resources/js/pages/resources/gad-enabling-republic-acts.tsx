import { Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { DatedFact, DocumentRow } from '@/components/resources/document-row';
import {
    DocumentButton,
    ResourcePage,
} from '@/components/resources/resource-page';
import { glossary } from '@/data/definition-of-terms';
import { laws } from '@/data/phlgadis-demo';
import { formatFileSize } from '@/lib/file-size';
import '../../../css/public.css';

const termCounts = new Map(
    glossary.map((group) => [group.law, group.terms.length]),
);

export default function GadEnablingRepublicActs() {
    return (
        <ResourcePage
            title="GAD Enabling Republic Acts"
            description="Read the full text of the four GAD enabling laws."
            summary={`${laws.length} laws`}
            metaDescription="The full text of RA 7877, RA 9262, RA 9710 and RA 11313, the gender and development enabling laws."
        >
            <div className="public-container resource-rows">
                <ul className="resource-list">
                    {laws.map((law) => {
                        const terms = termCounts.get(law.slug) ?? 0;

                        return (
                            <DocumentRow
                                key={law.slug}
                                id={law.slug}
                                art={law.image}
                                label={law.number}
                                title={law.listName}
                                facts={[
                                    law.shortTitle,
                                    <DatedFact
                                        label="Approved"
                                        date={law.approved}
                                    />,
                                ]}
                                actions={
                                    <>
                                        <DocumentButton
                                            href={law.document}
                                            label="Read the Act"
                                            name={law.number}
                                            bytes={law.documentBytes}
                                        />
                                        {law.brochure && (
                                            <a
                                                className="resource-row-secondary"
                                                href={law.brochure.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Information brochure
                                                <span className="sr-only">
                                                    {` for ${law.number} (PDF, ${formatFileSize(law.brochure.bytes)}, opens in a new tab)`}
                                                </span>
                                                <ArrowUpRight aria-hidden="true" />
                                            </a>
                                        )}
                                    </>
                                }
                            >
                                {terms > 0 && (
                                    <Link
                                        className="resource-row-link"
                                        href={`/resources/definition-of-terms#${law.slug}`}
                                    >
                                        {terms} terms in Definition of Terms
                                        <ArrowRight aria-hidden="true" />
                                    </Link>
                                )}
                            </DocumentRow>
                        );
                    })}
                </ul>
            </div>
        </ResourcePage>
    );
}
