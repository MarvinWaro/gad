import { Field, textareaClass } from '@/components/survey-builder/field';
import { FormSection } from '@/components/survey-builder/form-section';
import type { DraftForm } from '@/components/survey-builder/types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** The title, notices, and retention rule respondents see before answering. */
export function SurveyDetailsSection({ form }: { form: DraftForm }) {
    return (
        <FormSection
            title="Survey details"
            description="The title, notices, and retention rule respondents see before they answer."
        >
            <Card>
                <CardContent className="space-y-6">
                    <Field
                        label="Survey title"
                        error={form.errors.title}
                        className="max-w-xl"
                    >
                        <Input
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="Law title"
                        error={form.errors.law_title}
                        className="max-w-xl"
                    >
                        <Input
                            value={form.data.law_title}
                            onChange={(event) =>
                                form.setData('law_title', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="Introduction"
                        hint="Explains why the survey exists, that no name is collected, and that giving an email is optional."
                        error={form.errors.introduction}
                    >
                        <textarea
                            className={cn('min-h-24', textareaClass)}
                            value={form.data.introduction}
                            onChange={(event) =>
                                form.setData('introduction', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="Privacy notice"
                        hint="Names every field collected, who can read it, and how to request deletion."
                        error={form.errors.privacy_notice}
                    >
                        <textarea
                            className={cn('min-h-32', textareaClass)}
                            value={form.data.privacy_notice}
                            onChange={(event) =>
                                form.setData(
                                    'privacy_notice',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    <Field
                        label="Consent text"
                        hint="The sentence a respondent ticks before submitting."
                        error={form.errors.consent_text}
                    >
                        <textarea
                            className={cn('min-h-24', textareaClass)}
                            value={form.data.consent_text}
                            onChange={(event) =>
                                form.setData('consent_text', event.target.value)
                            }
                        />
                    </Field>
                    <Field
                        label="Retention period (days)"
                        hint="Required before publishing. Responses are deleted automatically once this many days have passed. New surveys start at 1825 days, which is 5 years."
                        error={form.errors.retention_days}
                        className="max-w-xs"
                    >
                        <Input
                            type="number"
                            min={1}
                            max={3650}
                            placeholder="e.g. 1825 (5 years)"
                            value={form.data.retention_days ?? ''}
                            onChange={(event) =>
                                form.setData(
                                    'retention_days',
                                    event.target.value
                                        ? Number(event.target.value)
                                        : null,
                                )
                            }
                        />
                    </Field>
                </CardContent>
            </Card>
        </FormSection>
    );
}
