import { useForm } from '@inertiajs/react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { selectClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { formatFileSize } from '@/lib/file-size';
import { importMethod, template } from '@/routes/settings/student-counts';
import type { DirectoryOption } from '@/types/monitoring';
import type { StudentCountKind } from '@/types/statistics';

const MAX_BYTES = 2 * 1024 * 1024;

type ImportForm = { kind: StudentCountKind; region: string; file: File | null };

/**
 * "Import file": an enrollment or graduates workbook for one region. The
 * server reads it whole or not at all, and lists the rows it could not use.
 */
export function ImportDialog({
    kind,
    kinds,
    region,
    regions,
    nationalAccess,
}: {
    kind: StudentCountKind;
    kinds: { value: StudentCountKind; label: string }[];
    /** The region in view, which a Central Office import starts from. */
    region: string;
    regions: DirectoryOption[];
    nationalAccess: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const id = useId();
    const form = useForm<ImportForm>({ kind, region, file: null });
    // Several problems arrive as one message, a line each.
    const problems = (fileError ?? form.errors.file)?.split('\n') ?? [];

    function reset(next: boolean) {
        setOpen(next);
        if (next) {
            form.setData({ kind, region, file: null });
            form.clearErrors();
            setFileError(null);
        }
    }

    function choose(file: File | undefined) {
        form.clearErrors('file');
        if (!file) {
            return;
        }

        if (!/\.(xlsx|csv)$/i.test(file.name)) {
            setFileError('Choose an Excel workbook (.xlsx) or a CSV file.');
        } else if (file.size > MAX_BYTES) {
            setFileError('The file must be 2 MB or smaller.');
        } else {
            setFileError(null);
            form.setData('file', file);
        }

        if (input.current) {
            input.current.value = '';
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.data.file) {
            setFileError('Choose the file to import.');

            return;
        }

        form.post(importMethod.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        });
    }

    return (
        <Dialog open={open} onOpenChange={reset}>
            <DialogTrigger asChild>
                <Button>
                    <Upload />
                    Import file
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={submit} className="space-y-5" noValidate>
                    <DialogHeader>
                        <DialogTitle>
                            Import enrollment or graduates
                        </DialogTitle>
                        <DialogDescription>
                            The first sheet, with the columns Discipline Group,
                            Male Count, Female Count and Academic Year. Each
                            year in the file replaces that year&rsquo;s figures
                            for the region.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor={`${id}-kind`}>
                                What the file holds
                            </Label>
                            <FormSelect
                                id={`${id}-kind`}
                                className={selectClass}
                                value={form.data.kind}
                                onChange={(value) =>
                                    form.setData(
                                        'kind',
                                        value as StudentCountKind,
                                    )
                                }
                                placeholder="Choose"
                                options={kinds}
                            />
                        </div>
                        {nationalAccess && (
                            <div className="space-y-2">
                                <Label htmlFor={`${id}-region`}>Region</Label>
                                <FormSelect
                                    id={`${id}-region`}
                                    className={selectClass}
                                    value={form.data.region}
                                    onChange={(value) =>
                                        form.setData('region', value)
                                    }
                                    placeholder="Choose a region"
                                    aria-invalid={Boolean(form.errors.region)}
                                    aria-describedby={
                                        form.errors.region
                                            ? `${id}-region-error`
                                            : undefined
                                    }
                                    options={regions.map((option) => ({
                                        value: String(option.id),
                                        label: option.name,
                                    }))}
                                />
                                {form.errors.region && (
                                    <p
                                        id={`${id}-region-error`}
                                        className="text-sm text-destructive"
                                    >
                                        {form.errors.region}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm leading-none font-medium">File</p>
                        <input
                            ref={input}
                            id={`${id}-file`}
                            type="file"
                            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            className="sr-only"
                            tabIndex={-1}
                            aria-hidden
                            onChange={(event) =>
                                choose(event.target.files?.[0])
                            }
                        />
                        {form.data.file ? (
                            <div className="flex items-center gap-3 rounded-lg border p-3">
                                <FileSpreadsheet
                                    aria-hidden
                                    className="size-5 shrink-0 text-muted-foreground"
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {form.data.file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(form.data.file.size)}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => form.setData('file', null)}
                                    disabled={form.processing}
                                >
                                    <X />
                                    <span className="sr-only">
                                        Remove {form.data.file.name}
                                    </span>
                                </Button>
                            </div>
                        ) : (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => input.current?.click()}
                            >
                                <FileSpreadsheet />
                                Choose a workbook or CSV
                            </Button>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Excel (.xlsx) or CSV, up to 2 MB.{' '}
                            <a
                                href={template.url()}
                                className="font-medium text-foreground underline underline-offset-4"
                            >
                                Download the template
                            </a>
                        </p>
                        {problems.length > 0 && (
                            <div
                                role="alert"
                                className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
                            >
                                {problems.length === 1 ? (
                                    <p>{problems[0]}</p>
                                ) : (
                                    <>
                                        <p className="font-medium">
                                            Nothing was imported. Fix these rows
                                            and try again:
                                        </p>
                                        <ul className="mt-1.5 list-disc space-y-1 pl-5">
                                            {problems.map((problem) => (
                                                <li key={problem}>{problem}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner />}
                            Import
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
