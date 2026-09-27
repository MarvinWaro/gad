import { NotebookTabs } from 'lucide-react';
import {
    DatedFact,
    DocumentRow,
    RelatedLaws,
} from '@/components/resources/document-row';
import {
    DocumentButton,
    ResourcePage,
} from '@/components/resources/resource-page';
import { manuals } from '@/data/manuals';
import '../../../css/public.css';

export default function Manuals() {
    return (
        <ResourcePage
            title="Manuals"
            description="GAD assessment tools from the Philippine Commission on Women."
            summary={`${manuals.length} manuals`}
            metaDescription="The Enhanced GMEF of CHED 2020 and the GAD Capacity Assessment Form, gender and development assessment tools from the Philippine Commission on Women."
        >
            <div className="public-container resource-rows">
                <ul className="resource-list">
                    {manuals.map((manual) => (
                        <DocumentRow
                            key={manual.slug}
                            id={manual.slug}
                            icon={NotebookTabs}
                            title={manual.title}
                            facts={[
                                ...manual.details,
                                ...(manual.administered
                                    ? [
                                          <DatedFact
                                              label="Administered"
                                              date={manual.administered}
                                          />,
                                      ]
                                    : []),
                            ]}
                            actions={
                                <DocumentButton
                                    href={manual.document}
                                    label="Read the manual"
                                    name={manual.title}
                                    bytes={manual.documentBytes}
                                />
                            }
                        >
                            <RelatedLaws slugs={manual.relatedLaws} />
                        </DocumentRow>
                    ))}
                </ul>
            </div>
        </ResourcePage>
    );
}
