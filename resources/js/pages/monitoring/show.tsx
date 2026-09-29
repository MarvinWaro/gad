import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Download,
    FileCheck2,
    Printer,
    Save,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    Errors,
    Field,
    fieldClass,
    localDate,
    panelClass,
    Status,
} from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { MonitoringReport, MonitoringRevision } from '@/types/monitoring';

export default function Show({
    report,
    backUrl,
}: {
    report: MonitoringReport;
    backUrl: string;
}) {
    return <ReportView report={report} backUrl={backUrl} />;
}

function ReportView({
    report,
    backUrl,
}: {
    report: MonitoringReport;
    backUrl: string;
}) {
    const [selected, setSelected] = useState(report.revisions[0].id);
    useEffect(
        () => setSelected(report.revisions[0].id),
        [report.revisions[0].id],
    );
    const revision =
        report.revisions.find((item) => item.id === selected) ??
        report.revisions[0];
    const editable =
        report.can_edit &&
        revision.id === report.revisions[0].id &&
        !revision.submitted_at;
    const [dirty, setDirty] = useState(false);
    return (
        <>
            <Head title={`Monitoring · ${report.academic_year}`} />
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-8">
                <Link
                    href={backUrl}
                    className="inline-flex min-h-11 items-center gap-2 text-sm hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    {backUrl === '/records' ? 'Records' : 'Monitoring Reports'}
                </Link>
                <header className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="mb-2 text-sm text-muted-foreground">
                            {revision.institution?.name ??
                                report.institution_name}
                        </p>
                        <h1 className="text-3xl font-medium tracking-tight">
                            Monitoring report
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                            <span>
                                {report.academic_year} ·{' '}
                                {report.semester === 1 ? 'First' : 'Second'}{' '}
                                Semester
                            </span>
                            <Status status={report.status} />
                        </div>
                    </div>
                    <Button variant="outline" disabled={dirty} asChild={!dirty}>
                        {dirty ? (
                            <span>
                                <Printer />
                                Save before printing
                            </span>
                        ) : (
                            <a
                                href={`/monitoring/${report.id}/revisions/${revision.id}/print`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Printer />
                                Print / Save PDF
                                <span className="sr-only">
                                    {' '}
                                    (opens in a new tab)
                                </span>
                            </a>
                        )}
                    </Button>
                </header>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                        Revision {revision.number}
                        {revision.submitted_at
                            ? ` · Submitted ${localDate(revision.submitted_at)}`
                            : ' · Draft'}{' '}
                        · Philippine time
                    </p>
                    {report.revisions.length > 1 && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="revision" className="text-sm">
                                History
                            </label>
                            <select
                                id="revision"
                                className={fieldClass}
                                disabled={dirty}
                                value={selected}
                                onChange={(e) => setSelected(e.target.value)}
                            >
                                {report.revisions.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        Revision {item.number}
                                        {item.submitted_at
                                            ? ' · Submitted'
                                            : ' · Draft'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                {report.status === 'returned' && (
                    <div className="bg-signature-cream rounded-xl border p-5">
                        <h2 className="font-medium">Returned for correction</h2>
                        <p className="mt-2 text-sm whitespace-pre-wrap">
                            {
                                report.revisions
                                    .flatMap((item) => item.reviews)
                                    .find(
                                        (item) => item.decision === 'returned',
                                    )?.comment
                            }
                        </p>
                        <p className="mt-2 text-sm">
                            Update the draft and attach a newly signed PDF
                            before resubmitting. Previous submissions remain in
                            History.
                        </p>
                    </div>
                )}
                <Editor
                    key={revision.id}
                    report={report}
                    revision={revision}
                    editable={editable}
                    onDirty={setDirty}
                />
            </div>
        </>
    );
}

function Editor({
    report,
    revision,
    editable,
    onDirty,
}: {
    report: MonitoringReport;
    revision: MonitoringRevision;
    editable: boolean;
    onDirty: (dirty: boolean) => void;
}) {
    const items = revision.template.sections.flatMap(
        (section) => section.items,
    );
    const form = useForm({
        lock_version: report.lock_version,
        address: revision.address,
        accomplished_on: revision.accomplished_on,
        president_name: revision.president_name,
        focal_person_name: revision.focal_person_name,
        answers: Object.fromEntries(
            items.map((item) => [item.key, revision.answers[item.key] ?? '']),
        ),
    });
    const [leaving, setLeaving] = useState<string | null>(null);
    const [allowLeave, setAllowLeave] = useState(false);
    const errors = usePage().props.errors as Record<string, string>;
    const entered = items.filter((item) =>
        form.data.answers[item.key]?.trim(),
    ).length;
    const sectionIds = [
        'details',
        ...revision.template.sections.map(
            (section) => `section-${section.key}`,
        ),
        'signatures',
    ];
    const [activeSection, setActiveSection] = useState('details');
    const navRef = useRef<HTMLElement>(null);
    useEffect(() => {
        form.setData('lock_version', report.lock_version);
        form.setDefaults({ ...form.data, lock_version: report.lock_version });
        // The editor remounts when the selected revision changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [report.lock_version]);
    useEffect(() => {
        const update = () => {
            let visible = sectionIds[0];
            for (const id of sectionIds) {
                const element = document.getElementById(id);
                if (element && element.getBoundingClientRect().top <= 180)
                    visible = id;
            }
            setActiveSection(visible);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
        // Section IDs are fixed within a revision.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revision.id]);
    useEffect(() => {
        const link = navRef.current?.querySelector<HTMLElement>(
            `[href="#${activeSection}"]`,
        );
        if (link && window.matchMedia('(max-width: 1023px)').matches) {
            link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }, [activeSection]);
    const navClass = (id: string) =>
        `block max-w-[calc(100vw-2rem)] shrink-0 rounded-md border-l-2 px-3 py-2 text-sm lg:max-w-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeSection === id ? 'border-brand bg-brand-soft font-medium text-brand' : 'border-transparent hover:bg-muted'}`;
    useEffect(() => {
        onDirty(editable && form.isDirty);
    }, [editable, form.isDirty, onDirty]);
    useEffect(() => {
        if (!editable || !form.isDirty || allowLeave) return;
        const unload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', unload);
        const remove = router.on('before', (event) => {
            if (event.detail.visit.method === 'get') {
                event.preventDefault();
                setLeaving(event.detail.visit.url.href);
            }
        });
        return () => {
            window.removeEventListener('beforeunload', unload);
            remove();
        };
    }, [editable, form.isDirty, allowLeave]);
    useEffect(() => {
        if (allowLeave && leaving) router.visit(leaving);
    }, [allowLeave, leaving]);
    return (
        <>
            <Errors errors={errors} />
            {errors.lock_version && (
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Reload latest report
                </Button>
            )}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                <aside className="contents lg:sticky lg:top-24 lg:block lg:min-w-0 lg:space-y-5">
                    <div className={panelClass}>
                        <p className="text-sm font-medium">
                            {entered} of {items.length} responses entered
                        </p>
                        <div
                            role="progressbar"
                            aria-label="Responses entered"
                            aria-valuenow={entered}
                            aria-valuemin={0}
                            aria-valuemax={items.length}
                            className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                        >
                            <div
                                className="h-full rounded-full bg-brand"
                                style={{
                                    width: `${(entered / items.length) * 100}%`,
                                }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            You can leave any response blank.
                        </p>
                    </div>
                    <nav
                        ref={navRef}
                        aria-label="Report sections"
                        className="sticky top-16 z-20 flex min-w-0 gap-2 overflow-x-auto rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur lg:static lg:block lg:space-y-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
                    >
                        <a
                            className={navClass('details')}
                            href="#details"
                            aria-current={
                                activeSection === 'details'
                                    ? 'location'
                                    : undefined
                            }
                            onClick={() => setActiveSection('details')}
                        >
                            Institution details
                        </a>
                        {revision.template.sections.map((section, index) => (
                            <a
                                key={section.key}
                                href={`#section-${section.key}`}
                                className={navClass(`section-${section.key}`)}
                                aria-current={
                                    activeSection === `section-${section.key}`
                                        ? 'location'
                                        : undefined
                                }
                                onClick={() =>
                                    setActiveSection(`section-${section.key}`)
                                }
                            >
                                {section.number ?? index + 1}. {section.title}
                            </a>
                        ))}
                        <a
                            className={navClass('signatures')}
                            href="#signatures"
                            aria-current={
                                activeSection === 'signatures'
                                    ? 'location'
                                    : undefined
                            }
                            onClick={() => setActiveSection('signatures')}
                        >
                            Signatories & submission
                        </a>
                    </nav>
                </aside>
                <div className="min-w-0 space-y-6">
                    <form
                        id="monitoring-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!editable) return;
                            form.put(`/monitoring/${report.id}`, {
                                preserveScroll: true,
                                onSuccess: () => form.setDefaults(),
                            });
                        }}
                        className="space-y-6"
                    >
                        <section
                            id="details"
                            className={`${panelClass} scroll-mt-40 space-y-5 lg:scroll-mt-24`}
                        >
                            <div>
                                <h2 className="text-xl font-medium">
                                    Institution details
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {revision.template.title}
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {revision.template.subtitle}
                                </p>
                            </div>
                            <Field label="Name of HEI" id="hei-name">
                                <input
                                    id="hei-name"
                                    className={fieldClass}
                                    value={
                                        revision.institution?.name ??
                                        report.institution_name
                                    }
                                    readOnly
                                />
                            </Field>
                            <Field
                                label="Address"
                                id="address"
                                error={errors.address}
                            >
                                <textarea
                                    id="address"
                                    className={fieldClass}
                                    rows={3}
                                    readOnly={!editable}
                                    value={form.data.address}
                                    onChange={(e) =>
                                        form.setData('address', e.target.value)
                                    }
                                    maxLength={2000}
                                    aria-invalid={!!errors.address}
                                    aria-describedby={
                                        errors.address
                                            ? 'address-error'
                                            : undefined
                                    }
                                />
                            </Field>
                            <Field
                                label="Date Accomplished"
                                id="accomplished_on"
                                error={errors.accomplished_on}
                            >
                                <input
                                    type="date"
                                    id="accomplished_on"
                                    className={fieldClass}
                                    readOnly={!editable}
                                    value={form.data.accomplished_on}
                                    onChange={(e) =>
                                        form.setData(
                                            'accomplished_on',
                                            e.target.value,
                                        )
                                    }
                                    aria-invalid={!!errors.accomplished_on}
                                />
                            </Field>
                            {revision.institution && (
                                <p className="text-sm text-muted-foreground">
                                    {revision.institution.region} ·{' '}
                                    {revision.institution.cluster}
                                </p>
                            )}
                        </section>
                        <p className="text-sm text-muted-foreground">
                            Please state actual situations per item. If a
                            requirement does not apply, you may explain why. You
                            may leave responses blank.
                        </p>
                        {revision.template.sections.map((section, index) => (
                            <section
                                key={section.key}
                                id={`section-${section.key}`}
                                className={`${panelClass} scroll-mt-40 space-y-6 lg:scroll-mt-24`}
                            >
                                <header className="flex items-start gap-3">
                                    <span
                                        aria-hidden
                                        className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm text-brand"
                                    >
                                        {section.number ?? index + 1}
                                    </span>
                                    <h2
                                        id={`heading-${section.key}`}
                                        className="pt-1 text-lg font-medium"
                                    >
                                        {section.title}
                                    </h2>
                                </header>
                                {section.key === 'gfps' &&
                                    revision.legacy_overview?.trim() && (
                                        <aside className="rounded-lg border bg-muted p-4 text-sm">
                                            <p className="font-medium">
                                                Earlier GFPS overview answer
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                This answer came from the
                                                earlier form. It is preserved
                                                here so you can copy it into an
                                                appropriate subitem.
                                            </p>
                                            <p className="mt-3 whitespace-pre-wrap">
                                                {revision.legacy_overview}
                                            </p>
                                        </aside>
                                    )}
                                {section.key === 'opportunity' &&
                                    revision.legacy_opportunity?.trim() && (
                                        <aside className="rounded-lg border bg-muted p-4 text-sm">
                                            <p className="font-medium">
                                                Earlier Equal Opportunity answer
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                This combined answer came from
                                                the earlier form. It is
                                                preserved here so you can copy
                                                the relevant parts into hiring
                                                and admissions.
                                            </p>
                                            <p className="mt-3 whitespace-pre-wrap">
                                                {revision.legacy_opportunity}
                                            </p>
                                        </aside>
                                    )}
                                {section.items.map((item) => (
                                    <Field
                                        key={item.key}
                                        label={
                                            section.standalone
                                                ? 'Actual situation'
                                                : section.number
                                                  ? `${String.fromCharCode(97 + section.items.indexOf(item))}. ${item.label}`
                                                  : item.label
                                        }
                                        id={item.key}
                                        error={errors[`answers.${item.key}`]}
                                    >
                                        {item.detail && (
                                            <p
                                                id={`${item.key}-detail`}
                                                className="text-sm whitespace-pre-line text-muted-foreground"
                                            >
                                                {item.detail}
                                            </p>
                                        )}
                                        <textarea
                                            id={item.key}
                                            rows={4}
                                            className={`${fieldClass} leading-relaxed`}
                                            value={form.data.answers[item.key]}
                                            onChange={(e) =>
                                                form.setData('answers', {
                                                    ...form.data.answers,
                                                    [item.key]: e.target.value,
                                                })
                                            }
                                            readOnly={!editable}
                                            maxLength={20000}
                                            aria-invalid={
                                                !!errors[`answers.${item.key}`]
                                            }
                                            aria-label={
                                                section.standalone
                                                    ? `${section.title}: actual situation`
                                                    : undefined
                                            }
                                            aria-describedby={
                                                [
                                                    item.detail
                                                        ? `${item.key}-detail`
                                                        : '',
                                                    errors[
                                                        `answers.${item.key}`
                                                    ]
                                                        ? `${item.key}-error`
                                                        : '',
                                                ]
                                                    .filter(Boolean)
                                                    .join(' ') || undefined
                                            }
                                            placeholder={
                                                editable
                                                    ? 'Describe the actual situation at your institution…'
                                                    : undefined
                                            }
                                        />
                                    </Field>
                                ))}
                            </section>
                        ))}
                        <section
                            id="signatures"
                            className={`${panelClass} scroll-mt-40 space-y-5 lg:scroll-mt-24`}
                        >
                            <h2 className="text-xl font-medium">Signatories</h2>
                            <p className="text-sm text-muted-foreground">
                                These names appear under the signature lines in
                                your printed report.
                            </p>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {(
                                    [
                                        {
                                            key: 'president_name',
                                            label: 'President',
                                        },
                                        {
                                            key: 'focal_person_name',
                                            label: 'GAD Focal Person',
                                        },
                                    ] as const
                                ).map(({ key, label }) => (
                                    <Field
                                        key={key}
                                        label={label}
                                        id={key}
                                        error={errors[key]}
                                    >
                                        <input
                                            id={key}
                                            className={fieldClass}
                                            maxLength={255}
                                            value={form.data[key]}
                                            onChange={(e) =>
                                                form.setData(
                                                    key,
                                                    e.target.value,
                                                )
                                            }
                                            readOnly={!editable}
                                            aria-invalid={!!errors[key]}
                                        />
                                    </Field>
                                ))}
                            </div>
                        </section>
                        {editable && (
                            <div className="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
                                <p
                                    role="status"
                                    className="text-sm text-muted-foreground"
                                >
                                    {form.processing
                                        ? 'Saving…'
                                        : form.isDirty
                                          ? 'Unsaved changes'
                                          : `Saved · ${localDate(report.updated_at)}`}
                                </p>
                                <Button
                                    type="submit"
                                    disabled={form.processing || !form.isDirty}
                                >
                                    <Save />
                                    Save draft
                                </Button>
                            </div>
                        )}
                    </form>
                    <Submission
                        report={report}
                        revision={revision}
                        editable={editable}
                        dirty={form.isDirty}
                    />
                    {revision.reviews.length > 0 && (
                        <section className={`${panelClass} space-y-4`}>
                            <h2 className="text-lg font-medium">
                                Review history
                            </h2>
                            {revision.reviews.map((review) => (
                                <article
                                    key={review.id}
                                    className="border-t pt-4"
                                >
                                    <p className="text-sm font-medium">
                                        {review.decision === 'returned'
                                            ? 'Returned for correction'
                                            : 'Reviewed'}{' '}
                                        · {review.reviewer}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {localDate(review.created_at)}
                                    </p>
                                    {review.comment && (
                                        <p className="mt-3 text-sm whitespace-pre-wrap">
                                            {review.comment}
                                        </p>
                                    )}
                                </article>
                            ))}
                        </section>
                    )}
                    {report.can_review &&
                        revision.id === report.revisions[0].id && (
                            <Review report={report} />
                        )}
                </div>
            </div>
            <Dialog
                open={!!leaving}
                onOpenChange={(open) => {
                    if (!open) setLeaving(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave with unsaved changes?</DialogTitle>
                        <DialogDescription>
                            Your latest edits have not been saved. Stay here to
                            save them before leaving.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLeaving(null)}
                        >
                            Keep editing
                        </Button>
                        <Button onClick={() => setAllowLeave(true)}>
                            Leave without saving
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Submission({
    report,
    revision,
    editable,
    dirty,
}: {
    report: MonitoringReport;
    revision: MonitoringRevision;
    editable: boolean;
    dirty: boolean;
}) {
    const upload = useForm<{ lock_version: number; file: File | null }>({
        lock_version: report.lock_version,
        file: null,
    });
    const submit = useForm({
        lock_version: report.lock_version,
        confirmed: false,
    });
    useEffect(() => {
        upload.setData('lock_version', report.lock_version);
        submit.setData('lock_version', report.lock_version);
        // Keep both forms in sync after a report mutation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [report.lock_version]);
    useEffect(() => {
        if (dirty) submit.setData('confirmed', false);
        // A changed answer or signatory invalidates confirmation.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dirty]);
    return (
        <section className={`${panelClass} space-y-5`}>
            <div className="flex items-start gap-3">
                <FileCheck2 aria-hidden className="mt-1 size-6 text-brand" />
                <div>
                    <h2 className="text-xl font-medium">Signed report</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {editable
                            ? 'Save your answers, print the report for both signatures, then attach the signed PDF. Changes to the report require a new signed copy.'
                            : 'The signed document is retained with this revision.'}
                    </p>
                </div>
            </div>
            {revision.attachment && (
                <a
                    className="flex min-h-11 items-center gap-2 rounded-lg border p-3 text-sm underline underline-offset-4"
                    href={revision.attachment.url}
                >
                    <Download aria-hidden className="size-4 shrink-0" />
                    <span className="min-w-0 break-all">
                        {revision.attachment.name}
                    </span>
                    <span className="ml-auto shrink-0 text-xs">
                        {(revision.attachment.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                </a>
            )}
            {editable && (
                <>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            upload.post(`/monitoring/${report.id}/attachment`, {
                                preserveScroll: true,
                                onSuccess: () => upload.reset('file'),
                            });
                        }}
                        className="space-y-3"
                    >
                        <Field
                            label={
                                revision.attachment
                                    ? 'Replace signed PDF'
                                    : 'Upload signed PDF'
                            }
                            id="signed-pdf"
                            error={upload.errors.file}
                        >
                            <input
                                type="file"
                                id="signed-pdf"
                                accept="application/pdf,.pdf"
                                className={`${fieldClass} file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-foreground`}
                                disabled={dirty || upload.processing}
                                onChange={(e) => {
                                    if (revision.attachment)
                                        submit.setData('confirmed', false);
                                    upload.setData(
                                        'file',
                                        e.target.files?.[0] ?? null,
                                    );
                                }}
                                aria-describedby="pdf-help"
                            />
                        </Field>
                        <p
                            id="pdf-help"
                            className="text-xs text-muted-foreground"
                        >
                            PDF only, up to 20 MB.{' '}
                            {dirty
                                ? 'Save your changes before uploading.'
                                : 'Attach the signed copy before submitting.'}
                        </p>
                        {upload.progress && (
                            <p role="status" className="text-sm">
                                Uploading {upload.progress.percentage}%
                            </p>
                        )}
                        <Button
                            type="submit"
                            variant="outline"
                            disabled={
                                dirty || !upload.data.file || upload.processing
                            }
                        >
                            {upload.processing ? 'Uploading…' : 'Attach PDF'}
                        </Button>
                    </form>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit.post(`/monitoring/${report.id}/submit`, {
                                preserveScroll: true,
                            });
                        }}
                        className="space-y-4 border-t pt-5"
                    >
                        <label className="flex items-start gap-3 text-sm leading-relaxed">
                            <input
                                type="checkbox"
                                className="mt-1 size-4 shrink-0 accent-primary"
                                checked={submit.data.confirmed}
                                onChange={(e) =>
                                    submit.setData(
                                        'confirmed',
                                        e.target.checked,
                                    )
                                }
                            />
                            I confirm that this PDF is signed by the President
                            and GAD Focal Person and matches the current report
                            answers.
                        </label>
                        <p className="text-xs text-muted-foreground">
                            Submitting locks this revision. CHED can return it
                            with comments if corrections are needed.
                        </p>
                        <Button
                            type="submit"
                            disabled={
                                dirty ||
                                !revision.attachment ||
                                !submit.data.confirmed ||
                                submit.processing
                            }
                        >
                            <Check />
                            {submit.processing
                                ? 'Submitting…'
                                : 'Submit for review'}
                        </Button>
                    </form>
                </>
            )}
            {!editable && !revision.attachment && (
                <p className="text-sm text-muted-foreground">
                    No signed PDF attached to this revision.
                </p>
            )}
        </section>
    );
}

function Review({ report }: { report: MonitoringReport }) {
    const form = useForm({
        lock_version: report.lock_version,
        decision: 'reviewed',
        comment: '',
    });
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.post(`/admin/monitoring/${report.id}/review`, {
                    preserveScroll: true,
                });
            }}
            className={`${panelClass} space-y-5`}
        >
            <h2 className="text-xl font-medium">CHED review</h2>
            <p className="text-sm text-muted-foreground">
                Review the answers and signed PDF. Marking a report reviewed
                records this review; it does not certify legal compliance.
            </p>
            <Field label="Decision" id="decision">
                <select
                    id="decision"
                    className={fieldClass}
                    value={form.data.decision}
                    onChange={(e) => form.setData('decision', e.target.value)}
                >
                    <option value="reviewed">Mark reviewed</option>
                    <option value="returned">Return for correction</option>
                </select>
            </Field>
            <Field
                label={
                    form.data.decision === 'returned'
                        ? 'Correction notes (required)'
                        : 'Review notes (optional)'
                }
                id="review-comment"
                error={form.errors.comment}
            >
                <textarea
                    id="review-comment"
                    rows={4}
                    className={fieldClass}
                    value={form.data.comment}
                    onChange={(e) => form.setData('comment', e.target.value)}
                    required={form.data.decision === 'returned'}
                    maxLength={10000}
                />
            </Field>
            <Button type="submit" disabled={form.processing}>
                {form.processing ? 'Saving review…' : 'Save review decision'}
            </Button>
        </form>
    );
}
