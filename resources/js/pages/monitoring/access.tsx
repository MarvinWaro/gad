import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Errors, fieldClass, Pagination } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import type { DirectoryOption } from '@/types/monitoring';

type Reviewer = {
    id: number;
    name: string;
    email: string;
    national_access: boolean;
    regions: number[];
};
type Props = {
    users: {
        data: Reviewer[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    regions: DirectoryOption[];
    search: string;
};
export default function Access({ users, regions, search }: Props) {
    const [query, setQuery] = useState(search);
    return (
        <>
            <Head title="Monitoring reviewer access" />
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
                <Link
                    href="/admin/monitoring"
                    className="inline-flex min-h-11 items-center text-sm underline"
                >
                    Monitoring Reports
                </Link>
                <header>
                    <h1 className="text-3xl font-medium">Reviewer access</h1>
                    <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                        Choose the regions each monitoring reviewer can access.
                        National access covers all regions. These assignments
                        apply only to monitoring reports.
                    </p>
                </header>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.get('/admin/monitoring/access', {
                            search: query,
                        });
                    }}
                    className="flex flex-wrap items-end gap-3"
                >
                    <div className="flex-1">
                        <label
                            htmlFor="reviewer-search"
                            className="mb-2 block text-sm"
                        >
                            Search reviewers
                        </label>
                        <input
                            id="reviewer-search"
                            className={fieldClass}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">Search</Button>
                </form>
                <p className="text-sm text-muted-foreground">
                    Only users with the monitoring view permission are listed.
                    Role permissions control whether they can review.
                </p>
                {users.data.map((user) => (
                    <ReviewerCard
                        key={`${user.id}-${user.national_access}-${user.regions.join(',')}`}
                        user={user}
                        regions={regions}
                    />
                ))}
                {!users.data.length && (
                    <p className="rounded-lg border border-dashed p-8 text-center text-sm">
                        No matching reviewers.
                    </p>
                )}
                <Pagination
                    prev={users.prev_page_url}
                    next={users.next_page_url}
                    page={users.current_page}
                    last={users.last_page}
                />
            </div>
        </>
    );
}
function ReviewerCard({
    user,
    regions,
}: {
    user: Reviewer;
    regions: DirectoryOption[];
}) {
    const form = useForm({
        national_access: user.national_access,
        regions: user.regions,
    });
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.put(`/admin/monitoring/access/${user.id}`, {
                    preserveScroll: true,
                });
            }}
            className="space-y-5 rounded-xl border bg-card p-5"
        >
            <div>
                <h2 className="text-lg font-medium">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Errors errors={form.errors} />
            <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
                <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.data.national_access}
                    onChange={(e) =>
                        form.setData('national_access', e.target.checked)
                    }
                />
                National access — all regions
            </label>
            <fieldset
                disabled={form.data.national_access}
                className="disabled:opacity-50"
            >
                <legend className="mb-3 text-sm font-medium">
                    Assigned regions
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                    {regions.map((region) => (
                        <label
                            key={region.id}
                            className="flex min-h-11 items-center gap-3 text-sm"
                        >
                            <input
                                type="checkbox"
                                className="size-4 shrink-0 accent-primary"
                                checked={form.data.regions.includes(region.id)}
                                onChange={(e) =>
                                    form.setData(
                                        'regions',
                                        e.target.checked
                                            ? [...form.data.regions, region.id]
                                            : form.data.regions.filter(
                                                  (id) => id !== region.id,
                                              ),
                                    )
                                }
                            />
                            {region.name}
                        </label>
                    ))}
                </div>
            </fieldset>
            <div className="flex items-center gap-3">
                <Button
                    type="submit"
                    variant="outline"
                    disabled={form.processing || !form.isDirty}
                >
                    Save access
                </Button>
                <p role="status" className="text-xs text-muted-foreground">
                    {form.isDirty ? 'Unsaved changes' : 'Saved assignments'}
                </p>
            </div>
        </form>
    );
}
