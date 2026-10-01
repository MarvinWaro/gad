import { Review } from '@/components/survey/fields';
import type {
    Questionnaire,
    Respondent,
} from '@/components/survey/questionnaire';
import type { Directories, SurveyAnswers } from '@/components/survey/types';
import { placeLine } from '@/lib/places';

/** Step 4: the answers as they will be submitted. */
export function ReviewStep({
    data,
    questionnaire,
    respondent,
    directories,
}: {
    data: SurveyAnswers;
    questionnaire: Questionnaire;
    respondent: Respondent;
    directories: Directories;
}) {
    const { answeringFor, sex, matrix, noneValue, respondentGroups } =
        questionnaire;
    const {
        forMinor,
        genderIdentities,
        groupFollowUps,
        groupRequiresText,
        clusters,
        detailLabel,
    } = respondent;

    return (
        <section className="survey-form-card">
            <div className="survey-card-heading">
                <div>
                    <h2>Review your response</h2>
                    <p>
                        Confirm these details before submitting. You cannot edit
                        the response after submission.
                    </p>
                </div>
            </div>
            <div className="survey-review">
                {answeringFor && (
                    <Review
                        label="Answering for"
                        value={
                            answeringFor.options?.find(
                                (option) => option.value === data.answering_for,
                            )?.label ?? ''
                        }
                    />
                )}
                {forMinor && (
                    <p>
                        These details and experiences belong to the minor under
                        your legal care.
                    </p>
                )}
                <Review label={detailLabel('Age')} value={data.age} />
                <Review
                    label={detailLabel('Sex')}
                    value={
                        sex?.options?.find((o) => o.value === data.sex)
                            ?.label ?? data.sex
                    }
                />
                {genderIdentities.length > 0 && (
                    <Review
                        label={detailLabel('Gender identity')}
                        value={
                            genderIdentities.find(
                                (o) => o.value === data.gender_identity,
                            )?.label ?? ''
                        }
                    />
                )}
                <Review
                    label={detailLabel('Respondent group')}
                    value={
                        groupRequiresText
                            ? data.respondent_group_other
                            : (respondentGroups.find(
                                  (o) => o.value === data.respondent_group,
                              )?.label ?? '')
                    }
                />
                {groupFollowUps.map((question) => {
                    const chosen = question.options.find(
                        (option) =>
                            option.value === data.group_answers[question.key],
                    );
                    const text = chosen?.requires_text
                        ? data.group_answer_details[question.key]?.trim()
                        : '';

                    return (
                        <Review
                            key={question.key}
                            label={question.label}
                            value={
                                chosen
                                    ? text
                                        ? `${chosen.label}: ${text}`
                                        : chosen.label
                                    : ''
                            }
                        />
                    );
                })}
                <Review
                    label="Institution"
                    value={[
                        directories.heis.find(
                            (i) => String(i.id) === data.hei_id,
                        )?.name,
                        // The holding cluster is not a place.
                        placeLine(
                            clusters.find(
                                (i) => String(i.id) === data.cluster_id,
                            )?.name,
                        ),
                    ]
                        .filter(Boolean)
                        .join(', ')}
                />
                <Review
                    label="Experiences"
                    value={data.experiences
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
    );
}
