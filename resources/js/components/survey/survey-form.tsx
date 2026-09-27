import { useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { ConsentStep } from '@/components/survey/consent-step';
import { ErrorSummary } from '@/components/survey/error-summary';
import { ExperiencesStep } from '@/components/survey/experiences-step';
import {
    describeRespondent,
    initialAnswers,
    readQuestionnaire,
} from '@/components/survey/questionnaire';
import { RespondentStep } from '@/components/survey/respondent-step';
import { ReviewStep } from '@/components/survey/review-step';
import type {
    Directories,
    PublishedSurvey,
    RespondentDetails,
    SurveyAnswers,
} from '@/components/survey/types';
import {
    detailErrors,
    experienceErrors,
    stepOf,
} from '@/components/survey/validation';
import { Button } from '@/components/ui/button';

const steps = ['Privacy & consent', 'About you', 'Experiences', 'Review'];

/**
 * A published questionnaire in four steps. Each step is checked before the
 * next opens, and the server checks everything again on submit.
 */
export function SurveyForm({
    survey,
    directories,
    respondentDetails,
}: {
    survey: PublishedSurvey;
    directories: Directories;
    respondentDetails: RespondentDetails;
}) {
    const [step, setStep] = useState(1);
    const [stepError, setStepError] = useState('');
    const [attempted, setAttempted] = useState<Record<number, boolean>>({});
    const errorSummary = useRef<HTMLDivElement>(null);
    const questionnaire = readQuestionnaire(survey, directories);
    const form = useForm<SurveyAnswers>(initialAnswers(survey, questionnaire));
    const respondent = describeRespondent(
        survey,
        questionnaire,
        form.data,
        directories,
        respondentDetails,
    );

    // Nothing is marked wrong until the respondent has tried to continue;
    // after that it updates as they fix each one.
    const detailIssues = attempted[2]
        ? detailErrors(form.data, questionnaire, respondent)
        : {};
    const experienceIssues = attempted[3]
        ? experienceErrors(form.data, questionnaire, respondent)
        : {};
    const visibleClientIssues =
        step === 2 ? detailIssues : step === 3 ? experienceIssues : {};
    const summaryIssues = Object.entries({
        ...form.errors,
        ...visibleClientIssues,
    });

    function showStepError(message: string) {
        setStepError(message);
        requestAnimationFrame(() => errorSummary.current?.focus());
    }

    function next() {
        if (step === 1 && !form.data.consent) {
            showStepError('Confirm your consent before continuing.');
            return;
        }
        if (step === 2) {
            setAttempted((value) => ({ ...value, 2: true }));
            if (
                Object.keys(detailErrors(form.data, questionnaire, respondent))
                    .length > 0
            ) {
                showStepError('');
                return;
            }
        }
        if (step === 3) {
            setAttempted((value) => ({ ...value, 3: true }));
            if (
                Object.keys(
                    experienceErrors(form.data, questionnaire, respondent),
                ).length > 0
            ) {
                showStepError('');
                return;
            }
        }
        setStepError('');
        setStep((value) => Math.min(4, value + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        if (step !== 4) {
            next();
            return;
        }
        if (form.processing) return;
        form.post(`/surveys/${survey.slug}/responses`, {
            preserveScroll: true,
            onError: (errors) => {
                // The experiences come first, then consent, then the rest.
                const errorSteps = Object.keys(errors).map(stepOf);
                setStep(
                    errorSteps.includes(3) ? 3 : errorSteps.includes(1) ? 1 : 2,
                );
                showStepError('Please correct the highlighted fields.');
            },
        });
    }

    return (
        <form onSubmit={submit} className="survey-form">
            <section
                className="survey-introduction compact"
                aria-labelledby="survey-title"
            >
                <div className="survey-introduction-copy">
                    <p className="section-label">
                        <span />
                        Know Your Rights
                    </p>
                    <h1 id="survey-title" tabIndex={-1}>
                        {survey.title}
                        <span>{survey.law_title}</span>
                    </h1>
                    <p>{survey.introduction}</p>
                </div>
                {survey.image_path && (
                    <img
                        src={survey.image_path}
                        width="285"
                        height="160"
                        alt={`${survey.code} awareness artwork`}
                    />
                )}
            </section>
            <nav className="survey-steps" aria-label="Survey progress">
                {steps.map((label, index) => (
                    <div
                        key={label}
                        className={
                            step === index + 1
                                ? 'is-current'
                                : step > index + 1
                                  ? 'is-complete'
                                  : ''
                        }
                    >
                        <span>{step > index + 1 ? <Check /> : index + 1}</span>
                        <p>{label}</p>
                    </div>
                ))}
            </nav>
            <ErrorSummary
                ref={errorSummary}
                issues={summaryIssues}
                message={stepError}
                questionnaire={questionnaire}
                onShowStep={setStep}
            />

            {step === 1 && <ConsentStep survey={survey} form={form} />}
            {step === 2 && (
                <RespondentStep
                    form={form}
                    questionnaire={questionnaire}
                    respondent={respondent}
                    directories={directories}
                    issues={detailIssues}
                />
            )}
            {step === 3 && (
                <ExperiencesStep
                    form={form}
                    questionnaire={questionnaire}
                    respondent={respondent}
                    issues={experienceIssues}
                />
            )}
            {step === 4 && (
                <ReviewStep
                    data={form.data}
                    questionnaire={questionnaire}
                    respondent={respondent}
                    directories={directories}
                />
            )}
            <div className="survey-form-actions">
                {step > 1 ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setStepError('');
                            setStep(step - 1);
                        }}
                    >
                        <ArrowLeft />
                        Previous
                    </Button>
                ) : (
                    <span />
                )}
                {step < 4 ? (
                    <Button key="continue" type="button" onClick={next}>
                        Continue
                        <ArrowRight />
                    </Button>
                ) : (
                    <Button
                        key="submit"
                        type="submit"
                        disabled={form.processing}
                    >
                        {form.processing
                            ? 'Submitting…'
                            : 'Submit anonymous response'}
                    </Button>
                )}
            </div>
        </form>
    );
}
