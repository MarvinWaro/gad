import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock3,
    ShieldCheck,
} from 'lucide-react';
import {
    cloneElement,
    FormEvent,
    isValidElement,
    type ReactElement,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import InputError from '@/components/input-error';
import { SiteFooter, SiteHeader } from '@/components/public/site-layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { laws } from '@/data/phlgadis-demo';
import '../../../css/public.css';

type Option = { value: string; label: string; requires_text?: boolean };
type Question = {
    id: string;
    type: string;
    label: string;
    required: boolean;
    min?: number;
    max?: number;
    /** Option value pre-selected when the form opens, for a single_select. */
    default?: string;
    /** Fix the answer to `default`: shown filled in and not editable. */
    locked?: boolean;
    options?: Option[];
    none_option?: Option;
    perpetrator_options?: Option[];
};
type Section = {
    id: string;
    title: string;
    description?: string;
    questions: Question[];
};
type PublishedSurvey = {
    id: number;
    slug: string;
    code: string;
    title: string;
    law_title: string;
    image_path: string | null;
    version_id: number;
    version: number;
    introduction: string;
    privacy_notice: string;
    consent_text: string;
    retention_days: number;
    definition: { sections: Section[] };
    required: Record<string, 'required' | 'sometimes'>;
};
type DirectoryItem = { id: number; name: string };
type Cluster = DirectoryItem & { survey_region_id: number };
type Hei = DirectoryItem & { survey_cluster_id: number };
type FormData = {
    version_id: number;
    answering_for: string;
    age: string;
    sex: string;
    respondent_group: string;
    respondent_group_other: string;
    region_id: string;
    cluster_id: string;
    hei_id: string;
    experiences: string[];
    /** Check-all-that-apply answers, keyed by the question's answer key. */
    selections: Record<string, string[]>;
    perpetrators: Record<string, string[]>;
    other_relative_details: Record<string, string>;
    consent: boolean;
    guardian_consent: boolean;
};

export default function SurveyShow({
    lawSlug,
    survey,
    directories,
    confirmation,
}: {
    lawSlug: string;
    survey: PublishedSurvey | null;
    directories: {
        regions: DirectoryItem[];
        clusters: Cluster[];
        heis: Hei[];
        respondent_groups: Option[];
    };
    confirmation: string | null;
}) {
    const { auth } = usePage().props;
    const law = laws.find(({ slug }) => slug === lawSlug) ?? laws[0];
    return (
        <div className="public-theme">
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
                        <SurveyForm survey={survey} directories={directories} />
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
            <section className="survey-coming-soon">
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
                No name, email address, IP address, or browser details were
                stored with your response.
            </p>
            <Button asChild>
                <Link href="/">Return home</Link>
            </Button>
        </section>
    );
}

function SurveyForm({
    survey,
    directories,
}: {
    survey: PublishedSurvey;
    directories: {
        regions: DirectoryItem[];
        clusters: Cluster[];
        heis: Hei[];
        respondent_groups: Option[];
    };
}) {
    const [step, setStep] = useState(1);
    const [stepError, setStepError] = useState('');
    const [attempted, setAttempted] = useState<Record<number, boolean>>({});
    const errorSummary = useRef<HTMLDivElement>(null);
    const questions = survey.definition.sections.flatMap(
        (section) => section.questions,
    );
    const sex = questions.find((q) => q.id === 'sex');
    const group = questions.find((q) => q.id === 'respondent_group');
    const matrix = questions.find((q) => q.type === 'experience_matrix');
    const matrixSection = survey.definition.sections.find((section) =>
        section.questions.some((q) => q === matrix),
    );
    const answeringFor = questions.find((q) => q.id === 'answering_for');
    const noneValue = matrix?.none_option?.value ?? 'none';
    const textPerpetrator = matrix?.perpetrator_options?.find(
        (option) => option.requires_text,
    );
    const ageQuestion = questions.find((q) => q.id === 'age');
    // Directory-backed from now on; a version published before the directory
    // existed keeps the options baked into its own questionnaire.
    const respondentGroups = directories.respondent_groups?.length
        ? directories.respondent_groups
        : (group?.options ?? []);
    // Check-all-that-apply questions sit alongside the matrix on the
    // experiences step, so the questionnaire can ask where something happened.
    const multiSelects = questions.filter(
        (question) => question.type === 'multi_select',
    );

    function toggleSelection(id: string, value: string, checked: boolean) {
        form.setData('selections', {
            ...form.data.selections,
            [id]: checked
                ? [...(form.data.selections[id] ?? []), value]
                : (form.data.selections[id] ?? []).filter(
                      (item) => item !== value,
                  ),
        });
    }
    /**
     * The option a questionnaire pre-selects for a choose-one question, used
     * for laws that address one group — RA 9710 opens with Female already
     * chosen. A default naming an option that no longer exists is ignored
     * rather than submitting a value the server would reject.
     */
    /**
     * A question whose answer the questionnaire fixes — RA 9710 covers women,
     * so its sex question is filled in and left uneditable. Only counts as
     * locked once the default resolves to a real choice, so a stale default
     * never leaves a respondent staring at a disabled empty control.
     */
    function isLocked(id: string): boolean {
        const question = questions.find((item) => item.id === id);

        return question?.locked === true && defaultAnswer(id) !== '';
    }

    function defaultAnswer(id: string): string {
        const question = questions.find((item) => item.id === id);
        const value = question?.default;

        return typeof value === 'string' &&
            question?.options?.some((option) => option.value === value)
            ? value
            : '';
    }
    const ageMin = ageQuestion?.min ?? 1;
    const form = useForm<FormData>({
        version_id: survey.version_id,
        answering_for: defaultAnswer('answering_for'),
        age: '',
        sex: defaultAnswer('sex'),
        respondent_group: defaultAnswer('respondent_group'),
        respondent_group_other: '',
        region_id: '',
        cluster_id: '',
        hei_id: '',
        experiences: [],
        selections: Object.fromEntries(
            questions
                .filter((question) => question.type === 'multi_select')
                .map((question) => [question.id, [] as string[]]),
        ),
        perpetrators: {},
        other_relative_details: {},
        consent: false,
        guardian_consent: false,
    });
    const forMinor =
        Boolean(answeringFor) &&
        form.data.answering_for === 'minor-under-legal-care';
    const ageMax = forMinor
        ? Math.min(17, ageQuestion?.max ?? 120)
        : (ageQuestion?.max ?? 120);
    const groupRequiresText = Boolean(
        respondentGroups.find(
            (option) => option.value === form.data.respondent_group,
        )?.requires_text,
    );
    const detailLabel = (label: string) =>
        forMinor ? `Minor's ${label.toLowerCase()}` : label;
    const clusters = useMemo(
        () =>
            directories.clusters.filter(
                (item) => String(item.survey_region_id) === form.data.region_id,
            ),
        [directories.clusters, form.data.region_id],
    );
    const heis = useMemo(
        () =>
            directories.heis.filter(
                (item) =>
                    String(item.survey_cluster_id) === form.data.cluster_id,
            ),
        [directories.heis, form.data.cluster_id],
    );
    const selectedExperiences = (matrix?.options ?? []).filter((item) =>
        form.data.experiences.includes(item.value),
    );
    // One source of truth for "must this be answered", so the asterisk, the
    // step check, and the server rule can never disagree.
    const isRequired = (id: string): boolean =>
        (id === 'age' && forMinor) ||
        (survey.required?.[id] ?? 'sometimes') === 'required';
    const steps = ['Privacy & consent', 'About you', 'Experiences', 'Review'];

    /**
     * Which answers on the respondent step are wrong, keyed by the id of the
     * control at fault, so the summary can link straight to it and the field
     * can show the same sentence beneath itself.
     */
    function detailErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        const age = form.data.age;
        if (
            answeringFor &&
            isRequired('answering_for') &&
            !form.data.answering_for
        ) {
            errors.answering_for = 'Choose who you are answering for.';
        }

        if (isRequired('age') && !age) {
            errors.age = 'Enter your age.';
        } else if (
            age !== '' &&
            (!Number.isInteger(Number(age)) ||
                Number(age) < ageMin ||
                Number(age) > ageMax)
        ) {
            errors.age = `Enter an age between ${ageMin} and ${ageMax}.`;
        }
        if (isRequired('sex') && !form.data.sex) {
            errors.sex = 'Choose an option for sex.';
        }
        if (isRequired('respondent_group') && !form.data.respondent_group) {
            errors.respondent_group = 'Choose the group you belong to.';
        }
        if (groupRequiresText && !form.data.respondent_group_other.trim()) {
            errors.respondent_group_other =
                'Tell us which group you belong to.';
        }
        if (isRequired('region') && !form.data.region_id) {
            errors.region_id = 'Choose your region.';
        } else if (form.data.cluster_id && !form.data.region_id) {
            errors.region_id = 'Choose the region this cluster belongs to.';
        }
        if (isRequired('cluster') && !form.data.cluster_id) {
            errors.cluster_id = 'Choose your cluster.';
        } else if (form.data.hei_id && !form.data.cluster_id) {
            errors.cluster_id =
                'Choose the cluster this institution belongs to.';
        }
        if (isRequired('hei') && !form.data.hei_id) {
            errors.hei_id = 'Choose your institution.';
        }
        if (age !== '' && Number(age) < 18 && !form.data.guardian_consent) {
            errors.guardian_consent =
                'Confirm a parent or guardian agrees before continuing.';
        }

        return errors;
    }

    // Nothing is marked wrong until the respondent has tried to continue;
    // after that it updates as they fix each one.
    const detailIssues = attempted[2] ? detailErrors() : {};
    const fieldError = (id: string, serverError?: string) =>
        detailIssues[id] ?? serverError;

    function experienceErrors(): Record<string, string> {
        const errors: Record<string, string> = {};
        for (const question of multiSelects) {
            if (
                isRequired(question.id) &&
                (form.data.selections[question.id] ?? []).length === 0
            ) {
                errors[`selections.${question.id}`] =
                    `Choose at least one option for ${question.label.replace(/\s*\*$/, '')}.`;
            }
        }
        if (!matrix) return errors;
        if (isRequired(matrix.id) && form.data.experiences.length === 0) {
            errors.experiences =
                'Choose an experience or select the none option.';
        }
        for (const item of selectedExperiences) {
            if (!form.data.perpetrators[item.value]?.length) {
                errors[`perpetrators.${item.value}`] =
                    `Choose at least one perpetrator for ${item.label}.`;
            } else if (
                textPerpetrator &&
                form.data.perpetrators[item.value]?.includes(
                    textPerpetrator.value,
                ) &&
                !form.data.other_relative_details[item.value]?.trim()
            ) {
                errors[`other_relative_details.${item.value}`] =
                    `Provide the requested details for ${item.label}.`;
            }
        }
        return errors;
    }
    const experienceIssues = attempted[3] ? experienceErrors() : {};
    const visibleClientIssues =
        step === 2 ? detailIssues : step === 3 ? experienceIssues : {};
    const summaryIssues = Object.entries({
        ...form.errors,
        ...visibleClientIssues,
    });
    function errorTarget(key: string): string {
        if (key === 'version_id') return 'survey-title';
        if (key === 'experiences' || key.startsWith('experiences.'))
            return `experiences.${matrix?.options?.[0]?.value ?? noneValue}`;
        if (key.startsWith('selections.')) return key;
        if (key.startsWith('perpetrators.'))
            return `${key.split('.').slice(0, 2).join('.')}.${matrix?.perpetrator_options?.[0]?.value ?? ''}`;
        return key;
    }

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
            if (Object.keys(detailErrors()).length > 0) {
                showStepError('');
                return;
            }
        }
        if (step === 3) {
            setAttempted((value) => ({ ...value, 3: true }));
            if (Object.keys(experienceErrors()).length > 0) {
                showStepError('');
                return;
            }
        }
        setStepError('');
        setStep((value) => Math.min(4, value + 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function toggleExperience(value: string) {
        if (value === noneValue) {
            form.setData(
                'experiences',
                form.data.experiences.includes(noneValue) ? [] : [noneValue],
            );
            return;
        }
        const current = form.data.experiences.filter(
            (item) => item !== noneValue,
        );
        form.setData(
            'experiences',
            current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
        );
    }
    function togglePerpetrator(experience: string, value: string) {
        const current = form.data.perpetrators[experience] ?? [];
        form.setData('perpetrators', {
            ...form.data.perpetrators,
            [experience]: current.includes(value)
                ? current.filter((item) => item !== value)
                : [...current, value],
        });
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
                const keys = Object.keys(errors);
                const targetStep = keys.some(
                    (key) =>
                        key.startsWith('experiences') ||
                        key.startsWith('perpetrators') ||
                        key.startsWith('other_relative_details'),
                )
                    ? 3
                    : keys.some((key) => key === 'consent')
                      ? 1
                      : 2;
                setStep(targetStep);
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
            {(stepError ||
                summaryIssues.length > 0 ||
                Object.keys(form.errors).length > 0) && (
                <div
                    ref={errorSummary}
                    className="survey-error-summary"
                    role="alert"
                    tabIndex={-1}
                >
                    <strong>
                        {summaryIssues.length > 0
                            ? `There ${summaryIssues.length === 1 ? 'is 1 thing' : `are ${summaryIssues.length} things`} to fix before you continue.`
                            : 'Please review the highlighted fields.'}
                    </strong>
                    {summaryIssues.length > 0 ? (
                        <ul className="survey-error-list">
                            {summaryIssues.map(([id, message]) => (
                                <li key={id}>
                                    <a
                                        href={`#${errorTarget(id)}`}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            if (id !== 'version_id') {
                                                setStep(
                                                    id === 'consent'
                                                        ? 1
                                                        : /^(experiences|perpetrators|other_relative_details)/.test(
                                                                id,
                                                            )
                                                          ? 3
                                                          : 2,
                                                );
                                            }
                                            requestAnimationFrame(() => {
                                                const field =
                                                    document.getElementById(
                                                        errorTarget(id),
                                                    );
                                                field?.scrollIntoView({
                                                    block: 'center',
                                                    behavior: 'smooth',
                                                });
                                                field?.focus();
                                            });
                                        }}
                                    >
                                        {message}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>
                            {stepError ||
                                'Your response has not been submitted.'}
                        </p>
                    )}
                </div>
            )}

            {step === 1 && (
                <section className="survey-form-card">
                    <div className="survey-card-heading">
                        <ShieldCheck />
                        <div>
                            <h2>Privacy and consent</h2>
                            <p>
                                Please review how your anonymous response will
                                be handled.
                            </p>
                        </div>
                    </div>
                    <div className="survey-privacy-copy">
                        <p>{survey.privacy_notice}</p>
                        <p>
                            Individual responses are retained for{' '}
                            {survey.retention_days} days, then automatically
                            deleted.
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
            )}

            {step === 2 && (
                <section className="survey-form-card">
                    <div className="survey-card-heading">
                        <div>
                            <h2>
                                {forMinor
                                    ? 'Minor details'
                                    : 'Respondent details'}
                            </h2>
                            <p>
                                {forMinor
                                    ? "Provide the minor's age, sex, respondent group, and institution. No name or email is collected."
                                    : 'No name or email is collected.'}
                            </p>
                        </div>
                    </div>
                    <div className="survey-field-grid">
                        {answeringFor && (
                            <Field
                                label={answeringFor.label}
                                fieldId="answering_for"
                                wide
                                required={isRequired('answering_for')}
                                error={fieldError(
                                    'answering_for',
                                    form.errors.answering_for,
                                )}
                            >
                                <PublicSelect
                                    value={form.data.answering_for}
                                    onChange={(value) =>
                                        form.setData((data) => ({
                                            ...data,
                                            answering_for: value,
                                            guardian_consent: false,
                                        }))
                                    }
                                    placeholder="Select who you are answering for"
                                    options={answeringFor.options ?? []}
                                />
                            </Field>
                        )}
                        <Field
                            label={detailLabel('Age')}
                            fieldId="age"
                            error={fieldError('age', form.errors.age)}
                            required={isRequired('age')}
                        >
                            <input
                                className="survey-input"
                                type="number"
                                min={ageMin}
                                max={ageMax}
                                value={form.data.age}
                                onChange={(e) =>
                                    form.setData('age', e.target.value)
                                }
                            />
                        </Field>
                        <Field
                            label={detailLabel('Sex')}
                            fieldId="sex"
                            error={fieldError('sex', form.errors.sex)}
                            required={isRequired('sex')}
                            note={
                                isLocked('sex')
                                    ? 'This survey covers one group, so this answer is already set.'
                                    : undefined
                            }
                        >
                            <PublicSelect
                                value={form.data.sex}
                                onChange={(value) => form.setData('sex', value)}
                                placeholder="Select sex"
                                options={sex?.options ?? []}
                                disabled={isLocked('sex')}
                            />
                        </Field>
                        <Field
                            label={detailLabel('Respondent group')}
                            fieldId="respondent_group"
                            error={fieldError(
                                'respondent_group',
                                form.errors.respondent_group,
                            )}
                            required={isRequired('respondent_group')}
                        >
                            <PublicSelect
                                value={form.data.respondent_group}
                                onChange={(value) =>
                                    form.setData('respondent_group', value)
                                }
                                placeholder="Select respondent group"
                                options={respondentGroups}
                            />
                        </Field>
                        {groupRequiresText && (
                            <Field
                                label="Please specify"
                                fieldId="respondent_group_other"
                                error={fieldError(
                                    'respondent_group_other',
                                    form.errors.respondent_group_other,
                                )}
                            >
                                <input
                                    className="survey-input"
                                    value={form.data.respondent_group_other}
                                    onChange={(e) =>
                                        form.setData(
                                            'respondent_group_other',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        )}
                        <Field
                            label={detailLabel('Region')}
                            fieldId="region_id"
                            error={fieldError(
                                'region_id',
                                form.errors.region_id,
                            )}
                            required={isRequired('region')}
                        >
                            <PublicSelect
                                value={form.data.region_id}
                                onChange={(value) => {
                                    form.setData((data) => ({
                                        ...data,
                                        region_id: value,
                                        cluster_id: '',
                                        hei_id: '',
                                    }));
                                }}
                                placeholder="Select region"
                                options={directories.regions.map((item) => ({
                                    value: String(item.id),
                                    label: item.name,
                                }))}
                            />
                        </Field>
                        <Field
                            label={detailLabel('Cluster')}
                            fieldId="cluster_id"
                            error={fieldError(
                                'cluster_id',
                                form.errors.cluster_id,
                            )}
                            required={isRequired('cluster')}
                            note={
                                form.data.region_id && clusters.length === 0 ? (
                                    <>
                                        No clusters are listed for this region
                                        yet. Please choose another region, or
                                        email{' '}
                                        <a href="mailto:chedro12@ched.gov.ph">
                                            chedro12@ched.gov.ph
                                        </a>{' '}
                                        so yours can be added.
                                    </>
                                ) : undefined
                            }
                        >
                            <PublicSelect
                                value={form.data.cluster_id}
                                onChange={(value) =>
                                    form.setData((data) => ({
                                        ...data,
                                        cluster_id: value,
                                        hei_id: '',
                                    }))
                                }
                                placeholder={
                                    form.data.region_id && clusters.length === 0
                                        ? 'No clusters available'
                                        : 'Select cluster'
                                }
                                options={clusters.map((item) => ({
                                    value: String(item.id),
                                    label: item.name,
                                }))}
                                disabled={
                                    !form.data.region_id ||
                                    clusters.length === 0
                                }
                            />
                        </Field>
                        <Field
                            label={detailLabel('Name of HEI')}
                            fieldId="hei_id"
                            error={fieldError('hei_id', form.errors.hei_id)}
                            note={
                                form.data.cluster_id && heis.length === 0 ? (
                                    <>
                                        No institutions are listed for this
                                        cluster yet. Please choose another
                                        cluster, or email{' '}
                                        <a href="mailto:chedro12@ched.gov.ph">
                                            chedro12@ched.gov.ph
                                        </a>{' '}
                                        so yours can be added.
                                    </>
                                ) : undefined
                            }
                            required={isRequired('hei')}
                        >
                            <PublicSelect
                                value={form.data.hei_id}
                                onChange={(value) =>
                                    form.setData('hei_id', value)
                                }
                                placeholder={
                                    form.data.cluster_id && heis.length === 0
                                        ? 'No institutions available'
                                        : 'Select HEI'
                                }
                                options={heis.map((item) => ({
                                    value: String(item.id),
                                    label: item.name,
                                }))}
                                disabled={
                                    !form.data.cluster_id || heis.length === 0
                                }
                            />
                        </Field>
                    </div>
                    {(forMinor ||
                        (Number(form.data.age) > 0 &&
                            Number(form.data.age) < 18)) && (
                        <div className="survey-guardian">
                            <CheckField
                                invalid={Boolean(
                                    fieldError(
                                        'guardian_consent',
                                        form.errors.guardian_consent,
                                    ),
                                )}
                                checked={form.data.guardian_consent}
                                onChange={(checked) =>
                                    form.setData('guardian_consent', checked)
                                }
                                id="guardian_consent"
                                label={
                                    forMinor
                                        ? 'I confirm that this minor is under my legal care and I consent to their participation in this survey.'
                                        : 'I confirm that a parent or guardian has consented to my participation in this survey.'
                                }
                            />
                            <InputError
                                message={fieldError(
                                    'guardian_consent',
                                    form.errors.guardian_consent,
                                )}
                            />
                        </div>
                    )}
                </section>
            )}

            {step === 3 && (
                <section className="survey-form-card">
                    <div className="survey-card-heading">
                        <div>
                            <h2>
                                {matrixSection?.title ?? 'Experiences'}
                                {matrix && isRequired(matrix.id) ? (
                                    <span aria-hidden="true"> *</span>
                                ) : null}
                            </h2>
                            <p>
                                {forMinor
                                    ? "Answer about the minor's experiences. "
                                    : ''}
                                {matrixSection?.description ??
                                    'There are no experience questions in this questionnaire.'}
                            </p>
                        </div>
                    </div>
                    <div className="survey-experience-list">
                        {[
                            ...(matrix?.options ?? []),
                            ...(matrix?.none_option
                                ? [matrix.none_option]
                                : []),
                        ].map((experience) => {
                            const checked = form.data.experiences.includes(
                                experience.value,
                            );
                            return (
                                <div
                                    className={`survey-experience ${checked ? 'is-selected' : ''}`}
                                    key={experience.value}
                                >
                                    <CheckField
                                        checked={checked}
                                        onChange={() =>
                                            toggleExperience(experience.value)
                                        }
                                        id={`experiences.${experience.value}`}
                                        label={experience.label}
                                    />
                                    {checked &&
                                        experience.value !== noneValue && (
                                            <fieldset>
                                                <legend>
                                                    Who were the perpetrators?
                                                    Check all that apply.
                                                </legend>
                                                <div className="survey-perpetrators">
                                                    {(
                                                        matrix?.perpetrator_options ??
                                                        []
                                                    ).map((option) => (
                                                        <div key={option.value}>
                                                            <CheckField
                                                                invalid={Boolean(
                                                                    experienceIssues[
                                                                        `perpetrators.${experience.value}`
                                                                    ],
                                                                )}
                                                                checked={(
                                                                    form.data
                                                                        .perpetrators[
                                                                        experience
                                                                            .value
                                                                    ] ?? []
                                                                ).includes(
                                                                    option.value,
                                                                )}
                                                                onChange={() =>
                                                                    togglePerpetrator(
                                                                        experience.value,
                                                                        option.value,
                                                                    )
                                                                }
                                                                id={`perpetrators.${experience.value}.${option.value}`}
                                                                label={
                                                                    option.label
                                                                }
                                                            />
                                                            {option.requires_text &&
                                                                (
                                                                    form.data
                                                                        .perpetrators[
                                                                        experience
                                                                            .value
                                                                    ] ?? []
                                                                ).includes(
                                                                    option.value,
                                                                ) && (
                                                                    <>
                                                                        <input
                                                                            className="survey-input mt-2"
                                                                            id={`other_relative_details.${experience.value}`}
                                                                            aria-label={`Specify ${option.label} for ${experience.label}`}
                                                                            value={
                                                                                form
                                                                                    .data
                                                                                    .other_relative_details[
                                                                                    experience
                                                                                        .value
                                                                                ] ??
                                                                                ''
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                form.setData(
                                                                                    'other_relative_details',
                                                                                    {
                                                                                        ...form
                                                                                            .data
                                                                                            .other_relative_details,
                                                                                        [experience.value]:
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                        <InputError
                                                                            message={
                                                                                experienceIssues[
                                                                                    `other_relative_details.${experience.value}`
                                                                                ] ??
                                                                                form
                                                                                    .errors[
                                                                                    `other_relative_details.${experience.value}` as keyof typeof form.errors
                                                                                ]
                                                                            }
                                                                        />
                                                                    </>
                                                                )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <InputError
                                                    message={
                                                        experienceIssues[
                                                            `perpetrators.${experience.value}`
                                                        ] ??
                                                        form.errors[
                                                            `perpetrators.${experience.value}` as keyof typeof form.errors
                                                        ]
                                                    }
                                                />
                                            </fieldset>
                                        )}
                                </div>
                            );
                        })}
                    </div>
                    <InputError
                        message={
                            experienceIssues.experiences ??
                            form.errors.experiences
                        }
                    />
                    {multiSelects.map((question) => (
                        <fieldset
                            key={question.id}
                            className="survey-selection-group"
                            id={`selections.${question.id}`}
                        >
                            <legend>
                                {question.label}
                                {isRequired(question.id) ? (
                                    <span aria-hidden="true"> *</span>
                                ) : null}
                            </legend>
                            <p className="survey-selection-hint">
                                Check all that apply.
                            </p>
                            <div className="survey-selection-grid">
                                {(question.options ?? []).map((option) => (
                                    <CheckField
                                        key={option.value}
                                        checked={(
                                            form.data.selections[question.id] ??
                                            []
                                        ).includes(option.value)}
                                        onChange={(checked) =>
                                            toggleSelection(
                                                question.id,
                                                option.value,
                                                checked,
                                            )
                                        }
                                        label={option.label}
                                    />
                                ))}
                            </div>
                            <InputError
                                message={
                                    experienceIssues[
                                        `selections.${question.id}`
                                    ] ??
                                    form.errors[
                                        `selections.${question.id}` as keyof typeof form.errors
                                    ]
                                }
                            />
                        </fieldset>
                    ))}
                </section>
            )}

            {step === 4 && (
                <section className="survey-form-card">
                    <div className="survey-card-heading">
                        <div>
                            <h2>Review your response</h2>
                            <p>
                                Confirm these details before submitting. You
                                cannot edit the response after submission.
                            </p>
                        </div>
                    </div>
                    <div className="survey-review">
                        {answeringFor && (
                            <Review
                                label="Answering for"
                                value={
                                    answeringFor.options?.find(
                                        (option) =>
                                            option.value ===
                                            form.data.answering_for,
                                    )?.label ?? ''
                                }
                            />
                        )}
                        {forMinor && (
                            <p>
                                These details and experiences belong to the
                                minor under your legal care.
                            </p>
                        )}
                        <Review
                            label={detailLabel('Age')}
                            value={form.data.age}
                        />
                        <Review
                            label={detailLabel('Sex')}
                            value={
                                sex?.options?.find(
                                    (o) => o.value === form.data.sex,
                                )?.label ?? form.data.sex
                            }
                        />
                        <Review
                            label={detailLabel('Respondent group')}
                            value={
                                groupRequiresText
                                    ? form.data.respondent_group_other
                                    : (group?.options?.find(
                                          (o) =>
                                              o.value ===
                                              form.data.respondent_group,
                                      )?.label ?? '')
                            }
                        />
                        <Review
                            label="Institution"
                            value={`${directories.heis.find((i) => String(i.id) === form.data.hei_id)?.name ?? ''}, ${clusters.find((i) => String(i.id) === form.data.cluster_id)?.name ?? ''}`}
                        />
                        <Review
                            label="Experiences"
                            value={form.data.experiences
                                .map((value) =>
                                    value === noneValue
                                        ? matrix?.none_option?.label
                                        : matrix?.options?.find(
                                              (o) => o.value === value,
                                          )?.label,
                                )
                                .filter(Boolean)
                                .join('; ')}
                        />
                    </div>
                </section>
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

function Field({
    label,
    error,
    note,
    wide,
    required = true,
    fieldId,
    children,
}: {
    label: string;
    error?: string;
    note?: React.ReactNode;
    wide?: boolean;
    required?: boolean;
    fieldId?: string;
    children: React.ReactNode;
}) {
    const generatedId = useId();
    // A stable id lets the error summary link straight to the control.
    const id = fieldId ?? generatedId;
    const noteId = note ? `${id}-note` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
        [noteId, errorId].filter(Boolean).join(' ') || undefined;
    const control = isValidElement(children)
        ? cloneElement(
              children as ReactElement<{
                  id?: string;
                  'aria-describedby'?: string;
                  'aria-required'?: boolean;
                  'aria-invalid'?: boolean;
              }>,
              {
                  id,
                  'aria-describedby': describedBy,
                  'aria-required': required,
                  'aria-invalid': error ? true : undefined,
              },
          )
        : children;

    return (
        <div className={wide ? 'survey-field-wide' : ''}>
            <label className="survey-label" htmlFor={id}>
                {label}
                {required ? (
                    <span aria-hidden="true"> *</span>
                ) : (
                    <span className="survey-label-optional">Optional</span>
                )}
            </label>
            {control}
            {note && (
                <p id={noteId} className="survey-field-note">
                    {note}
                </p>
            )}
            <InputError id={errorId} message={error} />
        </div>
    );
}
function PublicSelect({
    value,
    onChange,
    placeholder,
    options,
    disabled = false,
    ...rest
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: Option[];
    disabled?: boolean;
} & Omit<
    React.ComponentProps<'select'>,
    'value' | 'onChange' | 'disabled' | 'children'
>) {
    return (
        <select
            className="survey-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            {...rest}
        >
            {/* A fixed answer cannot be cleared, so it needs no placeholder. */}
            {!(disabled && value) && <option value="">{placeholder}</option>}
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}
function CheckField({
    id: fieldId,
    invalid,
    checked,
    onChange,
    label,
}: {
    id?: string;
    invalid?: boolean;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}) {
    const generatedId = useId();
    const id = fieldId ?? generatedId;

    return (
        <label className="survey-check" htmlFor={id}>
            <Checkbox
                id={id}
                aria-invalid={invalid || undefined}
                checked={checked}
                onCheckedChange={(value) => onChange(value === true)}
            />
            <span>{label}</span>
        </label>
    );
}
function Review({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt>{label}</dt>
            <dd>{value || 'Not provided'}</dd>
        </div>
    );
}
