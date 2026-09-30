import { router } from '@inertiajs/react';
import { FileText, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { HeiCombobox } from '@/components/hei-combobox';
import { fieldClass, selectClass } from '@/components/monitoring/shared';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { cn } from '@/lib/utils';
import type { DirectoryOption, ReportFilters } from '@/types/monitoring';

type PlaceKey = 'region' | 'cluster' | 'hei';

/** How long typing pauses before the search runs. */
const SEARCH_DELAY = 350;

/**
 * The filters of the Monitoring section's lists. They apply as soon as they
 * change, starting again from page 1; the search waits for a pause in typing.
 */
export function useRecordFilters(path: string, filters: ReportFilters) {
    const [values, setValues] = useState<ReportFilters>(filters);
    const [loading, setLoading] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => () => clearTimeout(searchTimer.current), []);

    function apply(next: ReportFilters) {
        clearTimeout(searchTimer.current);
        router.get(
            path,
            Object.fromEntries(
                Object.entries({ ...next, search: next.search?.trim() }).filter(
                    ([, value]) => value,
                ),
            ),
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    }

    function change(next: ReportFilters) {
        setValues(next);
        apply(next);
    }

    function search(text: string) {
        const next = { ...values, search: text };
        setValues(next);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => apply(next), SEARCH_DELAY);
    }

    /** Picking a place clears the places below it. */
    function pick(key: PlaceKey, value: string) {
        change({
            ...values,
            [key]: value,
            ...(key === 'region'
                ? { cluster: '', hei: '' }
                : key === 'cluster'
                  ? { hei: '' }
                  : {}),
        });
    }

    return {
        values,
        loading,
        filtered: Object.values(filters).some(Boolean),
        apply,
        change,
        search,
        pick,
    };
}

/**
 * The filter grid: one row when the card is wide enough; otherwise search on
 * its own row, then two to a row. `filters` counts the filters after search.
 */
export function FilterBar({
    label,
    filters,
    children,
}: {
    label: string;
    filters: number;
    children: ReactNode;
}) {
    return (
        <div
            role="group"
            aria-label={label}
            className={cn(
                'grid grid-cols-2 gap-3 border-b p-4 sm:p-5 @3xl:grid-cols-4 @7xl:auto-cols-fr @7xl:grid-flow-col @7xl:grid-cols-none',
                // Two to a row on phones; a filter left alone takes the whole
                // row so its text isn't cut.
                filters % 2 === 1 && '*:last:col-span-2 @3xl:*:last:col-span-1',
            )}
        >
            {children}
        </div>
    );
}

/** A filter's small label over its control. */
export function Filter({
    label,
    id,
    children,
}: {
    label: string;
    id: string;
    children: ReactNode;
}) {
    return (
        <div className="min-w-0">
            <label
                htmlFor={id}
                className="mb-1.5 block text-xs text-muted-foreground"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

export function SearchFilter({
    value,
    placeholder,
    onSearch,
    onSubmit,
}: {
    value: string;
    placeholder: string;
    onSearch: (text: string) => void;
    onSubmit: () => void;
}) {
    return (
        <form
            role="search"
            className="col-span-2 @3xl:col-span-1"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
            }}
        >
            <Filter label="Search" id="search">
                <div className="relative">
                    <Search
                        aria-hidden
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        id="search"
                        type="search"
                        autoComplete="off"
                        maxLength={150}
                        placeholder={placeholder}
                        className={cn(fieldClass, 'pl-9')}
                        value={value}
                        onChange={(event) => onSearch(event.target.value)}
                    />
                </div>
            </Filter>
        </form>
    );
}

export function YearFilter({
    value,
    years,
    onChange,
}: {
    value: string;
    years: string[];
    onChange: (value: string) => void;
}) {
    return (
        <Filter label="Academic year" id="year">
            <FormSelect
                id="year"
                className={selectClass}
                value={value}
                onChange={onChange}
                placeholder="All years"
                allowEmpty
                options={years.map((year) => ({ value: year, label: year }))}
            />
        </Filter>
    );
}

type PlaceOptions = {
    regions: DirectoryOption[];
    clusters: DirectoryOption[];
    heis: DirectoryOption[];
};

/** How many place filters show: a regional office has its one region. */
export function placeFilterCount(regions: DirectoryOption[]): number {
    return regions.length > 1 ? 3 : 2;
}

/**
 * Region (Central Office only), cluster and HEI. Each list fills once the
 * place above it is chosen.
 */
export function PlaceFilters({
    values,
    onPick,
    regions,
    clusters,
    heis,
}: PlaceOptions & {
    values: ReportFilters;
    onPick: (key: PlaceKey, value: string) => void;
}) {
    const pickRegion = regions.length > 1;
    const places: {
        key: PlaceKey;
        label: string;
        all: string;
        options: DirectoryOption[];
        /** The place that has to be chosen before this list fills. */
        parent?: PlaceKey;
    }[] = [
        ...(pickRegion
            ? [
                  {
                      key: 'region' as const,
                      label: 'Region',
                      all: 'All regions',
                      options: regions,
                  },
              ]
            : []),
        {
            key: 'cluster',
            label: 'Cluster',
            all: 'All clusters',
            options: clusters,
            parent: pickRegion ? 'region' : undefined,
        },
        {
            key: 'hei',
            label: 'HEI',
            all: 'All HEIs',
            options: heis,
            parent: 'cluster',
        },
    ];

    return places.map(({ key, label, all, options, parent }) => {
        const waiting =
            options.length === 0 && parent !== undefined && !values[parent];
        const placeholder = waiting ? `Choose a ${parent} first` : all;

        return (
            <Filter key={key} label={label} id={key}>
                {key === 'hei' ? (
                    <HeiCombobox
                        id={key}
                        className="rounded-md bg-background"
                        disabled={options.length === 0}
                        value={values.hei ?? ''}
                        onChange={(value) => onPick(key, value)}
                        options={options}
                        placeholder={placeholder}
                        allowClear
                        clearLabel={all}
                    />
                ) : (
                    <FormSelect
                        id={key}
                        className={selectClass}
                        disabled={options.length === 0}
                        value={values[key] ?? ''}
                        onChange={(value) => onPick(key, value)}
                        placeholder={placeholder}
                        allowEmpty
                        emptyLabel={all}
                        options={options.map((option) => ({
                            value: String(option.id),
                            label: option.name,
                        }))}
                    />
                )}
            </Filter>
        );
    });
}

/** Staff without an office see nothing; say so, and who can fix it. */
export function NoOfficeNotice({ noun }: { noun: string }) {
    return (
        <div
            role="status"
            className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 text-sm"
        >
            Your account has no office yet, so no {noun} are shown. A user
            manager can set your office in Settings → Users.
        </div>
    );
}

/** A list with nothing to show, and a way out when filters caused it. */
export function EmptyList({
    filtered,
    title,
    text,
    onClear,
}: {
    filtered: boolean;
    title: string;
    text: string;
    onClear: () => void;
}) {
    return (
        <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText
                    aria-hidden
                    className="size-5 text-muted-foreground"
                />
            </span>
            <h2 className="mt-4 font-medium">{title}</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {text}
            </p>
            {filtered && (
                <Button
                    type="button"
                    variant="outline"
                    className="mt-5"
                    onClick={onClear}
                >
                    Clear filters
                </Button>
            )}
        </div>
    );
}
