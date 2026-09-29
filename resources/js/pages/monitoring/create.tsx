import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { Errors, Field, fieldClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';

export default function Create({ institution }: { institution: string }) {
    const year = new Date().getFullYear();
    const form = useForm({
        academic_year: `${year}-${year + 1}`,
        semester: '1',
    });
    return (
        <>
            <Head title="Monitoring Report" />
            <div className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-8">
                <Link
                    href="/records"
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
                        Complete your monitoring report, prepare a copy for
                        signatures, and submit it to CHED for review.
                    </p>
                </header>
                <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post('/monitoring');
                        }}
                        className="space-y-6 rounded-xl border bg-card p-5 sm:p-8"
                    >
                        <div>
                            <h2 className="text-xl font-medium">
                                Start or resume a report
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {institution}
                            </p>
                        </div>
                        <Errors errors={form.errors} />
                        <Field
                            label="Academic year"
                            id="academic-year"
                            error={form.errors.academic_year}
                        >
                            <input
                                id="academic-year"
                                className={fieldClass}
                                placeholder="2026-2027"
                                value={form.data.academic_year}
                                onChange={(e) =>
                                    form.setData(
                                        'academic_year',
                                        e.target.value.replace('–', '-'),
                                    )
                                }
                                required
                                aria-invalid={!!form.errors.academic_year}
                            />
                        </Field>
                        <Field label="Semester" id="semester">
                            <select
                                id="semester"
                                className={fieldClass}
                                value={form.data.semester}
                                onChange={(e) =>
                                    form.setData('semester', e.target.value)
                                }
                            >
                                <option value="1">First Semester</option>
                                <option value="2">Second Semester</option>
                            </select>
                        </Field>
                        <p className="text-sm text-muted-foreground">
                            One shared report per institution and semester. If a
                            report already exists, you’ll open it here.
                        </p>
                        <Button disabled={form.processing} type="submit">
                            {form.processing
                                ? 'Opening…'
                                : 'Continue to report'}
                            <ArrowRight className="size-4" />
                        </Button>
                    </form>
                    <aside className="self-start rounded-xl bg-signature-violet p-6 text-on-signature">
                        <FileText aria-hidden className="mb-5 size-7" />
                        <h2 className="text-lg font-medium">
                            Three steps to submit
                        </h2>
                        <ol className="mt-5 list-decimal space-y-4 pl-5 text-sm leading-relaxed">
                            <li>
                                Describe your institution’s actual situation
                                where you have information. Save and return when
                                needed.
                            </li>
                            <li>
                                Print the saved report for the President and GAD
                                Focal Person to sign.
                            </li>
                            <li>
                                Upload the signed PDF and submit. Follow its
                                review in Records.
                            </li>
                        </ol>
                    </aside>
                </div>
            </div>
        </>
    );
}
