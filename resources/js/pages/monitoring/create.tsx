import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, FileText } from 'lucide-react';
import type { FormEvent } from 'react';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import {
    Field,
    fieldClass,
    localDate,
    periodLabel,
    StagePill,
} from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { stageOf } from '@/lib/monitoring-draft';
import type { AcademicPeriod, MonitoringReport } from '@/types/monitoring';

export default function Create({
    institution,
    period,
    academicYears,
    openReports,
}: {
    institution: string | null;
    period: AcademicPeriod;
    academicYears: string[];
    openReports: MonitoringReport[];
}) {
    const form = useForm({
        academic_year: period.academic_year,
        semester: String(period.semester),
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(MonitoringController.store.url());
    }

    return (
        <>
            <Head title="Monitoring report" />
            <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8">
                <Link
                    href={MonitoringController.records.url()}
                    className="inline-flex min-h-11 items-center gap-2 text-sm underline-offset-4 hover:underline"
                >
                    <ArrowLeft className="size-4" />
                    Records
                </Link>
                <header>
                    <p className="mb-2 text-sm text-muted-foreground">
                        Institutional reporting
                    </p>
                    <h1 className="text-3xl font-medium tracking-tight">
                        Your GAD work, on record.
                    </h1>
                    <p className="mt-3 max-w-2xl text-muted-foreground">
                        Fill in the monitoring report here, print it for
                        signing, and send the signed copy to CHED for review.
                    </p>
                </header>

                {openReports.length > 0 && (
                    <section
                        aria-labelledby="open-heading"
                        className="space-y-3"
                    >
                        <h2 id="open-heading" className="text-lg font-medium">
                            Continue where you left off
                        </h2>
                        <ul className="grid gap-3 sm:grid-cols-2">
                            {openReports.map((report) => (
                                <li key={report.id}>
                                    <Link
                                        href={MonitoringController.show.url(
                                            report.id,
                                        )}
                                        className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                        <span className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-medium">
                                                {periodLabel(report)}
                                            </span>
                                            <StagePill
                                                stage={stageOf(report)}
                                            />
                                        </span>
                                        <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                                            Updated{' '}
                                            {localDate(report.updated_at)}
                                            <ArrowUpRight
                                                aria-hidden
                                                className="size-4 shrink-0"
                                            />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
                    <form
                        onSubmit={submit}
                        className="space-y-6 rounded-xl border bg-card p-5 sm:p-8"
                    >
                        <div>
                            <h2 className="text-xl font-medium">
                                Start or open a report
                            </h2>
                            {institution && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {institution}
                                </p>
                            )}
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                label="Academic year"
                                id="academic-year"
                                error={form.errors.academic_year}
                            >
                                <select
                                    id="academic-year"
                                    className={fieldClass}
                                    value={form.data.academic_year}
                                    onChange={(event) =>
                                        form.setData(
                                            'academic_year',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={Boolean(
                                        form.errors.academic_year,
                                    )}
                                >
                                    {academicYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Semester"
                                id="semester"
                                error={form.errors.semester}
                            >
                                <select
                                    id="semester"
                                    className={fieldClass}
                                    value={form.data.semester}
                                    onChange={(event) =>
                                        form.setData(
                                            'semester',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="1">First Semester</option>
                                    <option value="2">Second Semester</option>
                                </select>
                            </Field>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your institution shares one report per semester. If
                            a colleague already started it, you&rsquo;ll pick up
                            from their answers.
                        </p>
                        <Button disabled={form.processing} type="submit">
                            {form.processing && <Spinner />}
                            Continue to report
                            <ArrowRight />
                        </Button>
                    </form>
                    <aside className="self-start rounded-xl bg-signature-violet p-6 text-on-signature">
                        <FileText aria-hidden className="mb-5 size-7" />
                        <h2 className="text-lg font-medium">
                            Three steps to submit
                        </h2>
                        <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-relaxed">
                            <li>
                                Describe your institution&rsquo;s actual
                                situation for each requirement. Answers save as
                                you type.
                            </li>
                            <li>
                                Finalize the report, then print the PDF for the
                                President and the GAD Focal Person to sign.
                            </li>
                            <li>
                                Upload the signed PDF and submit it. Follow its
                                review in Records.
                            </li>
                        </ol>
                    </aside>
                </div>
            </div>
        </>
    );
}
