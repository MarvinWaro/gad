import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { IconAction } from '@/components/icon-action';
import { OptionLines } from '@/components/option-lines';
import { typeLabel } from '@/components/survey-builder/definition';
import { Field, textareaClass } from '@/components/survey-builder/field';
import {
    readOnlyControlClass,
    useReadOnly,
} from '@/components/survey-builder/read-only';
import type { Question } from '@/components/survey-builder/types';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fromLines } from '@/lib/survey-options';
import { cn } from '@/lib/utils';

type ChangeQuestion = (mutate: (question: Question) => void) => void;

/** One question in a section: its type, wording, answer key, and choices. */
export function QuestionEditor({
    question,
    idPrefix,
    isFirst,
    isLast,
    onMove,
    onRemove,
    onChange,
}: {
    question: Question;
    /** Starts the ids of its checkboxes, e.g. question-0-2. */
    idPrefix: string;
    isFirst: boolean;
    isLast: boolean;
    onMove: (offset: -1 | 1) => void;
    onRemove: () => void;
    /** Edits a copy of this question, which then replaces it. */
    onChange: ChangeQuestion;
}) {
    const readOnly = useReadOnly();

    return (
        <div className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary">{typeLabel(question.type)}</Badge>
                <Label
                    htmlFor={`${idPrefix}-required`}
                    className={cn(
                        'inline-flex items-center gap-2 text-xs font-normal text-muted-foreground',
                        !readOnly && 'cursor-pointer',
                    )}
                >
                    <Checkbox
                        id={`${idPrefix}-required`}
                        checked={question.required}
                        disabled={readOnly}
                        className={cn(readOnly && readOnlyControlClass)}
                        onCheckedChange={(checked) =>
                            onChange((target) => {
                                target.required = checked === true;
                            })
                        }
                    />
                    Required
                </Label>
                {!readOnly && (
                    <div className="ml-auto flex items-center gap-1">
                        <IconAction
                            type="button"
                            label="Move question earlier"
                            disabled={isFirst}
                            onClick={() => onMove(-1)}
                        >
                            <ArrowUp />
                        </IconAction>
                        <IconAction
                            type="button"
                            label="Move question later"
                            disabled={isLast}
                            onClick={() => onMove(1)}
                        >
                            <ArrowDown />
                        </IconAction>
                        <IconAction
                            type="button"
                            label="Remove this question"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={onRemove}
                        >
                            <Trash2 />
                        </IconAction>
                    </div>
                )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Field label="Question label">
                    <Input
                        value={question.label}
                        onChange={(event) =>
                            onChange((target) => {
                                target.label = event.target.value;
                            })
                        }
                    />
                </Field>
                <Field
                    label="Answer key"
                    hint="Stored with every response. Letters, numbers, dashes."
                >
                    <Input
                        className="font-mono text-xs"
                        value={question.id}
                        onChange={(event) =>
                            onChange((target) => {
                                target.id = event.target.value;
                            })
                        }
                    />
                </Field>
            </div>
            {(question.type === 'single_select' ||
                question.type === 'multi_select') && (
                <ChoiceSettings
                    question={question}
                    idPrefix={idPrefix}
                    onChange={onChange}
                />
            )}
            {question.type === 'experience_matrix' && (
                <MatrixSettings question={question} onChange={onChange} />
            )}
        </div>
    );
}

/** A choose-one or choose-many question's choices and default answer. */
function ChoiceSettings({
    question,
    idPrefix,
    onChange,
}: {
    question: Question;
    idPrefix: string;
    onChange: ChangeQuestion;
}) {
    const readOnly = useReadOnly();

    return (
        <div className="mt-4">
            <Field
                label="Choices"
                hint="One per line. Renaming a line keeps the answers already collected against it."
            >
                <OptionLines
                    className={cn('min-h-28', textareaClass)}
                    options={question.options}
                    onChange={(value) =>
                        onChange((target) => {
                            target.options = fromLines(value, target.options);
                        })
                    }
                />
            </Field>
            <div className="mt-4 max-w-sm">
                <Field
                    label="Default answer"
                    hint="Pre-selected when the form opens. Use it when a law addresses one group."
                >
                    <FormSelect
                        value={question.default ?? ''}
                        onChange={(value) =>
                            onChange((target) => {
                                if (value === '') {
                                    delete target.default;
                                } else {
                                    target.default = value;
                                }
                            })
                        }
                        placeholder="No default; respondent chooses"
                        options={question.options ?? []}
                        allowEmpty
                        disabled={readOnly}
                    />
                </Field>
                <Label
                    htmlFor={`${idPrefix}-locked`}
                    className={cn(
                        'mt-3 inline-flex items-center gap-2 text-xs font-normal text-muted-foreground',
                        !readOnly && 'cursor-pointer',
                    )}
                >
                    <Checkbox
                        id={`${idPrefix}-locked`}
                        checked={question.locked === true}
                        disabled={readOnly || !question.default}
                        className={cn(readOnly && readOnlyControlClass)}
                        onCheckedChange={(checked) =>
                            onChange((target) => {
                                if (checked === true) {
                                    target.locked = true;
                                } else {
                                    delete target.locked;
                                }
                            })
                        }
                    />
                    Lock to the default — respondents cannot change it
                </Label>
            </div>
        </div>
    );
}

/** The experience matrix: its experiences, perpetrators, and opt-out. */
function MatrixSettings({
    question,
    onChange,
}: {
    question: Question;
    onChange: ChangeQuestion;
}) {
    return (
        <div className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
                <Field
                    label="Experiences"
                    hint="One per line. Each one reveals the perpetrator list when ticked."
                >
                    <OptionLines
                        className={cn('min-h-44', textareaClass)}
                        options={question.options}
                        onChange={(value) =>
                            onChange((target) => {
                                target.options = fromLines(
                                    value,
                                    target.options,
                                );
                            })
                        }
                    />
                </Field>
                <Field
                    label="Perpetrators"
                    hint="One per line. Shared by every experience above."
                >
                    <OptionLines
                        className={cn('min-h-44', textareaClass)}
                        options={question.perpetrator_options}
                        onChange={(value) =>
                            onChange((target) => {
                                target.perpetrator_options = fromLines(
                                    value,
                                    target.perpetrator_options,
                                );
                            })
                        }
                    />
                </Field>
            </div>
            <Field
                label="Opt-out choice"
                hint="Shown last. Selecting it rules out every other experience."
            >
                <Input
                    value={question.none_option?.label ?? ''}
                    onChange={(event) =>
                        onChange((target) => {
                            target.none_option = {
                                value: target.none_option?.value ?? 'none',
                                label: event.target.value,
                            };
                        })
                    }
                />
            </Field>
        </div>
    );
}
