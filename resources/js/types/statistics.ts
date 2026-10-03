/** What a sex-disaggregated student count counts (App\Enums\StudentCountKind). */
export type StudentCountKind = 'enrollment' | 'graduates';

/** Women and men in one discipline group, added up over the regions in view. */
export type DisciplineFigures = {
    id: number;
    name: string;
    male: number;
    female: number;
};

/** One kind's figures on the dashboard: the newest year up to the one in view. */
export type StudentYearFigures = {
    academic_year: string;
    /** An earlier year than the one in view, the latest imported. */
    latest: boolean;
    male: number;
    female: number;
    previous: { academic_year: string; male: number; female: number } | null;
    groups: DisciplineFigures[];
    regions: string[];
};

export type DashboardStudents = {
    /** An HEI or ownership is chosen; the figures are regional totals. */
    heisOnly: boolean;
    enrollment: StudentYearFigures | null;
    graduates: StudentYearFigures | null;
};
