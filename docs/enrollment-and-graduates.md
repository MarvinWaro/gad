# Enrollment and graduates

PHLGADIS keeps sex-disaggregated enrollment and graduate counts by **discipline group**: how many women and men a region enrolled, or saw graduate, in one academic year. CHED's enrollment and graduate APIs are not available yet, so each regional office imports its own figures from the analyst's files. The old PHLGADIS called this "Sex Count".

**Where things live**

| Piece              | File                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tables             | `discipline_groups`, `student_counts` (migration `2026_10_04_000000_create_student_counts_tables.php`)                             |
| Models             | `DisciplineGroup`, `StudentCount`; `App\Enums\StudentCountKind` (`enrollment`, `graduates`)                                        |
| Reading a file     | `App\Services\StudentCountSheet` (also writes the template)                                                                        |
| Saving (the rules) | `App\Actions\Statistics\ReplaceStudentCounts`                                                                                      |
| Figures            | `App\Support\StudentStatistics`: the Settings page, the dashboard and the homepage                                                 |
| Controller (thin)  | `Settings\StudentCountController`, with `StudentCountFilterRequest`, `ImportStudentCountsRequest` and `DeleteStudentCountsRequest` |
| Page               | `resources/js/pages/settings/student-counts.tsx` and `components/student-counts/`                                                  |

## The data

- **`student_counts`:** one row per kind, region, academic year (`academic_year_id`, from Settings → Academic years) and discipline group, with `male` and `female`. Totals are added up when read, never stored. The unique key is those four columns.
- **`discipline_groups`:** CHED's groups in the analyst's order. The migration adds the 18 in the files of 2026-10-03 (Agricultural, Forestry, and Fisheries … Social and Behavioral Sciences). An import adds any other group a file names.
- **Regional totals.** The figures belong to a region, never an HEI, so they cannot narrow to one HEI. Per-HEI figures wait for the API.
- **Enrollment is one figure per academic year.** The analyst's first-semester file stands for the year, as in the old system; importing the year again replaces it.

## Who and where

Settings → Statistics → **Enrollment & graduates** (`/settings/student-counts`).

| Permission              | Allows                        | Seeded for     |
| ----------------------- | ----------------------------- | -------------- |
| `student-counts.view`   | the page, and the template    | Administrators |
| `student-counts.import` | importing a file              | Administrators |
| `student-counts.delete` | deleting one year of one kind | Administrators |

Other roles can be given them in Settings → Roles & permissions.

**Place follows the office.** A regional office imports, reads and deletes its own region's figures, whatever region a request names. The Central Office names the region when it imports or deletes, and reads every region added up until it picks one. An account without an office cannot import.

## Importing a file

**The layout.** The first sheet of an Excel workbook (`.xlsx`) or a CSV file, up to 2 MB and 500 rows. The first non-empty row holds the headings, in any order and any case:

| Column           | Also accepted       | Values                                      |
| ---------------- | ------------------- | ------------------------------------------- |
| Discipline Group | Discipline, Program | The group's name                            |
| Male Count       | Male                | A whole number, 0 or more ("5,523" is fine) |
| Female Count     | Female              | The same                                    |
| Academic Year    | AY, School Year     | Like `2025-2026` (an en dash is fine)       |

Blank rows are skipped. "Template" on the page downloads a workbook with the headings, every group and the current academic year.

**Matching a group.** Names are compared by their words, ignoring case and punctuation ("IT-RELATED" is "IT-Related"; "&" is "and"):

1. the same words;
2. otherwise the one group whose name starts with them, so the old system's short names ("Agricultural", "Criminal Justice", "Education") join today's groups;
3. otherwise a new group, at the end of the list, named as written (title-cased when written in capitals). The success message names it.

**All or nothing.** A file with any problem is refused whole, and the dialog lists the first five ("Row 4: Male Count must be a whole number, 0 or more.") and how many more. The problems are:

- a missing column, no rows, or more than 500
- a blank group, a count that isn't a whole number of 0 or more, or a year that doesn't read like `2025-2026`
- a year missing from Settings → Academic years
- a group listed twice for the same year

**Replace, by year.** Each academic year in the file replaces what the region had for that kind and year: its rows are deleted and the file's inserted, in one transaction. Other years, the other kind and other regions are untouched.

**Records.** Each import is logged as "Imported AY 2025-2026 enrollment for Regional Office XII" (module Enrollment and graduates, placed in the region), with the file name, the row count and any new groups. Deleting a year is logged too. A year or region that holds figures cannot be deleted, and a year that holds figures cannot be relabelled.

## Where the figures show

- **Settings page:** one kind, year and place: totals, female and male shares, and the table by group.
- **Staff dashboard:** "Who studies, who graduates." (`docs/dashboard.md`).
- **Homepage:** the statistics section, by year, for every region added up or the one picked in its Region select (`docs/homepage.md`). Each copy is cached for 10 minutes and cleared on every import and delete.

## API

`ReplaceStudentCounts::import($kind, $region, $rows)` takes plain rows (`group`, `male`, `female`, `academic_year`, and `row` for messages). A future `POST /api/v1/student-counts`, behind token authentication and the same permissions, can send JSON rows to it. `StudentStatistics` already returns plain arrays for a read endpoint.
