import { Head } from '@inertiajs/react';
import { X } from 'lucide-react';
import { ActivityItem } from '@/components/activity/activity-entry';
import Heading from '@/components/heading';
import { fieldClass, selectClass } from '@/components/monitoring/shared';
import { Pagination } from '@/components/pagination';
import {
    EmptyList,
    Filter,
    FilterBar,
    NoOfficeNotice,
    PlaceFilters,
    placeFilterCount,
    SearchFilter,
    useRecordFilters,
} from '@/components/record-filters';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import type { FormSelectOption } from '@/components/ui/form-select';
import { cn } from '@/lib/utils';
import type { ActivityFilters, ActivityPage } from '@/types/activity';
import type { DirectoryOption } from '@/types/monitoring';

const emptyFilters: ActivityFilters = {
    search: '',
    module: '',
    action: '',
    user: '',
    from: '',
    to: '',
    region: '',
    hei: '',
};

export default function ActivityLogs({
    logs,
    filters,
    person,
    modules,
    actions,
    places,
    hasOffice,
}: {
    logs: ActivityPage;
    filters: ActivityFilters;
    /** The person the list is narrowed to. */
    person: { id: number; name: string } | null;
    modules: FormSelectOption[];
    actions: FormSelectOption[];
    places: {
        regions: DirectoryOption[];
        heis: DirectoryOption[];
    };
    hasOffice: boolean;
}) {
    const { values, loading, filtered, apply, change, search, pick } =
        useRecordFilters('/settings/activity-logs', filters);
    // Action, module and the two dates, then the places.
    const filterCount = 4 + placeFilterCount(places.regions);

    return (
        <>
            <Head title="Activity logs" />
            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Activity logs"
                    description="Who did what in PHLGADIS, and when: sign-ins, changes, approvals, submissions and exports in every module. Times are Philippine time."
                />

                {!hasOffice ? (
                    <NoOfficeNotice noun="activity logs" />
                ) : (
                    <>
                        <div className="@container overflow-hidden rounded-xl border bg-card">
                            <FilterBar
                                label="Filter activity logs"
                                filters={filterCount}
                            >
                                <SearchFilter
                                    value={values.search}
                                    placeholder="Name, record or IP"
                                    onSearch={search}
                                    onSubmit={() => apply(values)}
                                />
                                <Filter label="Action" id="action">
                                    <FormSelect
                                        id="action"
                                        className={selectClass}
                                        value={values.action}
                                        onChange={(action) =>
                                            change({ ...values, action })
                                        }
                                        placeholder="All actions"
                                        allowEmpty
                                        options={actions}
                                    />
                                </Filter>
                                <Filter label="Module" id="module">
                                    <FormSelect
                                        id="module"
                                        className={selectClass}
                                        value={values.module}
                                        onChange={(module) =>
                                            change({ ...values, module })
                                        }
                                        placeholder="All modules"
                                        allowEmpty
                                        options={modules}
                                    />
                                </Filter>
                                <Filter label="From" id="from">
                                    <input
                                        id="from"
                                        type="date"
                                        className={fieldClass}
                                        value={values.from}
                                        max={values.to || undefined}
                                        onChange={(event) =>
                                            change({
                                                ...values,
                                                from: event.target.value,
                                            })
                                        }
                                    />
                                </Filter>
                                <Filter label="To" id="to">
                                    <input
                                        id="to"
                                        type="date"
                                        className={fieldClass}
                                        value={values.to}
                                        min={values.from || undefined}
                                        onChange={(event) =>
                                            change({
                                                ...values,
                                                to: event.target.value,
                                            })
                                        }
                                    />
                                </Filter>
                                <PlaceFilters
                                    values={values}
                                    onPick={pick}
                                    {...places}
                                />
                            </FilterBar>
                            {person && filters.user && (
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm sm:px-5">
                                    <p>
                                        Showing the activity of{' '}
                                        <span className="font-medium">
                                            {person.name}
                                        </span>
                                    </p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            change({ ...values, user: '' })
                                        }
                                    >
                                        <X aria-hidden />
                                        Show everyone
                                    </Button>
                                </div>
                            )}
                            <p
                                role="status"
                                className="px-4 py-3 text-sm text-muted-foreground sm:px-5"
                            >
                                {loading
                                    ? 'Updating…'
                                    : `${logs.meta.total.toLocaleString('en-PH')} ${logs.meta.total === 1 ? 'entry' : 'entries'}`}
                            </p>
                        </div>

                        {logs.data.length === 0 ? (
                            <div className="rounded-xl border bg-card">
                                <EmptyList
                                    filtered={filtered}
                                    title={
                                        filtered
                                            ? 'No activity matches these filters'
                                            : 'No activity yet'
                                    }
                                    text={
                                        filtered
                                            ? 'Try another action, module, person or date range.'
                                            : 'Sign-ins and changes will appear here as people use PHLGADIS.'
                                    }
                                    onClear={() => apply(emptyFilters)}
                                />
                            </div>
                        ) : (
                            <ol
                                aria-label="Activity, newest first"
                                aria-busy={loading}
                                className={cn(
                                    'motion-safe:transition-opacity',
                                    loading && 'opacity-60',
                                )}
                            >
                                {logs.data.map((entry, index) => (
                                    <ActivityItem
                                        key={entry.id}
                                        entry={entry}
                                        last={index === logs.data.length - 1}
                                        onPerson={(id) =>
                                            change({
                                                ...values,
                                                user: String(id),
                                            })
                                        }
                                    />
                                ))}
                            </ol>
                        )}

                        <Pagination
                            page={logs.meta}
                            label="entries"
                            className="rounded-xl border bg-card"
                        />
                    </>
                )}
            </div>
        </>
    );
}
