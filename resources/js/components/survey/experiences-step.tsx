import InputError from '@/components/input-error';
import { CheckField, ChoiceChip } from '@/components/survey/fields';
import type {
    Questionnaire,
    Respondent,
} from '@/components/survey/questionnaire';
import type {
    Issues,
    Option,
    SurveyAnswersForm,
} from '@/components/survey/types';

/**
 * Step 3: the experiences matrix, each ticked experience asking who did it,
 * then any check-all-that-apply questions.
 */
export function ExperiencesStep({
    form,
    questionnaire,
    respondent,
    issues,
}: {
    form: SurveyAnswersForm;
    questionnaire: Questionnaire;
    respondent: Respondent;
    /** What the step check found, shown until the answer is fixed. */
    issues: Issues;
}) {
    const { matrix, matrixSection, noneValue, multiSelects } = questionnaire;
    const { forMinor, isRequired } = respondent;

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

    return (
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
                    ...(matrix?.none_option ? [matrix.none_option] : []),
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
                            {checked && experience.value !== noneValue && (
                                <Perpetrators
                                    experience={experience}
                                    options={questionnaire.perpetratorOptions}
                                    form={form}
                                    issues={issues}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
            <InputError
                message={issues.experiences ?? form.errors.experiences}
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
                    <div className="survey-chips">
                        {(question.options ?? []).map((option) => (
                            <ChoiceChip
                                key={option.value}
                                id={`selections.${question.id}.${option.value}`}
                                checked={(
                                    form.data.selections[question.id] ?? []
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
                            issues[`selections.${question.id}`] ??
                            form.errors[
                                `selections.${question.id}` as keyof typeof form.errors
                            ]
                        }
                    />
                </fieldset>
            ))}
        </section>
    );
}

/**
 * Under a ticked experience: who the perpetrators were, and the details a
 * choice such as "Other relative (Specify)" asks for.
 */
function Perpetrators({
    experience,
    options,
    form,
    issues,
}: {
    experience: Option;
    options: Option[];
    form: SurveyAnswersForm;
    issues: Issues;
}) {
    const chosen = form.data.perpetrators[experience.value] ?? [];
    const errorKey = `perpetrators.${experience.value}`;
    const detailsId = `other_relative_details.${experience.value}`;

    function toggle(value: string) {
        form.setData('perpetrators', {
            ...form.data.perpetrators,
            [experience.value]: chosen.includes(value)
                ? chosen.filter((item) => item !== value)
                : [...chosen, value],
        });
    }

    return (
        <fieldset className="survey-follow-up">
            <legend>Who were the perpetrators? Check all that apply.</legend>
            <div className="survey-chips">
                {options.map((option) => (
                    <ChoiceChip
                        key={option.value}
                        id={`${errorKey}.${option.value}`}
                        invalid={Boolean(issues[errorKey])}
                        checked={chosen.includes(option.value)}
                        onChange={() => toggle(option.value)}
                        label={option.label}
                    />
                ))}
            </div>
            <InputError
                message={
                    issues[errorKey] ??
                    form.errors[errorKey as keyof typeof form.errors]
                }
            />
            {options
                .filter(
                    (option) =>
                        option.requires_text && chosen.includes(option.value),
                )
                .map((option) => (
                    <div key={option.value} className="survey-follow-up-detail">
                        <label className="survey-label" htmlFor={detailsId}>
                            {specifyLabel(option.label)}
                        </label>
                        <input
                            className="survey-input"
                            id={detailsId}
                            value={
                                form.data.other_relative_details[
                                    experience.value
                                ] ?? ''
                            }
                            onChange={(e) =>
                                form.setData('other_relative_details', {
                                    ...form.data.other_relative_details,
                                    [experience.value]: e.target.value,
                                })
                            }
                        />
                        <InputError
                            message={
                                issues[detailsId] ??
                                form.errors[
                                    detailsId as keyof typeof form.errors
                                ]
                            }
                        />
                    </div>
                ))}
        </fieldset>
    );
}

/** "Other relative (Specify)" becomes "Specify the other relative". */
function specifyLabel(label: string): string {
    const name = label.replace(/\s*\(specify\)\s*$/i, '').toLowerCase();

    return `Specify the ${name}`;
}
