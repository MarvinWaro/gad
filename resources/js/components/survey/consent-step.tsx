import { ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import { CheckField } from '@/components/survey/fields';
import type {
    PublishedSurvey,
    SurveyAnswersForm,
} from '@/components/survey/types';

/** Step 1: how the response is handled, and the respondent's consent. */
export function ConsentStep({
    survey,
    form,
}: {
    survey: PublishedSurvey;
    form: SurveyAnswersForm;
}) {
    return (
        <section className="survey-form-card">
            <div className="survey-card-heading">
                <ShieldCheck />
                <div>
                    <h2>Privacy and consent</h2>
                    <p>
                        Please review how your anonymous response will be
                        handled.
                    </p>
                </div>
            </div>
            <div className="survey-privacy-copy">
                <p>{survey.privacy_notice}</p>
                <p>
                    Individual responses are retained for{' '}
                    {retentionPeriod(survey.retention_days)}, then automatically
                    deleted.
                </p>
                {/* Always true, whatever the survey's own notice says. */}
                <p>
                    Email is optional. If you give one, only authorised CHED
                    staff can see it, and it is deleted with your response.
                </p>
            </div>
            <CheckField
                id="consent"
                checked={form.data.consent}
                onChange={(checked) => form.setData('consent', checked)}
                label={survey.consent_text}
            />
            <InputError message={form.errors.consent} />
        </section>
    );
}

/** A retention period as people say it: 1825 days reads "5 years". */
function retentionPeriod(days: number): string {
    if (days >= 365 && days % 365 === 0) {
        const years = days / 365;

        return `${years} ${years === 1 ? 'year' : 'years'}`;
    }

    return `${days} ${days === 1 ? 'day' : 'days'}`;
}
