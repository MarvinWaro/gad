import InputError from '@/components/input-error';
import {
    CheckField,
    Field,
    PublicSelect,
    RadioField,
} from '@/components/survey/fields';
import { GroupFollowUps } from '@/components/survey/group-follow-ups';
import {
    isLocked,
    type Questionnaire,
    type Respondent,
} from '@/components/survey/questionnaire';
import type {
    Directories,
    Issues,
    SurveyAnswersForm,
} from '@/components/survey/types';

/**
 * Step 2: who is answering, and where they study or work. Each follow-up
 * appears under the answer that asks for it.
 */
export function RespondentStep({
    form,
    questionnaire,
    respondent,
    directories,
    issues,
}: {
    form: SurveyAnswersForm;
    questionnaire: Questionnaire;
    respondent: Respondent;
    directories: Directories;
    /** What the step check found, shown until the answer is fixed. */
    issues: Issues;
}) {
    const { answeringFor, sex, respondentGroups } = questionnaire;
    const {
        forMinor,
        whom,
        ageMin,
        ageMax,
        genderIdentities,
        groupFollowUps,
        groupRequiresText,
        clusters,
        heis,
        isRequired,
        detailLabel,
    } = respondent;
    const fieldError = (id: string, serverError?: string) =>
        issues[id] ?? serverError;

    return (
        <section className="survey-form-card">
            <div className="survey-card-heading">
                <div>
                    <h2>{forMinor ? 'Minor details' : 'Respondent details'}</h2>
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
                        onChange={(e) => form.setData('age', e.target.value)}
                    />
                </Field>
                <Field
                    label={detailLabel('Sex')}
                    fieldId="sex"
                    error={fieldError('sex', form.errors.sex)}
                    required={isRequired('sex')}
                    note={
                        isLocked(questionnaire, 'sex')
                            ? 'This survey covers one group, so this answer is already set.'
                            : undefined
                    }
                >
                    <PublicSelect
                        value={form.data.sex}
                        onChange={(value) =>
                            // Each sex has its own identity choices.
                            form.setData((data) => ({
                                ...data,
                                sex: value,
                                gender_identity: '',
                            }))
                        }
                        placeholder="Select sex"
                        options={sex?.options ?? []}
                        disabled={isLocked(questionnaire, 'sex')}
                    />
                </Field>
                {genderIdentities.length > 0 && (
                    <div className="survey-field-wide survey-conditional">
                        <RadioField
                            label={detailLabel('Gender identity')}
                            hint={`Choose the option that best describes ${whom}.`}
                            fieldId="gender_identity"
                            options={genderIdentities}
                            value={form.data.gender_identity}
                            onChange={(value) =>
                                form.setData('gender_identity', value)
                            }
                            required={isRequired('sex')}
                            error={fieldError(
                                'gender_identity',
                                form.errors.gender_identity,
                            )}
                        />
                    </div>
                )}
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
                            // Another group asks other questions.
                            form.setData((data) => ({
                                ...data,
                                respondent_group: value,
                                group_answers: {},
                                group_answer_details: {},
                            }))
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
                {groupFollowUps.length > 0 && (
                    <GroupFollowUps
                        questions={groupFollowUps}
                        answers={form.data.group_answers}
                        details={form.data.group_answer_details}
                        onAnswer={(key, value) =>
                            form.setData('group_answers', {
                                ...form.data.group_answers,
                                [key]: value,
                            })
                        }
                        onDetail={(key, text) =>
                            form.setData('group_answer_details', {
                                ...form.data.group_answer_details,
                                [key]: text,
                            })
                        }
                        errorFor={(key) =>
                            fieldError(
                                key,
                                form.errors[key as keyof typeof form.errors],
                            )
                        }
                        forMinor={forMinor}
                    />
                )}
                <Field
                    label={detailLabel('Region')}
                    fieldId="region_id"
                    error={fieldError('region_id', form.errors.region_id)}
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
                    error={fieldError('cluster_id', form.errors.cluster_id)}
                    required={isRequired('cluster')}
                    note={
                        form.data.region_id && clusters.length === 0 ? (
                            <>
                                No clusters are listed for this region yet.
                                Please choose another region, or email{' '}
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
                        disabled={!form.data.region_id || clusters.length === 0}
                    />
                </Field>
                <Field
                    label={detailLabel('Name of HEI')}
                    fieldId="hei_id"
                    error={fieldError('hei_id', form.errors.hei_id)}
                    note={
                        form.data.cluster_id && heis.length === 0 ? (
                            <>
                                No institutions are listed for this cluster yet.
                                Please choose another cluster, or email{' '}
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
                        onChange={(value) => form.setData('hei_id', value)}
                        placeholder={
                            form.data.cluster_id && heis.length === 0
                                ? 'No institutions available'
                                : 'Select HEI'
                        }
                        options={heis.map((item) => ({
                            value: String(item.id),
                            label: item.name,
                        }))}
                        disabled={!form.data.cluster_id || heis.length === 0}
                    />
                </Field>
            </div>
            {(forMinor ||
                (Number(form.data.age) > 0 && Number(form.data.age) < 18)) && (
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
    );
}
