import { FileText } from 'lucide-react';
import {
    DatedFact,
    DocumentRow,
    RelatedLaws,
} from '@/components/resources/document-row';
import {
    DocumentButton,
    ResourcePage,
} from '@/components/resources/resource-page';
import { issuances } from '@/data/issuances';
import '../../../css/public.css';

export default function Issuances() {
    return (
        <ResourcePage
            title="Issuances"
            description="CHED memorandum orders on gender and development in higher education."
            summary={`${issuances.length} issuances`}
            metaDescription="CHED Memorandum Order No. 01, s. 2015 and No. 3, s. 2022 on gender and development and gender-based sexual harassment in higher education institutions."
        >
            <div className="public-container resource-rows">
                <ul className="resource-list">
                    {issuances.map((issuance) => (
                        <DocumentRow
                            key={issuance.slug}
                            id={issuance.slug}
                            icon={FileText}
                            label={issuance.number}
                            title={issuance.title}
                            facts={
                                issuance.issued
                                    ? [
                                          <DatedFact
                                              label="Issued"
                                              date={issuance.issued}
                                          />,
                                      ]
                                    : []
                            }
                            actions={
                                <DocumentButton
                                    href={issuance.document}
                                    label="Read the CMO"
                                    name={issuance.number}
                                    bytes={issuance.documentBytes}
                                />
                            }
                        >
                            <RelatedLaws slugs={issuance.relatedLaws} />
                        </DocumentRow>
                    ))}
                </ul>
            </div>
        </ResourcePage>
    );
}
