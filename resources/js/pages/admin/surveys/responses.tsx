import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Download, Eye, Search, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Row = {
    id: number;
    reference: string;
    version: number;
    age: number;
    sex: string;
    respondent_group: string;
    respondent_group_other: string | null;
    region: string;
    cluster: string;
    hei: string;
    submitted_at: string;
    expires_at: string;
};
type Paginated = {
    data: Row[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};

export default function Responses({
    survey,
    responses,
    filters,
    permissions,
}: {
    survey: { id: number; code: string; title: string };
    responses: Paginated;
    filters: Record<string, string>;
    permissions: { export: boolean; delete: boolean };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    function submit(e: FormEvent) {
        e.preventDefault();
        router.get(
            `/admin/surveys/${survey.id}/responses`,
            search ? { search } : {},
            { preserveState: true, replace: true },
        );
    }
    return (
        <>
            <Head title={`${survey.code} responses`} />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <Button asChild variant="ghost" className="-ml-3">
                        <Link href="/admin/surveys">
                            <ArrowLeft />
                            Back to surveys
                        </Link>
                    </Button>
                    <div className="mt-3 flex justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">
                                {survey.code} responses
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Individual responses are restricted to
                                authorized administrators.
                            </p>
                        </div>
                        {permissions.export && (
                            <Button asChild variant="outline">
                                <a
                                    href={`/admin/surveys/${survey.id}/responses/export${search ? `?search=${encodeURIComponent(search)}` : ''}`}
                                >
                                    <Download />
                                    Export CSV
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
                <Card className="gap-0 py-0">
                    <CardHeader className="flex-row items-center justify-between border-b py-5">
                        <CardTitle>{responses.total} responses</CardTitle>
                        <form onSubmit={submit} className="flex gap-2">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search reference"
                            />
                            <Button variant="outline" size="icon">
                                <Search />
                                <span className="sr-only">Search</span>
                            </Button>
                        </form>
                    </CardHeader>
                    <CardContent className="p-0">
                        {responses.data.length === 0 ? (
                            <div className="p-12 text-center text-sm text-muted-foreground">
                                No responses found.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[950px] text-left text-sm">
                                    <thead className="border-b bg-muted/50 text-xs">
                                        <tr>
                                            <th className="px-5 py-3">
                                                Reference
                                            </th>
                                            <th className="px-5 py-3">
                                                Respondent
                                            </th>
                                            <th className="px-5 py-3">
                                                Institution
                                            </th>
                                            <th className="px-5 py-3">
                                                Submitted
                                            </th>
                                            <th className="px-5 py-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {responses.data.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-5 py-4">
                                                    <p className="font-mono font-medium">
                                                        {row.reference}
                                                    </p>
                                                    <Badge
                                                        variant="outline"
                                                        className="mt-1"
                                                    >
                                                        Version {row.version}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4">
                                                    Age {row.age} · {row.sex}
                                                    <p className="text-xs text-muted-foreground">
                                                        {row.respondent_group_other ??
                                                            row.respondent_group}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {row.hei}
                                                    <p className="text-xs text-muted-foreground">
                                                        {row.region} ·{' '}
                                                        {row.cluster}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4 text-xs">
                                                    {new Date(
                                                        row.submitted_at,
                                                    ).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            asChild
                                                            variant="ghost"
                                                            size="icon"
                                                        >
                                                            <Link
                                                                href={`/admin/surveys/${survey.id}/responses/${row.id}`}
                                                            >
                                                                <Eye />
                                                                <span className="sr-only">
                                                                    View{' '}
                                                                    {
                                                                        row.reference
                                                                    }
                                                                </span>
                                                            </Link>
                                                        </Button>
                                                        {permissions.delete && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    confirm(
                                                                        'Permanently delete this response?',
                                                                    ) &&
                                                                    router.delete(
                                                                        `/admin/surveys/${survey.id}/responses/${row.id}`,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 />
                                                                <span className="sr-only">
                                                                    Delete{' '}
                                                                    {
                                                                        row.reference
                                                                    }
                                                                </span>
                                                            </Button>
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
