import { Head, Link, router, useForm } from '@inertiajs/react';
import { CircleCheck, Lock } from 'lucide-react';
import { useId } from 'react';
import type { FormEvent } from 'react';
import ChecklistController from '@/actions/App/Http/Controllers/ChecklistController';
import { ChecklistChoices } from '@/components/monitoring/checklist-items';
import { Field, localDate, selectClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type {
    ChecklistDefinition,
    ChecklistResponse,
} from '@/types/monitoring';

type Props = {
    checklist: ChecklistDefinition;
    academicYear: string;
    academicYears: string[];
    /** The HEI's answers to this checklist, newest year first. */
    history: ChecklistResponse[];
    canSubmit: boolean;
};

export default function Checklist({
    checklist,
    academicYear,
    academicYears,
    history,
    canSubmit,
}: Props) {
    const yearUrl = (year: string) =>
        ChecklistController.show.url(checklist.type, {
            query: { academic_year: year },
        });

    return (
        <>
            <Head title={checklist.name} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <header>
                    <p className="mb-2 text-sm text-muted-foreground">
                        Monitoring
                    </p>
                    <h1 className="text-3xl font-medium tracking-tight">
                        {checklist.name}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Answer once per academic year. Submitting again replaces
                        your earlier answers.
                    </p>
                </header>

                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
                    {/* A new year starts a fresh form with that year's answers. */}
                    <ChecklistForm
                        key={academicYear}
                        checklist={checklist}
                        academicYear={academicYear}
                        academicYears={academicYears}
                        response={
                            history.find(
                                (entry) => entry.academic_year === academicYear,
                            ) ?? null
                        }
                        canSubmit={canSubmit}
                        onYear={(year) =>
                            router.get(
                                ChecklistController.show.url(checklist.type),
                                { academic_year: year },
                                { preserveScroll: true, replace: true },
                            )
                        }
                    />

                    <aside
                        aria-labelledby="answers-heading"
                        className="rounded-xl border bg-card p-5"
                    >
                        <h2 id="answers-heading" className="font-medium">
                            Your answers
                        </h2>
                        {history.length ? (
                            <ul className="-mx-2 mt-3 space-y-0.5">
                                {history.map((entry) => {
                                    const current =
                                        entry.academic_year === academicYear;

                                    return (
                                        <li key={entry.id}>
                                            <Link
                                                href={yearUrl(
                                                    entry.academic_year,
                                                )}
                                                preserveScroll
                                                aria-current={
                                                    current ? 'page' : undefined
                                                }
                                                className={cn(
                                                    'flex min-h-11 flex-col justify-center rounded-md px-2 py-2 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                                    current && 'bg-muted',
                                                )}
                                            >
                                                <span className="flex items-center justify-between gap-3">
                                                    <span
                                                        className={cn(
                                                            'tabular-nums',
                                                            current &&
                                                                'font-medium',
                                                        )}
                                                    >
                                                        {entry.academic_year}
                                                    </span>
                                                    <span className="text-muted-foreground tabular-nums">
                                                        {entry.items.length} of{' '}
                                                        {checklist.items.length}
                                                    </span>
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {localDate(
                                                        entry.submitted_at,
                                                    )}
                                                </span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                                Nothing submitted yet.
                            </p>
                        )}
                    </aside>
                </div>
            </div>
        </>
    );
}

/** The old PHLGADIS checklist for one academic year. */
function ChecklistForm({
    checklist,
    academicYear,
    academicYears,
    response,
    canSubmit,
    onYear,
}: {
    checklist: ChecklistDefinition;
    academicYear: string;
    academicYears: string[];
    response: ChecklistResponse | null;
    canSubmit: boolean;
    onYear: (year: string) => void;
}) {
    const titleId = useId();
    const instructionId = useId();
    const form = useForm({
        academic_year: academicYear,
        items: response?.items ?? [],
    });
    // `items.*` errors come back per item.
    const itemsError = Object.entries(
        form.errors as Record<string, string>,
    ).find(([key]) => key.startsWith('items'))?.[1];

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(ChecklistController.store.url(checklist.type), {
            preserveScroll: true,
        });
    }

    return (
        <form
            aria-labelledby={titleId}
            onSubmit={submit}
            className="space-y-6 rounded-xl border bg-card p-5 sm:p-6"
        >
            <div>
                <h2 id={titleId} className="text-xl font-medium">
                    {checklist.title}
                </h2>
                <p
                    id={instructionId}
                    className="mt-2 text-sm text-muted-foreground"
                >
                    {checklist.instruction}
                </p>
            </div>

            <Field
                label="Academic year"
                id="academic-year"
                error={form.errors.academic_year}
            >
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <FormSelect
                        id="academic-year"
                        className={cn(selectClass, 'sm:w-64')}
                        value={academicYear}
                        onChange={onYear}
                        placeholder="Choose an academic year"
                        options={academicYears.map((year) => ({
                            value: year,
                            label: year,
                        }))}
                        aria-invalid={Boolean(form.errors.academic_year)}
                    />
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        {response ? (
                            <>
                                <CircleCheck
                                    aria-hidden
                                    className="size-4 shrink-0 text-brand"
                                />
                                <span>
                                    Submitted {localDate(response.submitted_at)}
                                    {response.submitted_by &&
                                        ` by ${response.submitted_by}`}
                                </span>
                            </>
                        ) : (
                            `Not answered yet for ${academicYear}.`
                        )}
                    </p>
                </div>
            </Field>

            {!canSubmit && (
                <div className="flex gap-3 rounded-xl border bg-muted/50 p-4 text-sm">
                    <Lock
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <div>
                        <p className="font-medium">View only</p>
                        <p className="mt-1 text-muted-foreground">
                            Your institution isn&rsquo;t active in the HEI
                            directory, so its answers can&rsquo;t be changed.
                        </p>
                    </div>
                </div>
            )}

            <fieldset aria-describedby={instructionId}>
                <legend className="sr-only">{checklist.title}</legend>
                <ChecklistChoices
                    items={checklist.items}
                    value={form.data.items}
                    onChange={(keys) => form.setData('items', keys)}
                    disabled={!canSubmit}
                />
                {itemsError && (
                    <p role="alert" className="mt-3 text-sm text-destructive">
                        {itemsError}
                    </p>
                )}
            </fieldset>

            {canSubmit && (
                <div className="flex justify-end border-t pt-5">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {response ? 'Update answers' : 'Submit'}
                    </Button>
                </div>
            )}
        </form>
    );
}
