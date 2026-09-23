import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowLeft,
    ArrowUp,
    ArrowUpRight,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    ExternalLink,
    Plus,
    Trash2,
} from 'lucide-react';
import {
    cloneElement,
    FormEvent,
    isValidElement,
    type ReactElement,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { fromLines, type SurveyOption, toLines } from '@/lib/survey-options';
import { cn } from '@/lib/utils';

type Option = SurveyOption;
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
type Definition = { sections: Section[] };
type ReadinessCheck = {
    key: string;
    error_key: string;
    label: string;
    passed: boolean;
    detail: string;
    href: string | null;
};
type Props = {
    survey: {
        id: number;
        code: string;
        slug: string;
        title: string;
        law_title: string;
        image_path: string | null;
        status: string;
        published_version: number | null;
        published_at: string | null;
        public_url: string | null;
    };
    draft: {
        id: number;
        version: number;
        introduction: string;
        privacy_notice: string;
        consent_text: string;
        retention_days: number | null;
        definition: Definition;
        updated_at: string | null;
    };
    directoryStatus: { regions: number; clusters: number; heis: number };
    readiness: ReadinessCheck[];
    permissions: { update: boolean; publish: boolean };
};

const questionTypes = [
    { value: 'integer', label: 'Number', hint: 'A whole number, such as age.' },
    {
        value: 'single_select',
        label: 'Choose one',
        hint: 'One answer from a list you write.',
    },
    {
        value: 'multi_select',
        label: 'Choose many',
        hint: 'Any number of answers from a list you write.',
    },
    {
        value: 'directory_region',
        label: 'Region',
        hint: 'Pulled from the Region directory.',
    },
    {
        value: 'directory_cluster',
        label: 'Cluster',
        hint: 'Narrows to the region the respondent picked.',
    },
    {
        value: 'directory_hei',
        label: 'HEI',
        hint: 'Narrows to the cluster the respondent picked.',
    },
    {
        value: 'experience_matrix',
        label: 'Experience matrix',
        hint: 'Experiences, each revealing its own perpetrator list.',
    },
];

const typeLabel = (type: string): string =>
    questionTypes.find((entry) => entry.value === type)?.label ??
    type.replaceAll('_', ' ');

let idCounter = 0;
const uniqueId = (prefix: string): string => {
    idCounter += 1;
    return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
};

/** Move an item within its list, ignoring moves past either end. */
const moveWithin = <T,>(list: T[], from: number, to: number): void => {
    if (to < 0 || to >= list.length) {
        return;
    }
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
};

const countLabel = (count: number, noun: string): string =>
    `${count} ${noun}${count === 1 ? '' : 's'}`;

const formatWhen = (iso: string | null): string | null => {
    if (!iso) {
        return null;
    }
    const date = new Date(iso);

    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          });
};

export default function SurveyBuilder({
    survey,
    draft,
    directoryStatus,
    readiness,
    permissions,
}: Props) {
    const [publishOpen, setPublishOpen] = useState(false);
    const [publishBlocked, setPublishBlocked] = useState(false);
    const [expandedSectionId, setExpandedSectionId] = useState<string | null>(
        draft.definition.sections[0]?.id ?? null,
    );
    const form = useForm({
        title: survey.title,
        law_title: survey.law_title,
        introduction: draft.introduction,
        privacy_notice: draft.privacy_notice,
        consent_text: draft.consent_text,
        retention_days: draft.retention_days,
        definition: draft.definition,
    });
    const publishForm = useForm({});

    const blockers = readiness.filter((check) => !check.passed);
    const savedAt = formatWhen(draft.updated_at);
    const publishedAt = formatWhen(survey.published_at);
    const canPublish =
        permissions.publish && blockers.length === 0 && !form.isDirty;

    const publishHint = !permissions.publish
        ? 'Publishing needs the publish permission. Ask an administrator to release this draft.'
        : form.isDirty
          ? 'Save your changes first. Publishing uses the last saved draft.'
          : blockers.length > 0
            ? `${blockers.length} ${blockers.length === 1 ? 'item' : 'items'} above still needs attention.`
            : `Draft v${draft.version} is ready to replace what respondents see.`;

    function changeDefinition(mutator: (definition: Definition) => void) {
        const definition = structuredClone(form.data.definition);
        mutator(definition);
        form.setData('definition', definition);
    }
    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/admin/surveys/${survey.id}`, { preserveScroll: true });
    }
    function publish() {
        publishForm.post(`/admin/surveys/${survey.id}/publish`, {
            preserveScroll: true,
            onSuccess: () => {
                setPublishOpen(false);
                setPublishBlocked(false);
            },
            onError: () => {
                setPublishOpen(false);
                setPublishBlocked(true);
            },
        });
    }
    function addSection() {
        const id = uniqueId('section');
        changeDefinition((definition) =>
            definition.sections.push({
                id,
                title: 'New section',
                questions: [],
            }),
        );
        setExpandedSectionId(id);
    }
    function addQuestion(sectionIndex: number, type: string) {
        changeDefinition((definition) =>
            definition.sections[sectionIndex].questions.push({
                id: uniqueId('question'),
                type,
                label: 'New question',
                required: true,
                ...(type === 'single_select'
                    ? { options: [{ value: 'option-1', label: 'Option 1' }] }
                    : {}),
                ...(type === 'integer' ? { min: 1, max: 120 } : {}),
                ...(type === 'experience_matrix'
                    ? {
                          options: [
                              { value: 'experience-1', label: 'Experience 1' },
                          ],
                          none_option: {
                              value: 'none',
                              label: 'I have not experienced any of the above',
                          },
                          perpetrator_options: [
                              { value: 'option-1', label: 'Option 1' },
                          ],
                      }
                    : {}),
            }),
        );
    }

    return (
        <>
            <Head title={`${survey.code} survey builder`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="-ml-3 text-muted-foreground"
                    >
                        <Link href="/admin/surveys">
                            <ArrowLeft />
                            All surveys
                        </Link>
                    </Button>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        {survey.code} · {survey.title}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {survey.law_title}
                    </p>
                </div>

                <Card className="gap-0 py-0">
                    <CardHeader className="border-b py-5">
                        <CardTitle>Publication</CardTitle>
                        <CardDescription>
                            Everything below edits draft v{draft.version} only.
                            Respondents keep seeing the live version until you
                            publish.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                        <section>
                            <h2 className="text-sm font-medium">
                                What the public sees
                            </h2>
                            {survey.published_version ? (
                                <div className="mt-3 rounded-lg border p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        Live · version{' '}
                                        {survey.published_version}
                                    </p>
                                    {publishedAt && (
                                        <p className="mt-1.5 text-sm text-muted-foreground">
                                            Published {publishedAt}
                                        </p>
                                    )}
                                    {survey.public_url && (
                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                        >
                                            <a
                                                href={survey.public_url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Open public page
                                                <ExternalLink />
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-3 rounded-lg border border-dashed p-4">
                                    <p className="flex items-center gap-2 text-sm font-medium">
                                        <span className="size-2 rounded-full bg-muted-foreground/40" />
                                        Nothing published yet
                                    </p>
                                    <p className="mt-1.5 text-sm text-muted-foreground">
                                        <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                            /surveys/{survey.slug}
                                        </code>{' '}
                                        still shows a being-prepared notice, and
                                        its card on the home page reads Opening
                                        soon. Publishing draft v{draft.version}{' '}
                                        replaces both.
                                    </p>
                                </div>
                            )}
                            <p className="mt-3 text-sm text-muted-foreground">
                                Draft v{draft.version}
                                {savedAt ? ` · saved ${savedAt}` : ''}
                            </p>
                        </section>

                        <section>
                            <h2 className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium">
                                Before this draft can go live
                                <span className="font-normal text-muted-foreground">
                                    {readiness.length - blockers.length} of{' '}
                                    {readiness.length} ready
                                </span>
                            </h2>
                            {publishBlocked && blockers.length > 0 && (
                                <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                    Publishing was blocked. Clear the items
                                    below, then try again.
                                </p>
                            )}
                            <ul className="mt-3 space-y-2">
                                {readiness.map((check) => (
                                    <li
                                        key={check.key}
                                        className={cn(
                                            'rounded-lg border p-3',
                                            check.passed
                                                ? 'border-transparent bg-muted/50'
                                                : 'border-amber-500/40 bg-amber-500/5',
                                        )}
                                    >
                                        <div className="flex gap-2.5">
                                            {check.passed ? (
                                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />
                                            ) : (
                                                <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        'text-sm',
                                                        check.passed
                                                            ? 'text-muted-foreground'
                                                            : 'font-medium',
                                                    )}
                                                >
                                                    {check.label}
                                                </p>
                                                {!check.passed && (
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {check.detail}
                                                    </p>
                                                )}
                                                {check.key ===
                                                    'directories' && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {countLabel(
                                                            directoryStatus.regions,
                                                            'active region',
                                                        )}{' '}
                                                        ·{' '}
                                                        {countLabel(
                                                            directoryStatus.clusters,
                                                            'cluster',
                                                        )}{' '}
                                                        ·{' '}
                                                        {countLabel(
                                                            directoryStatus.heis,
                                                            'HEI',
                                                        )}
                                                    </p>
                                                )}
                                                {!check.passed &&
                                                    check.href && (
                                                        <Button
                                                            asChild
                                                            variant="link"
                                                            size="sm"
                                                            className="mt-1 h-auto p-0"
                                                        >
                                                            <Link
                                                                href={
                                                                    check.href
                                                                }
                                                            >
                                                                Manage
                                                                directories
                                                                <ArrowUpRight />
                                                            </Link>
                                                        </Button>
                                                    )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </CardContent>
                    <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            {publishHint}
                        </p>
                        {permissions.publish && (
                            <Button
                                type="button"
                                disabled={!canPublish}
                                onClick={() => setPublishOpen(true)}
                                className="sm:shrink-0"
                            >
                                Publish draft v{draft.version}
                            </Button>
                        )}
                    </div>
                </Card>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Survey details</CardTitle>
                            <CardDescription>
                                The title, notices, and retention rule
                                respondents see before they answer.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Survey title"
                                error={form.errors.title}
                            >
                                <Input
                                    value={form.data.title}
                                    onChange={(event) =>
                                        form.setData(
                                            'title',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Law title"
                                error={form.errors.law_title}
                            >
                                <Input
                                    value={form.data.law_title}
                                    onChange={(event) =>
                                        form.setData(
                                            'law_title',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Introduction"
                                hint="Explains why the survey exists and that no name or email is collected."
                                error={form.errors.introduction}
                                wide
                            >
                                <textarea
                                    className="min-h-24 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    value={form.data.introduction}
                                    onChange={(event) =>
                                        form.setData(
                                            'introduction',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Privacy notice"
                                hint="Names every field collected, who can read it, and how to request deletion."
                                error={form.errors.privacy_notice}
                                wide
                            >
                                <textarea
                                    className="min-h-32 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                                wide
                            >
                                <textarea
                                    className="min-h-24 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    value={form.data.consent_text}
                                    onChange={(event) =>
                                        form.setData(
                                            'consent_text',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field
                                label="Retention period (days)"
                                hint="Required before publishing. Responses are deleted automatically once this many days have passed."
                                error={form.errors.retention_days}
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    max={3650}
                                    placeholder="e.g. 365"
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

                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Question structure
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Respondents answer in this order. Every question
                                needs an answer key, which is what its responses
                                are stored under.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addSection}
                            className="sm:shrink-0"
                        >
                            <Plus />
                            Add section
                        </Button>
                    </div>

                    {form.data.definition.sections.length === 0 && (
                        <div className="rounded-lg border border-dashed p-8 text-center">
                            <p className="font-medium">No sections yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                A survey needs at least one section holding at
                                least one question before it can be published.
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                className="mt-4"
                                onClick={addSection}
                            >
                                <Plus />
                                Add the first section
                            </Button>
                        </div>
                    )}

                    {form.data.definition.sections.map(
                        (section, sectionIndex) => (
                            <Collapsible
                                key={section.id}
                                open={expandedSectionId === section.id}
                                onOpenChange={(open) =>
                                    setExpandedSectionId(
                                        open ? section.id : null,
                                    )
                                }
                            >
                                <Card>
                                    <CardHeader className="flex-row items-center gap-3">
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="min-w-0 flex-1 justify-start text-left"
                                            >
                                                <ChevronDown
                                                    aria-hidden="true"
                                                    className={cn(
                                                        'shrink-0 transition-transform',
                                                        expandedSectionId !==
                                                            section.id &&
                                                            '-rotate-90',
                                                    )}
                                                />
                                                <span className="truncate font-semibold">
                                                    {section.title ||
                                                        'Untitled section'}
                                                </span>
                                                <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">
                                                    {countLabel(
                                                        section.questions
                                                            .length,
                                                        'question',
                                                    )}
                                                </span>
                                            </Button>
                                        </CollapsibleTrigger>
                                        <div className="flex shrink-0 items-center gap-1">
                                            <IconAction
                                                type="button"
                                                label="Move section earlier"
                                                disabled={sectionIndex === 0}
                                                onClick={() =>
                                                    changeDefinition(
                                                        (definition) =>
                                                            moveWithin(
                                                                definition.sections,
                                                                sectionIndex,
                                                                sectionIndex -
                                                                    1,
                                                            ),
                                                    )
                                                }
                                            >
                                                <ArrowUp />
                                            </IconAction>
                                            <IconAction
                                                type="button"
                                                label="Move section later"
                                                disabled={
                                                    sectionIndex ===
                                                    form.data.definition
                                                        .sections.length -
                                                        1
                                                }
                                                onClick={() =>
                                                    changeDefinition(
                                                        (definition) =>
                                                            moveWithin(
                                                                definition.sections,
                                                                sectionIndex,
                                                                sectionIndex +
                                                                    1,
                                                            ),
                                                    )
                                                }
                                            >
                                                <ArrowDown />
                                            </IconAction>
                                            <IconAction
                                                type="button"
                                                label="Remove this section and its questions"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    changeDefinition(
                                                        (definition) =>
                                                            definition.sections.splice(
                                                                sectionIndex,
                                                                1,
                                                            ),
                                                    )
                                                }
                                            >
                                                <Trash2 />
                                            </IconAction>
                                        </div>
                                    </CardHeader>
                                    <CollapsibleContent asChild>
                                        <CardContent className="space-y-4">
                                            <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                                                <Field label="Section title">
                                                    <Input
                                                        value={section.title}
                                                        onChange={(event) =>
                                                            changeDefinition(
                                                                (
                                                                    definition,
                                                                ) => {
                                                                    definition.sections[
                                                                        sectionIndex
                                                                    ].title =
                                                                        event.target.value;
                                                                },
                                                            )
                                                        }
                                                    />
                                                </Field>
                                                <Field label="Description">
                                                    <Input
                                                        placeholder="Optional guidance shown under the title"
                                                        value={
                                                            section.description ??
                                                            ''
                                                        }
                                                        onChange={(event) =>
                                                            changeDefinition(
                                                                (
                                                                    definition,
                                                                ) => {
                                                                    definition.sections[
                                                                        sectionIndex
                                                                    ].description =
                                                                        event.target.value;
                                                                },
                                                            )
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                            {section.questions.length === 0 && (
                                                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                                    This section is empty. A
                                                    section without questions
                                                    blocks publication.
                                                </p>
                                            )}
                                            {section.questions.map(
                                                (question, questionIndex) => (
                                                    <div
                                                        key={question.id}
                                                        className="rounded-lg border p-4"
                                                    >
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <Badge variant="secondary">
                                                                {typeLabel(
                                                                    question.type,
                                                                )}
                                                            </Badge>
                                                            <Label
                                                                htmlFor={`question-${sectionIndex}-${questionIndex}-required`}
                                                                className="inline-flex cursor-pointer items-center gap-2 text-xs font-normal text-muted-foreground"
                                                            >
                                                                <Checkbox
                                                                    id={`question-${sectionIndex}-${questionIndex}-required`}
                                                                    checked={
                                                                        question.required
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked,
                                                                    ) =>
                                                                        changeDefinition(
                                                                            (
                                                                                definition,
                                                                            ) => {
                                                                                definition.sections[
                                                                                    sectionIndex
                                                                                ].questions[
                                                                                    questionIndex
                                                                                ].required =
                                                                                    checked ===
                                                                                    true;
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                                Required
                                                            </Label>
                                                            <div className="ml-auto flex items-center gap-1">
                                                                <IconAction
                                                                    type="button"
                                                                    label="Move question earlier"
                                                                    disabled={
                                                                        questionIndex ===
                                                                        0
                                                                    }
                                                                    onClick={() =>
                                                                        changeDefinition(
                                                                            (
                                                                                definition,
                                                                            ) =>
                                                                                moveWithin(
                                                                                    definition
                                                                                        .sections[
                                                                                        sectionIndex
                                                                                    ]
                                                                                        .questions,
                                                                                    questionIndex,
                                                                                    questionIndex -
                                                                                        1,
                                                                                ),
                                                                        )
                                                                    }
                                                                >
                                                                    <ArrowUp />
                                                                </IconAction>
                                                                <IconAction
                                                                    type="button"
                                                                    label="Move question later"
                                                                    disabled={
                                                                        questionIndex ===
                                                                        section
                                                                            .questions
                                                                            .length -
                                                                            1
                                                                    }
                                                                    onClick={() =>
                                                                        changeDefinition(
                                                                            (
                                                                                definition,
                                                                            ) =>
                                                                                moveWithin(
                                                                                    definition
                                                                                        .sections[
                                                                                        sectionIndex
                                                                                    ]
                                                                                        .questions,
                                                                                    questionIndex,
                                                                                    questionIndex +
                                                                                        1,
                                                                                ),
                                                                        )
                                                                    }
                                                                >
                                                                    <ArrowDown />
                                                                </IconAction>
                                                                <IconAction
                                                                    type="button"
                                                                    label="Remove this question"
                                                                    className="text-muted-foreground hover:text-destructive"
                                                                    onClick={() =>
                                                                        changeDefinition(
                                                                            (
                                                                                definition,
                                                                            ) =>
                                                                                definition.sections[
                                                                                    sectionIndex
                                                                                ].questions.splice(
                                                                                    questionIndex,
                                                                                    1,
                                                                                ),
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 />
                                                                </IconAction>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                                                            <Field label="Question label">
                                                                <Input
                                                                    value={
                                                                        question.label
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        changeDefinition(
                                                                            (
                                                                                definition,
                                                                            ) => {
                                                                                definition.sections[
                                                                                    sectionIndex
                                                                                ].questions[
                                                                                    questionIndex
                                                                                ].label =
                                                                                    event.target.value;
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                            </Field>
                                                            <Field
                                                                label="Answer key"
                                                                hint="Stored with every response. Letters, numbers, dashes."
                                                            >
                                                                <Input
                                                                    className="font-mono text-xs"
                                                                    value={
                                                                        question.id
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) =>
                                                                        changeDefinition(
                                                                            (
                                                                                definition,
                                                                            ) => {
                                                                                definition.sections[
                                                                                    sectionIndex
                                                                                ].questions[
                                                                                    questionIndex
                                                                                ].id =
                                                                                    event.target.value;
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                            </Field>
                                                        </div>
                                                        {(question.type ===
                                                            'single_select' ||
                                                            question.type ===
                                                                'multi_select') && (
                                                            <div className="mt-4">
                                                                <Field
                                                                    label="Choices"
                                                                    hint="One per line. Renaming a line keeps the answers already collected against it."
                                                                >
                                                                    <OptionLines
                                                                        className="min-h-28 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                                        options={
                                                                            question.options
                                                                        }
                                                                        onChange={(
                                                                            value,
                                                                        ) =>
                                                                            changeDefinition(
                                                                                (
                                                                                    definition,
                                                                                ) => {
                                                                                    const target =
                                                                                        definition
                                                                                            .sections[
                                                                                            sectionIndex
                                                                                        ]
                                                                                            .questions[
                                                                                            questionIndex
                                                                                        ];
                                                                                    target.options =
                                                                                        fromLines(
                                                                                            value,
                                                                                            target.options,
                                                                                        );
                                                                                },
                                                                            )
                                                                        }
                                                                    />
                                                                </Field>
                                                                <div className="mt-4 max-w-sm">
                                                                    <Field
                                                                        label="Default answer"
                                                                        hint="Pre-selected when the form opens. Use it when a law addresses one group."
                                                                    >
                                                                        <select
                                                                            className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                                            value={
                                                                                question.default ??
                                                                                ''
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                changeDefinition(
                                                                                    (
                                                                                        definition,
                                                                                    ) => {
                                                                                        const target =
                                                                                            definition
                                                                                                .sections[
                                                                                                sectionIndex
                                                                                            ]
                                                                                                .questions[
                                                                                                questionIndex
                                                                                            ];
                                                                                        if (
                                                                                            event
                                                                                                .target
                                                                                                .value ===
                                                                                            ''
                                                                                        ) {
                                                                                            delete target.default;
                                                                                        } else {
                                                                                            target.default =
                                                                                                event.target.value;
                                                                                        }
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <option value="">
                                                                                No
                                                                                default
                                                                                —
                                                                                the
                                                                                respondent
                                                                                chooses
                                                                            </option>
                                                                            {(
                                                                                question.options ??
                                                                                []
                                                                            ).map(
                                                                                (
                                                                                    option,
                                                                                ) => (
                                                                                    <option
                                                                                        key={
                                                                                            option.value
                                                                                        }
                                                                                        value={
                                                                                            option.value
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            option.label
                                                                                        }
                                                                                    </option>
                                                                                ),
                                                                            )}
                                                                        </select>
                                                                    </Field>
                                                                    <Label
                                                                        htmlFor={`question-${sectionIndex}-${questionIndex}-locked`}
                                                                        className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-normal text-muted-foreground"
                                                                    >
                                                                        <Checkbox
                                                                            id={`question-${sectionIndex}-${questionIndex}-locked`}
                                                                            checked={
                                                                                question.locked ===
                                                                                true
                                                                            }
                                                                            disabled={
                                                                                !question.default
                                                                            }
                                                                            onCheckedChange={(
                                                                                checked,
                                                                            ) =>
                                                                                changeDefinition(
                                                                                    (
                                                                                        definition,
                                                                                    ) => {
                                                                                        const target =
                                                                                            definition
                                                                                                .sections[
                                                                                                sectionIndex
                                                                                            ]
                                                                                                .questions[
                                                                                                questionIndex
                                                                                            ];
                                                                                        if (
                                                                                            checked ===
                                                                                            true
                                                                                        ) {
                                                                                            target.locked = true;
                                                                                        } else {
                                                                                            delete target.locked;
                                                                                        }
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                        Lock to
                                                                        the
                                                                        default
                                                                        —
                                                                        respondents
                                                                        cannot
                                                                        change
                                                                        it
                                                                    </Label>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {question.type ===
                                                            'experience_matrix' && (
                                                            <div className="mt-4 space-y-4">
                                                                <div className="grid gap-4 lg:grid-cols-2">
                                                                    <Field
                                                                        label="Experiences"
                                                                        hint="One per line. Each one reveals the perpetrator list when ticked."
                                                                    >
                                                                        <OptionLines
                                                                            className="min-h-44 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                                            options={
                                                                                question.options
                                                                            }
                                                                            onChange={(
                                                                                value,
                                                                            ) =>
                                                                                changeDefinition(
                                                                                    (
                                                                                        definition,
                                                                                    ) => {
                                                                                        const target =
                                                                                            definition
                                                                                                .sections[
                                                                                                sectionIndex
                                                                                            ]
                                                                                                .questions[
                                                                                                questionIndex
                                                                                            ];
                                                                                        target.options =
                                                                                            fromLines(
                                                                                                value,
                                                                                                target.options,
                                                                                            );
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </Field>
                                                                    <Field
                                                                        label="Perpetrators"
                                                                        hint="One per line. Shared by every experience above."
                                                                    >
                                                                        <OptionLines
                                                                            className="min-h-44 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                                            options={
                                                                                question.perpetrator_options
                                                                            }
                                                                            onChange={(
                                                                                value,
                                                                            ) =>
                                                                                changeDefinition(
                                                                                    (
                                                                                        definition,
                                                                                    ) => {
                                                                                        const target =
                                                                                            definition
                                                                                                .sections[
                                                                                                sectionIndex
                                                                                            ]
                                                                                                .questions[
                                                                                                questionIndex
                                                                                            ];
                                                                                        target.perpetrator_options =
                                                                                            fromLines(
                                                                                                value,
                                                                                                target.perpetrator_options,
                                                                                            );
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </Field>
                                                                </div>
                                                                <Field
                                                                    label="Opt-out choice"
                                                                    hint="Shown last. Selecting it rules out every other experience."
                                                                >
                                                                    <Input
                                                                        value={
                                                                            question
                                                                                .none_option
                                                                                ?.label ??
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            changeDefinition(
                                                                                (
                                                                                    definition,
                                                                                ) => {
                                                                                    const target =
                                                                                        definition
                                                                                            .sections[
                                                                                            sectionIndex
                                                                                        ]
                                                                                            .questions[
                                                                                            questionIndex
                                                                                        ];
                                                                                    target.none_option =
                                                                                        {
                                                                                            value:
                                                                                                target
                                                                                                    .none_option
                                                                                                    ?.value ??
                                                                                                'none',
                                                                                            label: event
                                                                                                .target
                                                                                                .value,
                                                                                        };
                                                                                },
                                                                            )
                                                                        }
                                                                    />
                                                                </Field>
                                                            </div>
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                                                <span className="mr-1 text-xs text-muted-foreground">
                                                    Add a question
                                                </span>
                                                {questionTypes.map((type) => (
                                                    <Tooltip key={type.value}>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    addQuestion(
                                                                        sectionIndex,
                                                                        type.value,
                                                                    )
                                                                }
                                                            >
                                                                <Plus />
                                                                {type.label}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            {type.hint}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        ),
                    )}

                    <InputError message={form.errors.definition} />

                    {permissions.update ? (
                        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span
                                    className={cn(
                                        'size-2 rounded-full',
                                        form.isDirty
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500',
                                    )}
                                />
                                {form.isDirty
                                    ? 'Unsaved changes'
                                    : savedAt
                                      ? `Saved ${savedAt}`
                                      : 'No changes yet'}
                            </p>
                            <Button
                                type="submit"
                                size="lg"
                                disabled={form.processing}
                            >
                                {form.processing ? 'Saving…' : 'Save draft'}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            You have read-only access to this draft.
                        </p>
                    )}
                </form>
            </div>

            <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Publish draft v{draft.version}?
                        </DialogTitle>
                        <DialogDescription>
                            This changes what respondents see straight away.
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="space-y-2.5 text-sm text-muted-foreground">
                        <li>
                            Draft v{draft.version} becomes the live
                            questionnaire at{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                /surveys/{survey.slug}
                            </code>
                            .
                        </li>
                        {survey.published_version !== null && (
                            <li>
                                Version {survey.published_version} is kept as a
                                superseded record, and responses already
                                collected against it stay linked to it.
                            </li>
                        )}
                        <li>
                            A fresh draft v{draft.version + 1} opens, so you can
                            keep editing without touching the live survey.
                        </li>
                    </ul>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPublishOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={publish}
                            disabled={publishForm.processing}
                        >
                            {publishForm.processing
                                ? 'Publishing…'
                                : `Publish v${draft.version}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Field({
    label,
    hint,
    error,
    wide,
    children,
}: {
    label: string;
    hint?: string;
    error?: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const control = isValidElement(children)
        ? cloneElement(
              children as ReactElement<{
                  id?: string;
                  'aria-describedby'?: string;
              }>,
              { id, 'aria-describedby': hintId },
          )
        : children;

    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <Label htmlFor={id}>{label}</Label>
            <div className="mt-1.5">{control}</div>
            {hint && (
                <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
            <InputError className="mt-1.5" message={error} />
        </div>
    );
}

/** Keep the in-progress newline visible while storing stable option keys. */
function OptionLines({
    options,
    onChange,
    ...props
}: {
    options?: Option[];
    onChange: (value: string) => void;
} & Omit<
    React.ComponentProps<'textarea'>,
    'value' | 'defaultValue' | 'onChange'
>) {
    const [text, setText] = useState(() => toLines(options));
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) {
            setText(toLines(options));
        }
    }, [options]);

    return (
        <textarea
            {...props}
            value={text}
            onFocus={() => {
                focused.current = true;
            }}
            onBlur={() => {
                focused.current = false;
                setText(toLines(options));
            }}
            onChange={(event) => {
                const value = event.target.value;
                setText(value);
                onChange(value);
            }}
        />
    );
}
