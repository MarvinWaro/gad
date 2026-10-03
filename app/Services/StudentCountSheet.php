<?php

namespace App\Services;

use App\Models\DisciplineGroup;
use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OpenSpout\Common\Entity\Cell;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Common\Exception\OpenSpoutException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Options as XlsxOptions;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use RuntimeException;

/**
 * Reads an enrollment or graduates file: the first sheet of an .xlsx (or a
 * .csv) with the columns Discipline Group, Male Count, Female Count and
 * Academic Year, as CHED RO XII's analyst lays them out. Only the file's
 * shape is checked here; which years and groups the rows name is checked by
 * App\Actions\Statistics\ReplaceStudentCounts, which an API can share.
 */
class StudentCountSheet
{
    /** The most rows a file may hold: every group for several years. */
    public const MAX_ROWS = 500;

    /** Problems listed before the rest are counted. */
    public const SHOWN_PROBLEMS = 5;

    /** The headings the template writes, as the analyst's files have them. */
    public const HEADINGS = ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'];

    /** Accepted headings for each column, lower case, punctuation as spaces. */
    private const COLUMNS = [
        'group' => ['discipline group', 'discipline groups', 'discipline', 'program', 'programs'],
        'male' => ['male count', 'male', 'males'],
        'female' => ['female count', 'female', 'females'],
        'academic_year' => ['academic year', 'ay', 'school year'],
    ];

    /**
     * @return list<array{row: int, group: string, male: int, female: int, academic_year: string}>
     *
     * @throws ValidationException on `file`
     */
    public function read(UploadedFile $file): array
    {
        $rows = $this->rows($file);
        $header = array_shift($rows);

        if ($header === null) {
            throw self::invalid(['The file is empty.']);
        }

        $columns = $this->columns($header['cells']);
        if ($columns === null) {
            throw self::invalid(['The first row needs the columns Discipline Group, Male Count, Female Count and Academic Year.']);
        }

        if ($rows === []) {
            throw self::invalid(['The file has no rows under its headings.']);
        }

        if (count($rows) > self::MAX_ROWS) {
            throw self::invalid([__('The file has more than :count rows.', ['count' => self::MAX_ROWS])]);
        }

        $problems = [];
        $parsed = [];
        foreach ($rows as ['number' => $number, 'cells' => $cells]) {
            $group = Str::squish($this->text($cells[$columns['group']] ?? null));
            $male = $this->count($cells[$columns['male']] ?? null);
            $female = $this->count($cells[$columns['female']] ?? null);
            $year = $this->academicYear($this->text($cells[$columns['academic_year']] ?? null));

            $rowProblems = array_filter([
                $group === '' ? 'the discipline group is blank' : null,
                $male === null ? 'Male Count must be a whole number, 0 or more' : null,
                $female === null ? 'Female Count must be a whole number, 0 or more' : null,
                $year === null ? 'Academic Year must read like 2025-2026' : null,
            ]);

            if ($rowProblems !== []) {
                $problems[] = __('Row :row: :problems.', ['row' => $number, 'problems' => implode('; ', $rowProblems)]);

                continue;
            }

            $parsed[] = ['row' => $number, 'group' => $group, 'male' => (int) $male, 'female' => (int) $female, 'academic_year' => (string) $year];
        }

        if ($problems !== []) {
            throw self::invalid($problems);
        }

        return $parsed;
    }

    /**
     * A blank file in the analyst's layout: the headings, then every
     * discipline group with the academic year filled in. Returns the path of
     * a temporary file, for the caller to send and delete.
     */
    public function template(string $academicYear): string
    {
        $path = tempnam(sys_get_temp_dir(), 'phlgadis-template-');
        if ($path === false) {
            throw new RuntimeException('Cannot create the template file.');
        }

        $options = new XlsxOptions;
        $options->setColumnWidth(48, 1);
        $options->setColumnWidth(14, 2, 3, 4);
        $writer = new XlsxWriter($options);
        $writer->openToFile($path);
        $writer->addRow(Row::fromValuesWithStyle(self::HEADINGS, new Style(fontBold: true)));
        foreach (DisciplineGroup::query()->orderBy('sort_order')->orderBy('id')->pluck('name') as $name) {
            $writer->addRow(Row::fromValues([$name, null, null, $academicYear]));
        }
        $writer->close();

        return $path;
    }

    /**
     * A 422 on `file` listing the first few problems and how many more, one
     * to a line: Inertia passes on only a field's first message.
     *
     * @param  list<string>  $problems
     */
    public static function invalid(array $problems): ValidationException
    {
        $shown = array_slice($problems, 0, self::SHOWN_PROBLEMS);
        $more = count($problems) - count($shown);

        if ($more > 0) {
            $shown[] = trans_choice('And :count more problem.|And :count more problems.', $more, ['count' => $more]);
        }

        return ValidationException::withMessages(['file' => implode("\n", $shown)]);
    }

    /**
     * The first sheet's non-empty rows, with their row numbers as the
     * spreadsheet shows them.
     *
     * @return list<array{number: int, cells: array<int, mixed>}>
     */
    private function rows(UploadedFile $file): array
    {
        $reader = Str::lower($file->getClientOriginalExtension()) === 'csv'
            ? new CsvReader
            : new XlsxReader;

        try {
            $reader->open((string) $file->getRealPath());
            $rows = [];

            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $number => $row) {
                    $cells = array_map(
                        fn (Cell $cell): mixed => $cell instanceof Cell\FormulaCell ? $cell->getComputedValue() : $cell->getValue(),
                        $row->cells,
                    );

                    if (array_filter($cells, fn (mixed $value): bool => $this->text($value) !== '') !== []) {
                        $rows[] = ['number' => (int) $number, 'cells' => $cells];
                    }

                    if (count($rows) > self::MAX_ROWS + 1) {
                        break;
                    }
                }

                break;
            }

            return $rows;
        } catch (OpenSpoutException) {
            throw self::invalid(['The file could not be read. Save it as an Excel workbook (.xlsx) or a CSV file and try again.']);
        } finally {
            $reader->close();
        }
    }

    /**
     * Where each column sits, or null when one is missing.
     *
     * @param  array<int, mixed>  $header
     * @return array{group: int, male: int, female: int, academic_year: int}|null
     */
    private function columns(array $header): ?array
    {
        $found = [];
        foreach ($header as $index => $value) {
            $heading = preg_replace('/[^a-z0-9]+/', ' ', Str::lower($this->text($value)));
            foreach (self::COLUMNS as $column => $names) {
                if (! isset($found[$column]) && in_array(trim((string) $heading), $names, true)) {
                    $found[$column] = $index;
                }
            }
        }

        if (! isset($found['group'], $found['male'], $found['female'], $found['academic_year'])) {
            return null;
        }

        return ['group' => $found['group'], 'male' => $found['male'], 'female' => $found['female'], 'academic_year' => $found['academic_year']];
    }

    private function text(mixed $value): string
    {
        return match (true) {
            is_string($value) => trim($value),
            is_int($value), is_float($value) => (string) $value,
            $value instanceof DateTimeInterface => $value->format('Y-m-d'),
            default => '',
        };
    }

    /** A whole number from 0 to 999,999,999, allowing "5,523"; null otherwise. */
    private function count(mixed $value): ?int
    {
        $text = is_float($value) && floor($value) === $value ? (string) (int) $value : str_replace([',', ' '], '', $this->text($value));

        return preg_match('/^\d{1,9}$/', $text) === 1 ? (int) $text : null;
    }

    /** "2025-2026" (or with an en dash or spaces) when the years follow on; null otherwise. */
    private function academicYear(string $value): ?string
    {
        if (preg_match('/^(\d{4})\s*[-–—\/]\s*(\d{4})$/u', $value, $matches) !== 1 || (int) $matches[2] !== (int) $matches[1] + 1) {
            return null;
        }

        return $matches[1].'-'.$matches[2];
    }
}
