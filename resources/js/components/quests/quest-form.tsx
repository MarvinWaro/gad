import { Link, useForm } from '@inertiajs/react';
import { Check, Lock, Plus, X } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    Field,
    fieldClass,
    panelClass,
    selectClass,
} from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index, show, store, update } from '@/routes/quests/manage';
import type { DirectoryOption } from '@/types/monitoring';
import type { ManagedQuest, QuestQuestionInput } from '@/types/quests';

export type QuestLimits = {
    questions: number;
    min_choices: number;
    max_choices: number;
};

/** A question as the form holds it: no choice is correct until one is marked. */
type QuestionDraft = Omit<QuestQuestionInput, 'correct'> & {
    correct: number | null;
};

type QuestFormData = {
    title: string;
    description: string;
    /** The Central Office's pick; empty for every region. */
    region: string;
    questions: QuestionDraft[];
};

/** Choices a new question starts with. */
const STARTING_CHOICES = 4;

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

function blankQuestion(): QuestionDraft {
    return {
        prompt: '',
        explanation: '',
        choices: Array.from({ length: STARTING_CHOICES }, () => ''),
        correct: null,
    };
}

/**
 * Writing a quest: what it is about, then its questions, each with its
 * choices, the correct one, and why. Once anyone has played, the questions
 * and region are shown but locked, since scores were counted against them.
 */
export function QuestForm({
    quest,
    regions,
    nationalAccess,
    limits,
}: {
    quest: ManagedQuest | null;
    regions: DirectoryOption[];
    nationalAccess: boolean;
    limits: QuestLimits;
}) {
    const locked = quest?.played === true;
    const form = useForm<QuestFormData>({
        title: quest?.title ?? '',
        description: quest?.description ?? '',
        region: quest?.region ? String(quest.region.id) : '',
        questions:
            quest?.questions ??
            Array.from({ length: limits.questions }, blankQuestion),
    });
    const errors = form.errors as Record<string, string | undefined>;

    function changeQuestion(index: number, change: Partial<QuestionDraft>) {
        form.setData(
            'questions',
            form.data.questions.map((question, position) =>
                position === index ? { ...question, ...change } : question,
            ),
        );
    }

    function removeChoice(index: number, choice: number) {
        const question = form.data.questions[index];
        // Removing the marked choice leaves none marked, never another one.
        const correct =
            question.correct === null || question.correct === choice
                ? null
                : question.correct > choice
                  ? question.correct - 1
                  : question.correct;

        changeQuestion(index, {
            choices: question.choices.filter(
                (_, position) => position !== choice,
            ),
            correct,
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true };

        if (quest) {
            form.put(update.url(quest.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    const regionName =
        quest?.region?.name ??
        (nationalAccess ? null : (regions[0]?.name ?? null));

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <section
                aria-labelledby="quest-about"
                className={cn(panelClass, 'space-y-5')}
            >
                <h2 id="quest-about" className="font-medium">
                    About the quest
                </h2>
                <Field label="Title" id="title" error={errors.title}>
                    <input
                        id="title"
                        className={fieldClass}
                        value={form.data.title}
                        onChange={(event) =>
                            form.setData('title', event.target.value)
                        }
                        maxLength={120}
                        required
                        aria-invalid={errors.title ? true : undefined}
                        aria-describedby={
                            errors.title ? 'title-error' : undefined
                        }
                    />
                </Field>
                <Field
                    label="Description (optional)"
                    id="description"
                    hint="A line or two on the topic or event, shown before the first question."
                    error={errors.description}
                >
                    <textarea
                        id="description"
                        className={cn(fieldClass, 'min-h-20')}
                        rows={3}
                        value={form.data.description}
                        onChange={(event) =>
                            form.setData('description', event.target.value)
                        }
                        maxLength={500}
                        aria-describedby="description-hint"
                    />
                </Field>
                {nationalAccess ? (
                    <Field
                        label="Who plays it"
                        id="region"
                        hint="People of the region you choose, or of every region."
                        error={errors.region}
                    >
                        <FormSelect
                            id="region"
                            className={selectClass}
                            value={form.data.region}
                            onChange={(region) =>
                                form.setData('region', region)
                            }
                            disabled={locked}
                            placeholder="All regions"
                            allowEmpty
                            emptyLabel="All regions"
                            options={regions.map((region) => ({
                                value: String(region.id),
                                label: region.name,
                            }))}
                        />
                    </Field>
                ) : (
                    regionName && (
                        <p className="text-sm text-muted-foreground">
                            For HEIs and staff of{' '}
                            <span className="font-medium text-foreground">
                                {regionName}
                            </span>
                            .
                        </p>
                    )
                )}
            </section>

            {locked && (
                <p
                    role="status"
                    className="flex gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
                >
                    <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
                    People have played this quest, so its questions and region
                    stay as they were played. You can still change the title and
                    description.
                </p>
            )}
            {errors.questions && (
                <p role="alert" className="text-sm text-destructive">
                    {errors.questions}
                </p>
            )}

            <fieldset disabled={locked} className="space-y-6">
                <legend className="sr-only">Questions</legend>
                {form.data.questions.map((question, index) => (
                    <QuestionFields
                        key={index}
                        index={index}
                        question={question}
                        limits={limits}
                        errors={errors}
                        onChange={(change) => changeQuestion(index, change)}
                        onRemoveChoice={(choice) => removeChoice(index, choice)}
                    />
                ))}
            </fieldset>

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {quest ? 'Save changes' : 'Save as draft'}
                </Button>
                <Button asChild variant="ghost">
                    <Link href={quest ? show.url(quest.id) : index.url()}>
                        Cancel
                    </Link>
                </Button>
                {!quest && (
                    <p className="text-sm text-muted-foreground">
                        Players see it once you open it.
                    </p>
                )}
            </div>
        </form>
    );
}

function QuestionFields({
    index,
    question,
    limits,
    errors,
    onChange,
    onRemoveChoice,
}: {
    index: number;
    question: QuestionDraft;
    limits: QuestLimits;
    errors: Record<string, string | undefined>;
    onChange: (change: Partial<QuestionDraft>) => void;
    onRemoveChoice: (choice: number) => void;
}) {
    const id = `question-${index}`;
    const key = `questions.${index}`;
    // One line for the choices: the first problem, not one per field.
    const choicesError =
        errors[`${key}.choices`] ??
        errors[`${key}.correct`] ??
        question.choices
            .map((_, choice) => errors[`${key}.choices.${choice}`])
            .find(Boolean);

    return (
        <fieldset
            aria-labelledby={`${id}-legend`}
            className={cn(panelClass, 'space-y-5')}
        >
            <legend id={`${id}-legend`} className="float-left mb-1 font-medium">
                Question {index + 1}
            </legend>
            <div className="clear-left">
                <Field
                    label="Question"
                    id={`${id}-prompt`}
                    error={errors[`${key}.prompt`]}
                >
                    <textarea
                        id={`${id}-prompt`}
                        className={cn(fieldClass, 'min-h-16')}
                        rows={2}
                        value={question.prompt}
                        onChange={(event) =>
                            onChange({ prompt: event.target.value })
                        }
                        maxLength={300}
                        aria-invalid={
                            errors[`${key}.prompt`] ? true : undefined
                        }
                    />
                </Field>
            </div>

            <div
                role="radiogroup"
                aria-labelledby={`${id}-choices-label`}
                aria-describedby={`${id}-choices-hint`}
                className="space-y-2"
            >
                <p id={`${id}-choices-label`} className="text-sm font-medium">
                    Choices
                </p>
                <p
                    id={`${id}-choices-hint`}
                    className="text-sm text-muted-foreground"
                >
                    Click the circle beside the correct choice. Players see the
                    choices shuffled, so don’t refer to letters, such as “Both A
                    and B”.
                </p>
                <ul className="space-y-2">
                    {question.choices.map((choice, position) => (
                        <li key={position} className="flex items-center gap-2">
                            <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md has-focus-visible:ring-2 has-focus-visible:ring-ring">
                                <input
                                    type="radio"
                                    name={`${id}-correct`}
                                    className="size-4 accent-brand"
                                    checked={question.correct === position}
                                    onChange={() =>
                                        onChange({ correct: position })
                                    }
                                />
                                <span className="sr-only">
                                    Choice {letters[position]} is correct
                                </span>
                            </label>
                            <span
                                aria-hidden
                                className="w-4 shrink-0 text-sm text-muted-foreground"
                            >
                                {letters[position]}
                            </span>
                            <input
                                className={cn(
                                    fieldClass,
                                    question.correct === position &&
                                        'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/60',
                                )}
                                value={choice}
                                onChange={(event) =>
                                    onChange({
                                        choices: question.choices.map(
                                            (label, at) =>
                                                at === position
                                                    ? event.target.value
                                                    : label,
                                        ),
                                    })
                                }
                                maxLength={200}
                                aria-label={`Choice ${letters[position]} of question ${index + 1}`}
                                aria-invalid={
                                    errors[`${key}.choices.${position}`]
                                        ? true
                                        : undefined
                                }
                            />
                            {question.choices.length > limits.min_choices && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-11 shrink-0 text-muted-foreground"
                                    onClick={() => onRemoveChoice(position)}
                                    aria-label={`Remove choice ${letters[position]}`}
                                >
                                    <X />
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
                <p
                    className={cn(
                        'flex items-center gap-1.5 text-sm',
                        question.correct === null
                            ? 'text-muted-foreground'
                            : 'font-medium text-emerald-700 dark:text-emerald-400',
                    )}
                >
                    {question.correct === null ? (
                        'Mark the correct answer.'
                    ) : (
                        <>
                            <Check aria-hidden className="size-4 shrink-0" />
                            Correct answer: {letters[question.correct]}
                        </>
                    )}
                </p>
                {question.choices.length < limits.max_choices && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="min-h-10"
                        onClick={() =>
                            onChange({ choices: [...question.choices, ''] })
                        }
                    >
                        <Plus />
                        Add a choice
                    </Button>
                )}
                {choicesError && (
                    <p role="alert" className="text-sm text-destructive">
                        {choicesError}
                    </p>
                )}
            </div>

            <Field
                label="Why this is the answer"
                id={`${id}-explanation`}
                hint="Players read this right after they answer. When it comes from a law or policy, name it, such as RA 11313, Section 3."
                error={errors[`${key}.explanation`]}
            >
                <textarea
                    id={`${id}-explanation`}
                    className={cn(fieldClass, 'min-h-20')}
                    rows={3}
                    value={question.explanation}
                    onChange={(event) =>
                        onChange({ explanation: event.target.value })
                    }
                    maxLength={600}
                    aria-describedby={`${id}-explanation-hint`}
                    aria-invalid={
                        errors[`${key}.explanation`] ? true : undefined
                    }
                />
            </Field>
        </fieldset>
    );
}
