import { useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Check, Lock, Send } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';
import { ScaleQuestion } from '@/components/feedback/scale-question';
import { TypeTiles } from '@/components/feedback/type-tiles';
import { HeiCombobox } from '@/components/hei-combobox';
import { ErrorSummary } from '@/components/survey/error-summary';
import { Field, PublicSelect } from '@/components/survey/fields';
import { Button } from '@/components/ui/button';
import {
    emptyAnswers,
    feedbackStepOf,
    feedbackSteps,
    firstStepIssues,
} from '@/lib/feedback';
import { store } from '@/routes/feedback';
import type {
    FeedbackAnswers,
    FeedbackHei,
    FeedbackQuestions,
    FeedbackTypeOption,
} from '@/types/feedback';
import type { DirectoryOption } from '@/types/monitoring';

const scaleOptions = [1, 2, 3, 4, 5].map((value) => ({
    value,
    label: String(value),
}));

/**
 * The website feedback form in short steps, like the old Google Form's
 * pages. Only the first step has required answers; the others can be
 * skipped with Continue. The server checks everything again on sending.
 */
export function FeedbackForm({
    questions,
    types,
    regions,
    heis,
    prefill,
    textMax,
}: {
    questions: FeedbackQuestions;
    types: FeedbackTypeOption[];
    regions: DirectoryOption[];
    heis: FeedbackHei[];
    prefill: { region_id: string; hei_id: string };
    textMax: number;
}) {
    const steps = feedbackSteps(questions);
    const last = steps.length;
    const [step, setStep] = useState(1);
    const [reached, setReached] = useState(1);
    const [attempted, setAttempted] = useState(false);
    const [stepError, setStepError] = useState('');
    const top = useRef<HTMLFormElement>(null);
    const heading = useRef<HTMLHeadingElement>(null);
    const errorSummary = useRef<HTMLDivElement>(null);
    const form = useForm<FeedbackAnswers>(emptyAnswers(questions, prefill));
    const regionHeis = heis.filter(
        (hei) => String(hei.region_id) === form.data.region_id,
    );

    // Nothing is marked wrong until the visitor has tried to continue; after
    // that it updates as they fix each one.
    const firstIssues = attempted ? firstStepIssues(form.data) : {};
    const errorFor = (key: string) =>
        firstIssues[key] ?? form.errors[key as keyof typeof form.errors];
    const summaryIssues = Object.entries({
        ...form.errors,
        ...(step === 1 ? firstIssues : {}),
    });

    function goTo(next: number) {
        setStep(next);
        setReached((value) => Math.max(value, next));
    }

    function show(next: number) {
        goTo(next);
        // The new step's heading takes focus, and the form comes into view.
        requestAnimationFrame(() => {
            heading.current?.focus({ preventScroll: true });
            const reduce = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;
            top.current?.scrollIntoView({
                block: 'start',
                behavior: reduce ? 'auto' : 'smooth',
            });
        });
    }

    function showStepError(message: string) {
        setStepError(message);
        requestAnimationFrame(() => errorSummary.current?.focus());
    }

    function next() {
        if (step === 1) {
            setAttempted(true);
            if (Object.keys(firstStepIssues(form.data)).length > 0) {
                showStepError('');
                return;
            }
        }
        setStepError('');
        show(Math.min(last, step + 1));
    }

    /** A step from the progress bar; past the first only once it is done. */
    function open(number: number) {
        if (number > 1 && Object.keys(firstStepIssues(form.data)).length > 0) {
            next();
            return;
        }
        setStepError('');
        show(number);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (step < last) {
            next();
            return;
        }
        if (form.processing) return;
        form.post(store.url(), {
            preserveScroll: true,
            onError: (errors) => {
                show(
                    Math.min(
                        ...Object.keys(errors).map((key) =>
                            feedbackStepOf(key, questions),
                        ),
                    ),
                );
                showStepError('Please correct the highlighted fields.');
            },
        });
    }

    const scale = step > 1 && step < last ? questions.scales[step - 2] : null;

    return (
        <form ref={top} onSubmit={submit} className="survey-form feedback-form">
            <nav className="survey-steps" aria-label="Feedback progress">
                {steps.map((label, index) => {
                    const number = index + 1;
                    const done = number < step;
                    // Steps already opened can be opened again.
                    const linked = number !== step && number <= reached;

                    return (
                        <div
                            key={label}
                            className={
                                number === step
                                    ? 'is-current'
                                    : done
                                      ? 'is-complete'
                                      : ''
                            }
                            aria-current={number === step ? 'step' : undefined}
                        >
                            <span aria-hidden={linked || undefined}>
                                {done ? <Check /> : number}
                            </span>
                            <p aria-hidden={linked || undefined}>{label}</p>
                            {linked && (
                                <button
                                    type="button"
                                    className="feedback-step-link"
                                    aria-label={`${label}, step ${number}${done ? ', done' : ''}`}
                                    onClick={() => open(number)}
                                />
                            )}
                        </div>
                    );
                })}
            </nav>

            <ErrorSummary
                ref={errorSummary}
                issues={summaryIssues}
                message={stepError}
                targetOf={(key) => key}
                // The summary's link then moves focus to the answer itself.
                onShow={(key) => goTo(feedbackStepOf(key, questions))}
                unsentMessage="Your feedback has not been sent."
            />

            <section
                key={step}
                className="survey-form-card feedback-step"
                aria-labelledby="feedback-step-title"
            >
                <div className="survey-card-heading">
                    <div>
                        <h2
                            id="feedback-step-title"
                            ref={heading}
                            tabIndex={-1}
                        >
                            <span className="sr-only">
                                Step {step} of {last}:{' '}
                            </span>
                            {steps[step - 1]}
                            {scale && (
                                <span className="feedback-optional">
                                    Optional
                                </span>
                            )}
                        </h2>
                        <p>
                            {step === 1
                                ? '* Indicates required question'
                                : scale
                                  ? scale.intro
                                  : 'Please provide us with your details (optional)'}
                        </p>
                    </div>
                </div>

                {step === 1 && (
                    <div className="survey-field-grid">
                        <TypeTiles
                            types={types}
                            value={form.data.type}
                            onChange={(value) => form.setData('type', value)}
                            error={errorFor('type')}
                        />
                        <Field
                            label="Feedback"
                            fieldId="feedback"
                            wide
                            error={errorFor('feedback')}
                            note={`${form.data.feedback.length.toLocaleString()} / ${textMax.toLocaleString()} characters`}
                        >
                            <textarea
                                className="survey-input feedback-textarea"
                                rows={5}
                                maxLength={textMax}
                                value={form.data.feedback}
                                onChange={(event) =>
                                    form.setData('feedback', event.target.value)
                                }
                            />
                        </Field>
                        <Field
                            label="Suggestions for improvement"
                            fieldId="suggestions"
                            wide
                            required={false}
                            error={errorFor('suggestions')}
                        >
                            <textarea
                                className="survey-input feedback-textarea"
                                rows={3}
                                maxLength={textMax}
                                value={form.data.suggestions}
                                onChange={(event) =>
                                    form.setData(
                                        'suggestions',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        {questions.choices.map((question) => (
                            <div
                                key={question.key}
                                className="survey-field-wide"
                            >
                                <ScaleQuestion
                                    id={question.key}
                                    label={question.label}
                                    optional
                                    options={question.options}
                                    value={form.data[question.key]}
                                    onChange={(value) =>
                                        form.setData(question.key, value)
                                    }
                                    error={errorFor(question.key)}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {scale && (
                    <div className="feedback-questions">
                        {scale.items.map((item) => (
                            <ScaleQuestion
                                key={item.key}
                                id={item.key}
                                label={item.label}
                                options={scaleOptions}
                                low={scale.low}
                                high={scale.high}
                                value={form.data[item.key]}
                                onChange={(value) =>
                                    form.setData(item.key, value)
                                }
                                error={errorFor(item.key)}
                            />
                        ))}
                    </div>
                )}

                {step === last && (
                    <>
                        <div className="survey-field-grid">
                            <Field
                                label="Email"
                                fieldId="email"
                                required={false}
                                error={errorFor('email')}
                            >
                                <input
                                    className="survey-input"
                                    type="email"
                                    autoComplete="email"
                                    maxLength={255}
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Name"
                                fieldId="name"
                                required={false}
                                error={errorFor('name')}
                            >
                                <input
                                    className="survey-input"
                                    autoComplete="name"
                                    maxLength={160}
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                />
                            </Field>
                            <Field
                                label="Region"
                                fieldId="region_id"
                                required={false}
                                error={errorFor('region_id')}
                            >
                                <PublicSelect
                                    value={form.data.region_id}
                                    onChange={(value) =>
                                        // Another region lists other institutions.
                                        form.setData((data) => ({
                                            ...data,
                                            region_id: value,
                                            hei_id: '',
                                        }))
                                    }
                                    placeholder="Select region"
                                    options={regions.map((region) => ({
                                        value: String(region.id),
                                        label: region.name,
                                    }))}
                                />
                            </Field>
                            <Field
                                label="Higher education institution"
                                fieldId="hei_id"
                                required={false}
                                error={errorFor('hei_id')}
                            >
                                <HeiCombobox
                                    className="survey-input"
                                    contentClassName="public-theme"
                                    value={form.data.hei_id}
                                    onChange={(value) =>
                                        form.setData('hei_id', value)
                                    }
                                    options={regionHeis}
                                    disabled={
                                        form.data.region_id === '' ||
                                        regionHeis.length === 0
                                    }
                                    placeholder={
                                        form.data.region_id === ''
                                            ? 'Choose a region first'
                                            : regionHeis.length === 0
                                              ? 'No institutions listed yet'
                                              : 'Search or select an institution'
                                    }
                                    allowClear
                                />
                            </Field>
                        </div>
                        <p className="feedback-privacy">
                            <Lock aria-hidden="true" />
                            Only CHED staff who manage feedback can see these
                            details.
                        </p>
                    </>
                )}

                {/* Left empty by people; bots that fill it are ignored. */}
                <input
                    type="text"
                    name="website"
                    className="rate-honeypot"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={form.data.website}
                    onChange={(event) =>
                        form.setData('website', event.target.value)
                    }
                />
            </section>

            <div className="survey-form-actions">
                {step > 1 ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            setStepError('');
                            show(step - 1);
                        }}
                    >
                        <ArrowLeft />
                        Back
                    </Button>
                ) : (
                    <span />
                )}
                {step < last ? (
                    <Button key="continue" type="button" onClick={next}>
                        Continue
                        <ArrowRight />
                    </Button>
                ) : (
                    <Button key="send" type="submit" disabled={form.processing}>
                        {form.processing ? 'Sending…' : 'Send feedback'}
                        <Send />
                    </Button>
                )}
            </div>
        </form>
    );
}
