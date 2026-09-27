import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ContactRound,
    ListTree,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import type { ConfirmVisit } from '@/components/confirm-popover';
import Heading from '@/components/heading';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { OptionLines } from '@/components/option-lines';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FormSelect } from '@/components/ui/form-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fromLines, type SurveyOption } from '@/lib/survey-options';

/**
 * A question asked right after a respondent picks the group
 * (App\Support\RespondentFollowUps). `key` is set by the server on first save
 * and never changes, like each choice's `value`.
 */
type FollowUpQuestion = {
    key?: string;
    label: string;
    type: 'select' | 'radio';
    required: boolean;
    options: SurveyOption[];
};
type RespondentGroup = {
    id: number;
    value: string;
    label: string;
    requires_text: boolean;
    follow_ups: FollowUpQuestion[] | null;
    is_active: boolean;
    sort_order: number;
};
type Permissions = { create: boolean; update: boolean; delete: boolean };

const textareaClass =
    'min-h-28 w-full rounded-md border bg-transparent p-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50';

export default function RespondentGroups({
    respondentGroups,
    permissions,
}: {
    respondentGroups: RespondentGroup[];
    permissions: Permissions;
}) {
    return (
        <>
            <Head title="Respondent groups" />
            <div className="space-y-6">
                <div className="flex justify-between gap-4">
                    <Heading
                        variant="small"
                        title="Respondent groups"
                        description="The groups every public survey offers when it asks who the respondent is, and what each one asks next."
                    />
                    {permissions.create && <RespondentGroupDialog />}
                </div>
                <div className="overflow-hidden rounded-xl border bg-card">
                    {respondentGroups.length === 0 ? (
                        <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                            <ContactRound className="size-7 text-muted-foreground" />
                            <h2 className="mt-3 font-medium">
                                No respondent groups configured
                            </h2>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Add at least one group so respondents can say
                                which they belong to.
                            </p>
                        </div>
                    ) : (
                        <RespondentGroupTable
                            groups={respondentGroups}
                            permissions={permissions}
                        />
                    )}
                </div>
                <p className="text-xs text-muted-foreground">
                    A group&rsquo;s answer key is stored with every response and
                    never changes, so renaming a group keeps the answers already
                    collected against it. The same goes for its follow-up
                    questions and their choices.
                </p>
            </div>
        </>
    );
}

function RespondentGroupTable({
    groups,
    permissions,
}: {
    groups: RespondentGroup[];
    permissions: Permissions;
}) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Answer key</th>
                        <th className="px-4 py-3">Asks for detail</th>
                        <th className="px-4 py-3">Follow-up questions</th>
                        <th className="sticky right-0 bg-muted/50 px-4 py-3 text-right shadow-[inset_1px_0_0_var(--border)]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {groups.map((group) => {
                        const questions = group.follow_ups ?? [];

                        return (
                            <tr key={group.id}>
                                <td className="px-4 py-4">
                                    <span className="font-medium">
                                        {group.label}
                                    </span>
                                    {!group.is_active && (
                                        <Badge
                                            variant="outline"
                                            className="ml-2 align-middle text-muted-foreground"
                                        >
                                            Inactive
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                                    {group.value}
                                </td>
                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                    {group.requires_text ? 'Yes' : 'No'}
                                </td>
                                <td className="max-w-[18rem] px-4 py-4 text-sm text-muted-foreground">
                                    {questions.length > 0 ? (
                                        <span
                                            className="line-clamp-2"
                                            title={questions
                                                .map(
                                                    (question) =>
                                                        question.label,
                                                )
                                                .join(' · ')}
                                        >
                                            {questions
                                                .map(
                                                    (question) =>
                                                        question.label,
                                                )
                                                .join(' · ')}
                                        </span>
                                    ) : (
                                        'None'
                                    )}
                                </td>
                                <td className="sticky right-0 bg-card px-4 py-4 shadow-[inset_1px_0_0_var(--border)]">
                                    <div className="flex justify-end gap-1">
                                        {permissions.update && (
                                            <>
                                                <FollowUpsDialog
                                                    group={group}
                                                />
                                                <RespondentGroupDialog
                                                    group={group}
                                                />
                                                {group.is_active ? (
                                                    <ConfirmPopover
                                                        title={`Deactivate ${group.label}?`}
                                                        description="It will be hidden from the public surveys. Collected responses are kept, and you can activate it again anytime."
                                                        confirmLabel="Deactivate"
                                                        onConfirm={(visit) =>
                                                            toggleActive(
                                                                group,
                                                                visit,
                                                            )
                                                        }
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            Deactivate
                                                        </Button>
                                                    </ConfirmPopover>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            toggleActive(group)
                                                        }
                                                    >
                                                        Activate
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        {permissions.delete && (
                                            <ConfirmPopover
                                                title={`Delete ${group.label}?`}
                                                description="Groups with collected responses cannot be deleted. Deactivate them instead."
                                                confirmLabel="Delete"
                                                onConfirm={(visit) =>
                                                    router.delete(
                                                        `/settings/survey-directories/respondent-groups/${group.id}`,
                                                        {
                                                            preserveScroll: true,
                                                            ...visit,
                                                        },
                                                    )
                                                }
                                            >
                                                <IconAction
                                                    label="Delete this group"
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 />
                                                </IconAction>
                                            </ConfirmPopover>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function toggleActive(group: RespondentGroup, visit?: ConfirmVisit) {
    router.put(
        `/settings/survey-directories/respondent-groups/${group.id}`,
        {
            label: group.label,
            requires_text: group.requires_text,
            is_active: !group.is_active,
        },
        { preserveScroll: true, ...visit },
    );
}

function RespondentGroupDialog({ group }: { group?: RespondentGroup }) {
    const [open, setOpen] = useState(false);
    const editing = group !== undefined;
    const form = useForm({
        label: group?.label ?? '',
        requires_text: group?.requires_text ?? false,
        is_active: group?.is_active ?? true,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                if (!editing) {
                    form.reset();
                }
            },
        };
        if (editing) {
            form.put(
                `/settings/survey-directories/respondent-groups/${group.id}`,
                options,
            );
        } else {
            form.post(
                '/settings/survey-directories/respondent-groups',
                options,
            );
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {editing ? (
                    <IconAction label={`Edit ${group.label}`}>
                        <Pencil />
                    </IconAction>
                ) : (
                    <Button>
                        <Plus />
                        Add group
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {editing
                            ? `Edit ${group.label}`
                            : 'Add respondent group'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="group-label">Name</Label>
                        <Input
                            id="group-label"
                            className="mt-1.5"
                            placeholder="e.g. Student"
                            value={form.data.label}
                            onChange={(event) =>
                                form.setData('label', event.target.value)
                            }
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {editing
                                ? `Stored with responses as ${group.value}, which never changes when you rename the group.`
                                : 'Shown to respondents on every survey. Add its follow-up questions once it is saved.'}
                        </p>
                        <InputError message={form.errors.label} />
                    </div>
                    <Label
                        htmlFor="group-requires-text"
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-normal"
                    >
                        <Checkbox
                            id="group-requires-text"
                            checked={form.data.requires_text}
                            onCheckedChange={(checked) =>
                                form.setData('requires_text', checked === true)
                            }
                        />
                        Ask respondents to type their own answer
                    </Label>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>
                            {editing ? 'Save changes' : 'Add group'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** A value for the "Others" choice that no other choice in the list uses. */
function freeValue(base: string, options: SurveyOption[]): string {
    let candidate = base;
    for (let suffix = 2; options.some((o) => o.value === candidate); suffix++) {
        candidate = `${base}-${suffix}`;
    }

    return candidate;
}

/**
 * The questions a group asks right after a respondent picks it, e.g.
 * Civilian → Occupation, with an "Others" choice that asks them to specify.
 * Saved as a whole; each question keeps its answer key once saved.
 */
function FollowUpsDialog({ group }: { group: RespondentGroup }) {
    const [open, setOpen] = useState(false);
    const form = useForm<{ follow_ups: FollowUpQuestion[] }>({
        follow_ups: group.follow_ups ?? [],
    });
    const errors = form.errors as Record<string, string | undefined>;
    const errorFor = (prefix: string) =>
        Object.entries(errors).find(([key]) => key.startsWith(prefix))?.[1];

    function openChange(next: boolean) {
        // Start from what is saved, so an abandoned edit never lingers.
        if (next) {
            form.setData('follow_ups', structuredClone(group.follow_ups ?? []));
            form.clearErrors();
        }
        setOpen(next);
    }

    function change(mutate: (questions: FollowUpQuestion[]) => void) {
        const questions = structuredClone(form.data.follow_ups);
        mutate(questions);
        form.setData('follow_ups', questions);
    }

    function move(index: number, to: number) {
        change((questions) => {
            const [question] = questions.splice(index, 1);
            questions.splice(to, 0, question);
        });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(`/settings/respondent-groups/${group.id}/follow-ups`, {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={openChange}>
            <DialogTrigger asChild>
                <IconAction label={`Follow-up questions for ${group.label}`}>
                    <ListTree />
                </IconAction>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        Follow-up questions: {group.label}
                    </DialogTitle>
                    <DialogDescription>
                        Asked right after a respondent chooses {group.label}, in
                        this order. Saving updates every open survey straight
                        away; there is no draft to publish.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    {form.data.follow_ups.length === 0 ? (
                        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                            No follow-up questions. Respondents in this group go
                            straight on to their region and institution.
                        </p>
                    ) : (
                        <ol className="divide-y rounded-lg border">
                            {form.data.follow_ups.map((question, index) => {
                                const regular = question.options.filter(
                                    (option) => !option.requires_text,
                                );
                                const other = question.options.find(
                                    (option) => option.requires_text,
                                );
                                const labelId = `follow-up-${group.id}-${index}-label`;

                                return (
                                    <li
                                        key={question.key ?? `new-${index}`}
                                        className="space-y-4 p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="min-w-0 flex-1">
                                                <Label htmlFor={labelId}>
                                                    Question {index + 1}
                                                </Label>
                                                <Input
                                                    id={labelId}
                                                    className="mt-1.5"
                                                    placeholder="e.g. Occupation"
                                                    value={question.label}
                                                    onChange={(event) =>
                                                        change((questions) => {
                                                            questions[
                                                                index
                                                            ].label =
                                                                event.target.value;
                                                        })
                                                    }
                                                />
                                                <p className="mt-1.5 text-xs text-muted-foreground">
                                                    {question.key
                                                        ? `Stored with responses as ${question.key}.`
                                                        : 'Its answer key is taken from this label when you save.'}
                                                </p>
                                                <InputError
                                                    message={
                                                        errors[
                                                            `follow_ups.${index}.label`
                                                        ]
                                                    }
                                                />
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1 pt-6">
                                                <IconAction
                                                    type="button"
                                                    label="Move question earlier"
                                                    disabled={index === 0}
                                                    onClick={() =>
                                                        move(index, index - 1)
                                                    }
                                                >
                                                    <ArrowUp />
                                                </IconAction>
                                                <IconAction
                                                    type="button"
                                                    label="Move question later"
                                                    disabled={
                                                        index ===
                                                        form.data.follow_ups
                                                            .length -
                                                            1
                                                    }
                                                    onClick={() =>
                                                        move(index, index + 1)
                                                    }
                                                >
                                                    <ArrowDown />
                                                </IconAction>
                                                <IconAction
                                                    type="button"
                                                    label="Remove this question"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        change((questions) =>
                                                            questions.splice(
                                                                index,
                                                                1,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <Trash2 />
                                                </IconAction>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                                            <div>
                                                <Label
                                                    htmlFor={`${labelId}-type`}
                                                >
                                                    Shown as
                                                </Label>
                                                <FormSelect
                                                    id={`${labelId}-type`}
                                                    className="mt-1.5"
                                                    value={question.type}
                                                    onChange={(value) =>
                                                        change((questions) => {
                                                            questions[
                                                                index
                                                            ].type =
                                                                value as FollowUpQuestion['type'];
                                                        })
                                                    }
                                                    placeholder="Dropdown"
                                                    options={[
                                                        {
                                                            value: 'select',
                                                            label: 'Dropdown',
                                                        },
                                                        {
                                                            value: 'radio',
                                                            label: 'Buttons (for a few short choices)',
                                                        },
                                                    ]}
                                                />
                                            </div>
                                            <Label
                                                htmlFor={`${labelId}-required`}
                                                className="inline-flex h-9 cursor-pointer items-center gap-2 text-sm font-normal"
                                            >
                                                <Checkbox
                                                    id={`${labelId}-required`}
                                                    checked={question.required}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        change((questions) => {
                                                            questions[
                                                                index
                                                            ].required =
                                                                checked ===
                                                                true;
                                                        })
                                                    }
                                                />
                                                Required
                                            </Label>
                                        </div>

                                        <div>
                                            <Label
                                                htmlFor={`${labelId}-choices`}
                                            >
                                                Choices
                                            </Label>
                                            <OptionLines
                                                id={`${labelId}-choices`}
                                                className={`mt-1.5 ${textareaClass}`}
                                                placeholder={
                                                    'Farmer\nTeacher\nBusiness owner'
                                                }
                                                options={regular}
                                                onChange={(text) =>
                                                    change((questions) => {
                                                        questions[
                                                            index
                                                        ].options = [
                                                            ...fromLines(
                                                                text,
                                                                regular,
                                                            ),
                                                            ...(other
                                                                ? [other]
                                                                : []),
                                                        ];
                                                    })
                                                }
                                            />
                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                One per line. Renaming a line
                                                keeps the answers already
                                                collected against it.
                                            </p>
                                            <InputError
                                                message={errorFor(
                                                    `follow_ups.${index}.options`,
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`${labelId}-other`}
                                                className="inline-flex cursor-pointer items-center gap-2 text-sm font-normal"
                                            >
                                                <Checkbox
                                                    id={`${labelId}-other`}
                                                    checked={Boolean(other)}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        change((questions) => {
                                                            const target =
                                                                questions[
                                                                    index
                                                                ];
                                                            target.options =
                                                                checked === true
                                                                    ? [
                                                                          ...target.options,
                                                                          {
                                                                              value: freeValue(
                                                                                  'others',
                                                                                  target.options,
                                                                              ),
                                                                              label: 'Others',
                                                                              requires_text: true,
                                                                          },
                                                                      ]
                                                                    : target.options.filter(
                                                                          (
                                                                              option,
                                                                          ) =>
                                                                              !option.requires_text,
                                                                      );
                                                        })
                                                    }
                                                />
                                                Add an &ldquo;Others&rdquo;
                                                choice that asks them to specify
                                            </Label>
                                            {other && (
                                                <div className="max-w-xs pl-6">
                                                    <Label
                                                        htmlFor={`${labelId}-other-label`}
                                                        className="text-xs font-normal text-muted-foreground"
                                                    >
                                                        Its label
                                                    </Label>
                                                    <Input
                                                        id={`${labelId}-other-label`}
                                                        className="mt-1"
                                                        value={other.label}
                                                        onChange={(event) =>
                                                            change(
                                                                (questions) => {
                                                                    const target =
                                                                        questions[
                                                                            index
                                                                        ].options.find(
                                                                            (
                                                                                option,
                                                                            ) =>
                                                                                option.requires_text,
                                                                        );
                                                                    if (
                                                                        target
                                                                    ) {
                                                                        target.label =
                                                                            event.target.value;
                                                                    }
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                            change((questions) =>
                                questions.push({
                                    label: '',
                                    type: 'select',
                                    required: true,
                                    options: [],
                                }),
                            )
                        }
                    >
                        <Plus />
                        Add question
                    </Button>
                    <InputError message={errors.follow_ups} />
                    <p className="text-xs text-muted-foreground">
                        Removing a question or choice that already has answers
                        hides it from new respondents. The answers already given
                        stay in the responses and exports.
                    </p>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save questions'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
