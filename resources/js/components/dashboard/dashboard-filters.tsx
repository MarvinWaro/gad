import { selectClass } from '@/components/monitoring/shared';
import {
    Filter,
    FilterBar,
    PlaceFilters,
    placeFilterCount,
    useRecordFilters,
} from '@/components/record-filters';
import { FormSelect } from '@/components/ui/form-select';
import { academicMonths } from '@/lib/dashboard';
import { dashboard } from '@/routes';
import type { DashboardFilters, DashboardProps } from '@/types/dashboard';

const views = [
    { value: 'year', label: 'Whole year' },
    { value: 'semester', label: 'Semester' },
    { value: 'month', label: 'Month' },
];

const semesters = [
    { value: '1', label: '1st semester · Aug–Dec' },
    { value: '2', label: '2nd semester · Jan–Jul' },
];

/** The period's filters, as any statistics page carries them. */
export type PeriodValues = Pick<
    DashboardFilters,
    'academic_year' | 'view' | 'semester' | 'month'
>;

/** How many filters the period shows: a semester or month adds one. */
export function periodFilterCount(values: PeriodValues): number {
    return values.view === 'year' ? 2 : 3;
}

/**
 * The academic year, then View by, then the semester or month it asks for.
 * Shared by the dashboard, the Surveys page's insights and a survey's
 * Summary.
 */
export function PeriodFilters<T extends PeriodValues>({
    values,
    filters,
    academicYears,
    change,
}: {
    values: T;
    /** As the server read them, for the choice it made when left empty. */
    filters: PeriodValues;
    academicYears: string[];
    change: (next: T) => void;
}) {
    const set = (key: keyof PeriodValues, value: string) =>
        change({ ...values, [key]: value });

    return (
        <>
            <Filter label="Academic year" id="academic-year">
                <FormSelect
                    id="academic-year"
                    className={selectClass}
                    value={values.academic_year}
                    onChange={(value) => set('academic_year', value)}
                    placeholder="Academic year"
                    options={academicYears.map((year) => ({
                        value: year,
                        label: year,
                    }))}
                />
            </Filter>
            <Filter label="View by" id="view">
                <FormSelect
                    id="view"
                    className={selectClass}
                    value={values.view}
                    onChange={(value) =>
                        change({
                            ...values,
                            view: value as DashboardFilters['view'],
                            semester: '',
                            month: '',
                        })
                    }
                    placeholder="Whole year"
                    options={views}
                />
            </Filter>
            {values.view === 'semester' && (
                <Filter label="Semester" id="semester">
                    <FormSelect
                        id="semester"
                        className={selectClass}
                        // Left empty, the server picks one; show what it picked.
                        value={values.semester || filters.semester}
                        onChange={(value) => set('semester', value)}
                        placeholder="Semester"
                        options={semesters}
                    />
                </Filter>
            )}
            {values.view === 'month' && (
                <Filter label="Month" id="month">
                    <FormSelect
                        id="month"
                        className={selectClass}
                        value={values.month || filters.month}
                        onChange={(value) => set('month', value)}
                        placeholder="Month"
                        options={academicMonths}
                    />
                </Filter>
            )}
        </>
    );
}

/**
 * The dashboard's filters: the period first (academic year, then a semester
 * or month), then the places the account may pick, ownership and law. They
 * apply as soon as they change, like the record lists' filters. The Surveys
 * page's insights use them too, at their own address.
 */
export function DashboardFilterBar({
    filters,
    options,
    url = dashboard.url(),
}: Pick<DashboardProps, 'filters' | 'options'> & {
    /** Where the filters apply; the dashboard by default. */
    url?: string;
}) {
    const { values, change, pick } = useRecordFilters<DashboardFilters>(
        url,
        filters,
    );
    const set = (key: keyof DashboardFilters, value: string) =>
        change({ ...values, [key]: value });
    const count =
        periodFilterCount(values) + placeFilterCount(options.regions) + 2;

    return (
        <div className="@container overflow-hidden rounded-xl border bg-card">
            <FilterBar
                label="Reporting filters"
                filters={count}
                className="border-b-0"
            >
                <PeriodFilters
                    values={values}
                    filters={filters}
                    academicYears={options.academicYears}
                    change={change}
                />
                <PlaceFilters
                    values={values}
                    onPick={pick}
                    regions={options.regions}
                    heis={options.heis}
                />
                <Filter label="Ownership" id="ownership">
                    <FormSelect
                        id="ownership"
                        className={selectClass}
                        value={values.ownership}
                        onChange={(value) => set('ownership', value)}
                        placeholder="Public and private"
                        allowEmpty
                        emptyLabel="Public and private"
                        options={options.ownerships.map((ownership) => ({
                            value: ownership,
                            label:
                                ownership === 'public' ? 'Public' : 'Private',
                        }))}
                    />
                </Filter>
                <Filter label="Law survey" id="survey">
                    <FormSelect
                        id="survey"
                        className={selectClass}
                        value={values.survey}
                        onChange={(value) => set('survey', value)}
                        placeholder="All law surveys"
                        allowEmpty
                        emptyLabel="All law surveys"
                        options={options.surveys.map((survey) => ({
                            value: String(survey.id),
                            label: survey.code,
                        }))}
                    />
                </Filter>
            </FilterBar>
        </div>
    );
}
