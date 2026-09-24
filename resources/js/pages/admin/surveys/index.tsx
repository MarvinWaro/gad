import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Archive,
    ClipboardList,
    ExternalLink,
    Eye,
    FilePenLine,
    Plus,
    Trash2,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { IconAction } from '@/components/icon-action';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Survey = {
    id: number;
    code: string;
    slug: string;
    title: string;
    law_title: string;
    status: string;
    publication_status: 'Draft' | 'Published' | 'Archived';
    draft_version: number | null;
    published_version: number | null;
    responses_count: number;
    public_url: string | null;
};
// Same status language as the users table: live is emerald, unpublished work
// is amber, retired is muted.
const publicationBadges: Record<Survey['publication_status'], string> = {
    Published:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    Draft: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
    Archived: 'bg-muted text-muted-foreground',
};

type Permissions = {
    create: boolean;
    update: boolean;
    publish: boolean;
    delete: boolean;
    responses: boolean;
};

export default function SurveyIndex({
    surveys,
    permissions,
}: {
    surveys: Survey[];
    permissions: Permissions;
}) {
    return (
        <>
            <Head title="Survey management" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Surveys
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Build, version, publish, and review anonymous GAD
                            surveys. Nothing reaches the public site until a
                            draft is published.
                        </p>
                    </div>
                    {permissions.create && <CreateSurveyDialog />}
                </div>
                <Card className="gap-0 py-0">
                    <CardHeader className="border-b py-5">
                        <CardTitle>Survey library</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {surveys.length === 0 ? (
                            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                                <ClipboardList className="size-8 text-muted-foreground" />
                                <h2 className="mt-4 font-medium">
                                    No surveys yet
                                </h2>
                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    Create a survey to start a draft
                                    questionnaire, then publish it when the
                                    questions and directories are ready.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-sm">
                                    <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                                        <tr>
                                            <th className="px-5 py-3">
                                                Survey
                                            </th>
                                            <th className="px-5 py-3">
                                                Status
                                            </th>
                                            <th className="px-5 py-3">
                                                Versions
                                            </th>
                                            <th className="px-5 py-3">
                                                Responses
                                            </th>
                                            <th className="px-5 py-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {surveys.map((survey) => (
                                            <tr key={survey.id}>
                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {survey.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {survey.law_title}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <Badge
                                                        variant="secondary"
                                                        className={
                                                            publicationBadges[
                                                                survey
                                                                    .publication_status
                                                            ]
                                                        }
                                                    >
                                                        {
                                                            survey.publication_status
                                                        }
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 text-xs">
                                                    <p>
                                                        Editing draft v
                                                        {survey.draft_version ??
                                                            '—'}
                                                    </p>
                                                    <p className="mt-0.5 text-muted-foreground">
                                                        {survey.published_version
                                                            ? `Live: v${survey.published_version}`
                                                            : 'Nothing live yet'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {survey.responses_count}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <IconAction
                                                            asChild
                                                            label={`Edit the draft for ${survey.title}`}
                                                        >
                                                            <Link
                                                                href={`/admin/surveys/${survey.id}/edit`}
                                                            >
                                                                <FilePenLine />
                                                            </Link>
                                                        </IconAction>
                                                        {survey.public_url && (
                                                            <IconAction
                                                                asChild
                                                                label="Open the live public page"
                                                            >
                                                                <a
                                                                    href={
                                                                        survey.public_url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <ExternalLink />
                                                                </a>
                                                            </IconAction>
                                                        )}
                                                        {permissions.responses && (
                                                            <IconAction
                                                                asChild
                                                                label={`View ${survey.responses_count} collected ${survey.responses_count === 1 ? 'response' : 'responses'}`}
                                                            >
                                                                <Link
                                                                    href={`/admin/surveys/${survey.id}/responses`}
                                                                >
                                                                    <Eye />
                                                                </Link>
                                                            </IconAction>
                                                        )}
                                                        {permissions.publish && (
                                                            <IconAction
                                                                label={
                                                                    survey.publication_status ===
                                                                    'Archived'
                                                                        ? 'Restore this survey so the public can reach it'
                                                                        : 'Archive this survey and close it to the public'
                                                                }
                                                                onClick={() =>
                                                                    router.patch(
                                                                        `/admin/surveys/${survey.id}/archive`,
                                                                        {},
                                                                        {
                                                                            preserveScroll: true,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                <Archive />
                                                            </IconAction>
                                                        )}
                                                        {permissions.delete &&
                                                            !survey.published_version && (
                                                                <IconAction
                                                                    label="Delete this draft permanently"
                                                                    className="text-muted-foreground hover:text-destructive"
                                                                    onClick={() =>
                                                                        confirm(
                                                                            `Delete ${survey.title}? It has never been published, so this cannot be undone.`,
                                                                        ) &&
                                                                        router.delete(
                                                                            `/admin/surveys/${survey.id}`,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 />
                                                                </IconAction>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function CreateSurveyDialog() {
    const [open, setOpen] = useState(false);
    const form = useForm({ code: '', title: '', law_title: '', slug: '' });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/admin/surveys', { onSuccess: () => setOpen(false) });
    }
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus />
                    New survey
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create survey draft</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    {(['code', 'title', 'law_title', 'slug'] as const).map(
                        (field) => (
                            <div key={field}>
                                <Label htmlFor={field}>
                                    {field === 'law_title'
                                        ? 'Law title'
                                        : field.charAt(0).toUpperCase() +
                                          field.slice(1)}
                                </Label>
                                <Input
                                    id={field}
                                    value={form.data[field]}
                                    onChange={(e) =>
                                        form.setData(field, e.target.value)
                                    }
                                    className="mt-1"
                                />
                                <InputError message={form.errors[field]} />
                            </div>
                        ),
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button disabled={form.processing}>Create draft</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
