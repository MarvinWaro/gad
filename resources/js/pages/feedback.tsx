import { Link } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { FeedbackForm } from '@/components/feedback/feedback-form';
import { PublicPage } from '@/components/public/public-page';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import { create } from '@/routes/feedback';
import type {
    FeedbackHei,
    FeedbackQuestions,
    FeedbackTypeOption,
} from '@/types/feedback';
import type { DirectoryOption } from '@/types/monitoring';
import '../../css/public.css';

/**
 * Website feedback (/feedback): the old system's "We value your feedback"
 * Google Form, now a page of PHLGADIS so the answers reach its staff.
 */
export default function Feedback({
    questions,
    types,
    regions,
    region,
    heis,
    prefill,
    textMax,
    sent,
}: {
    questions: FeedbackQuestions;
    types: FeedbackTypeOption[];
    regions: DirectoryOption[];
    /** The region whose institutions `heis` holds. */
    region: number | null;
    heis: FeedbackHei[];
    prefill: { region_id: string; hei_id: string };
    textMax: number;
    sent: boolean;
}) {
    return (
        <PublicPage
            title="Share your feedback"
            eyebrow="We value your feedback"
            back={{ href: home.url(), label: 'Back to home' }}
            description="We would love to hear your thoughts or feedback on how we can improve your experience!"
            metaDescription="Tell the PHLGADIS team what works, what does not, and what you would like to see next."
        >
            <div className="public-container feedback-page">
                {sent ? (
                    <Thanks />
                ) : (
                    <FeedbackForm
                        questions={questions}
                        types={types}
                        regions={regions}
                        loadedRegionId={region}
                        heis={heis}
                        prefill={prefill}
                        textMax={textMax}
                    />
                )}
            </div>
        </PublicPage>
    );
}

function Thanks() {
    const heading = useRef<HTMLHeadingElement>(null);

    // The form the visitor sent from is gone; bring them to its answer.
    useEffect(() => {
        heading.current?.focus({ preventScroll: true });
        heading.current?.scrollIntoView({ block: 'center' });
    }, []);

    return (
        <section
            className="survey-confirmation"
            aria-labelledby="feedback-thanks-title"
        >
            <span className="survey-confirmation-icon">
                <CheckCircle2 />
            </span>
            <p className="section-label">
                <span />
                Feedback sent
            </p>
            <h2 id="feedback-thanks-title" ref={heading} tabIndex={-1}>
                Thank you for your feedback.
            </h2>
            <p>It has reached the PHLGADIS team.</p>
            <div className="feedback-thanks-actions">
                <Button asChild>
                    <Link href={home.url()}>Return home</Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href={create.url()}>Send more feedback</Link>
                </Button>
            </div>
        </section>
    );
}
