import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock3 } from 'lucide-react';
import { SiteFooter, SiteHeader } from '@/components/public/site-layout';
import { SurveyForm } from '@/components/survey/survey-form';
import type {
    Directories,
    PublishedSurvey,
    RespondentDetails,
} from '@/components/survey/types';
import { Button } from '@/components/ui/button';
import { laws } from '@/data/phlgadis-demo';
import '../../../css/public.css';

export default function SurveyShow({
    lawSlug,
    survey,
    directories,
    respondentDetails,
    confirmation,
}: {
    lawSlug: string;
    survey: PublishedSurvey | null;
    directories: Directories;
    respondentDetails: RespondentDetails;
    confirmation: string | null;
}) {
    const { auth } = usePage().props;
    const law = laws.find(({ slug }) => slug === lawSlug) ?? laws[0];
    return (
        <div className="public-theme dot-backdrop">
            <Head>
                <title>{`PHLGADIS | ${law.number} Survey`}</title>
                <meta
                    name="description"
                    content={`${law.number} survey information for ${law.title}.`}
                />
            </Head>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <SiteHeader authenticated={Boolean(auth.user)} homeUrl="/" />
            <main id="main" className="survey-page-main">
                <div className="public-container survey-page">
                    <Link className="survey-back-link" href="/#rights">
                        <ArrowLeft aria-hidden="true" />
                        Back to Know Your Rights
                    </Link>
                    {confirmation ? (
                        <Confirmation reference={confirmation} />
                    ) : survey ? (
                        <SurveyForm
                            survey={survey}
                            directories={directories}
                            respondentDetails={respondentDetails}
                        />
                    ) : (
                        <Unavailable law={law} />
                    )}
                </div>
            </main>
            <SiteFooter homeUrl="/" />
        </div>
    );
}

function Unavailable({ law }: { law: (typeof laws)[number] }) {
    return (
        <>
            <section
                className="survey-introduction"
                aria-labelledby="survey-title"
            >
                <div className="survey-introduction-copy">
                    <p className="section-label">
                        <span />
                        Know Your Rights
                    </p>
                    <h1 id="survey-title">
                        {law.number} Survey<span>{law.title}</span>
                    </h1>
                    <p>
                        This survey is being prepared. No information can be
                        entered, collected, or submitted yet.
                    </p>
                </div>
                <img
                    src={law.image.src}
                    width="285"
                    height="160"
                    alt={law.image.alt}
                />
            </section>
            <section className="notice-panel survey-coming-soon">
                <Clock3 aria-hidden="true" />
                <div>
                    <h2>Survey questionnaire coming next</h2>
                    <p>
                        The approved questionnaire and institutional directories
                        must be published before participation opens.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/#rights">View the other surveys</Link>
                </Button>
            </section>
        </>
    );
}

function Confirmation({ reference }: { reference: string }) {
    return (
        <section
            className="survey-confirmation"
            aria-labelledby="confirmation-title"
        >
            <span className="survey-confirmation-icon">
                <CheckCircle2 />
            </span>
            <p className="section-label">
                <span />
                Response received
            </p>
            <h1 id="confirmation-title">
                Thank you for sharing your experience.
            </h1>
            <p>
                Your anonymous response has been recorded. Keep this private
                reference if you need to ask CHEDRO XII about accessing or
                deleting the response.
            </p>
            <code>{reference}</code>
            <p className="survey-confirmation-note">
                No name, IP address, or browser details were stored with your
                response. If you gave an email, only authorised CHED staff can
                see it.
            </p>
            <Button asChild>
                <Link href="/">Return home</Link>
            </Button>
        </section>
    );
}
