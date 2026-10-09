import { useEffect } from 'react';
import { ChevronDown, LifeBuoy, Mail, Phone } from 'lucide-react';
import { PublicPage } from '@/components/public/public-page';
import { Button } from '@/components/ui/button';
import { faqIntro, faqs, type FaqItem } from '@/data/faq';
import { useOperator } from '@/hooks/use-operator';
import { hashTarget } from '@/lib/hash-target';
import { home } from '@/routes';
import '../../../css/public.css';

// Opens the answer a link points at (/help/faq#{id}), and brings it into
// view when the page loads on one: the browser tries to scroll before the
// page has rendered, so it cannot find the answer by itself.
function openLinkedAnswer(scroll: boolean) {
    const target = hashTarget();
    if (!(target instanceof HTMLDetailsElement)) return;

    target.open = true;
    if (scroll) target.scrollIntoView({ block: 'start' });
}

export default function Faq() {
    useEffect(() => {
        openLinkedAnswer(true);
        const onHashChange = () => openLinkedAnswer(false);
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    return (
        <PublicPage
            title="Frequently Asked Questions"
            eyebrow="Need Help?"
            back={{ href: home.url(), label: 'Back to home' }}
            description="Answers to common questions about PHLGADIS."
            summary={`${faqs.length} questions`}
            metaDescription="Answers to frequently asked questions about PHLGADIS, the Philippine Higher Education Gender and Development Information System."
        >
            <div className="public-container faq">
                <FaqIntro />
                <div className="faq-list">
                    {faqs.map((item) => (
                        <FaqEntry key={item.id} item={item} />
                    ))}
                </div>
                <FaqContact />
            </div>
        </PublicPage>
    );
}

// What PHLGADIS is for, as the old FAQ page opened.
function FaqIntro() {
    return (
        <div className="faq-intro">
            <p className="faq-intro-lead">{faqIntro.purpose}</p>
            <div>
                <p className="faq-objectives-lead">{faqIntro.objectivesLead}</p>
                <ul className="faq-objectives">
                    {faqIntro.objectives.map((objective) => (
                        <li key={objective}>{objective}</li>
                    ))}
                </ul>
            </div>
            <p>{faqIntro.outcome}</p>
        </div>
    );
}

// Native disclosure: works without JavaScript, and find-in-page opens a
// closed answer that matches.
function FaqEntry({ item }: { item: FaqItem }) {
    const operator = useOperator();

    return (
        <details id={item.id} className="faq-item">
            <summary>
                <span>{item.question}</span>
                <ChevronDown aria-hidden="true" />
            </summary>
            <p className="faq-answer">
                {typeof item.answer === 'string'
                    ? item.answer
                    : item.answer(operator)}
            </p>
        </details>
    );
}

function FaqContact() {
    const operator = useOperator();

    return (
        <section className="notice-panel" aria-labelledby="faq-contact-title">
            <LifeBuoy aria-hidden="true" />
            <div>
                <h2 id="faq-contact-title">Still have questions?</h2>
                <p>{operator.name} can help.</p>
            </div>
            <div className="faq-contact-actions">
                <Button asChild variant="outline">
                    <a href={operator.hotlineHref}>
                        <Phone aria-hidden="true" />
                        {operator.hotline}
                    </a>
                </Button>
                <Button asChild variant="outline">
                    <a href={`mailto:${operator.email}`}>
                        <Mail aria-hidden="true" />
                        {operator.email}
                    </a>
                </Button>
            </div>
        </section>
    );
}
