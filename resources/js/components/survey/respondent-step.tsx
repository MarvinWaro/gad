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
        sexualOrientations,
        groupFollowUps,
        groupRequiresText,
        heis,
        isRequired,
        detailLabel,
    } = respondent;
    const fieldError = (id: string, serverError?: string) =>
        issues[id] ?? serverError;
    // The chosen region's own office, for having an institution added.
    const regionEmail = directories.regions.find(
        (item) => String(item.id) === form.data.region_id,
    )?.email;

    return (
        <section className="survey-form-card">
            <div className="survey-card-heading">
                <div>
                    <h2>{forMinor ? 'Minor details' : 'Respondent details'}</h2>
                    <p>
                        {forMinor
                            ? "Provide the minor's age, sex, respondent group, and institution. No name is collected, and your email is optional."
                            : 'No name is collected, and your email is optional.'}
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
                                    // Not asked about a minor.
                                    sexual_orientation: '',
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
                    label={detailLabel('Sex assigned at birth')}
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
                        onChange={(value) => form.setData('sex', value)}
                        placeholder="Select sex"
                        options={sex?.options ?? []}
                        disabled={isLocked(questionnaire, 'sex')}
                    />
                </Field>
                {/* The same choices whatever the sex answer, Intersex
                    included: sex does not decide anyone's gender. */}
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
                {sexualOrientations.length > 0 && (
                    <div className="survey-field-wide survey-conditional">
                        <RadioField
                            label="Sexual orientation"
                            hint="Whom you are attracted to. This is separate from gender identity."
                            fieldId="sexual_orientation"
                            options={sexualOrientations}
                            value={form.data.sexual_orientation}
                            onChange={(value) =>
                                form.setData('sexual_orientation', value)
                            }
                            required={false}
                            error={fieldError(
                                'sexual_orientation',
                                form.errors.sexual_orientation,
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
                        onChange={(value) =>
                            // Another region lists other institutions.
                            form.setData((data) => ({
                                ...data,
                                region_id: value,
                                hei_id: '',
                            }))
                        }
                        placeholder="Select region"
                        options={directories.regions.map((item) => ({
                            value: String(item.id),
                            label: item.name,
                        }))}
                    />
                </Field>
                <Field
                    label={detailLabel('Name of HEI')}
                    fieldId="hei_id"
                    error={fieldError('hei_id', form.errors.hei_id)}
                    note={
                        form.data.region_id && heis.length === 0 ? (
                            <>
                                No institutions are listed for this region yet.
                                Please choose another region, or{' '}
                                {regionEmail ? (
                                    <>
                                        email{' '}
                                        <a href={`mailto:${regionEmail}`}>
                                            {regionEmail}
                                        </a>{' '}
                                        so yours can be added.
                                    </>
                                ) : (
                                    'contact your CHED regional office so yours can be added.'
                                )}
                            </>
                        ) : undefined
                    }
                    required={isRequired('hei')}
                >
                    <PublicSelect
                        value={form.data.hei_id}
                        onChange={(value) => form.setData('hei_id', value)}
                        placeholder={
                            form.data.region_id && heis.length === 0
                                ? 'No institutions available'
                                : 'Select HEI'
                        }
                        options={heis.map((item) => ({
                            value: String(item.id),
                            label: item.name,
                        }))}
                        disabled={heis.length === 0}
                    />
                </Field>
                <Field
                    label={
                        forMinor ? 'Your email (the person answering)' : 'Email'
                    }
                    fieldId="email"
                    error={fieldError('email', form.errors.email)}
                    note="Only authorised CHED staff can see it. Leave it blank if someone else can read your email."
                    required={false}
                >
                    <input
                        className="survey-input"
                        type="email"
                        autoComplete="email"
                        maxLength={255}
                        value={form.data.email}
                        onChange={(e) => form.setData('email', e.target.value)}
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
