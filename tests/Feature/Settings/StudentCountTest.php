<?php

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\StudentCountKind;
use App\Models\AcademicYear;
use App\Models\ActivityLog;
use App\Models\DisciplineGroup;
use App\Models\StudentCount;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\StudentStatistics;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $this->otherRegion = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $this->admin = User::factory()->regionalOffice($this->region)->create();
    $this->admin->assignRole('admin');
});

/**
 * An enrollment or graduates file as the analyst saves it: a heading row,
 * then one row per discipline group.
 *
 * @param  list<list<mixed>>  $rows
 * @param  list<mixed>  $headings
 */
function studentSheet(array $rows, string $extension = 'xlsx', array $headings = ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year']): UploadedFile
{
    $path = tempnam(sys_get_temp_dir(), 'student-sheet-');

    if ($extension === 'csv') {
        $handle = fopen($path, 'w');
        foreach ([$headings, ...$rows] as $row) {
            fputcsv($handle, $row, escape: '');
        }
        fclose($handle);
    } else {
        $writer = new Writer;
        $writer->openToFile($path);
        foreach ([$headings, ...$rows] as $row) {
            $writer->addRow(Row::fromValues($row));
        }
        $writer->close();
    }

    return new UploadedFile($path, "figures.{$extension}", null, null, true);
}

/** @return array<string, int> each group's male count, by name */
function storedMales(StudentCountKind $kind, SurveyRegion $region, string $year): array
{
    return StudentCount::query()
        ->join('discipline_groups', 'discipline_groups.id', '=', 'student_counts.discipline_group_id')
        ->where('kind', $kind)
        ->where('survey_region_id', $region->id)
        ->where('academic_year_id', AcademicYear::query()->where('label', $year)->value('id'))
        ->pluck('student_counts.male', 'discipline_groups.name')
        ->all();
}

test('a regional office imports the analyst\'s enrollment file into its own region', function () {
    $file = studentSheet([
        ['AGRICULTURAL, FORESTRY, AND FISHERIES', 5523, 5318, '2025-2026'],
        ['ARCHITECTURAL AND TOWN-PLANNING', 186, 242, '2025-2026'],
        ['IT-RELATED', '16,740', 8628, '2025-2026'],
        [null, null, null, null],
        ['SOCIAL AND BEHAVIORAL SCIENCES', 2126, 4990, '2025–2026'],
    ]);

    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), [
            'kind' => 'enrollment',
            // Ignored: a regional office always imports into its own region.
            'region' => $this->otherRegion->id,
            'file' => $file,
        ])
        ->assertRedirect(route('settings.student-counts.index', ['kind' => 'enrollment', 'academic_year' => '2025-2026']))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast.message', 'Imported 4 discipline groups: AY 2025-2026 enrollment for Regional Office XII.');

    expect(storedMales(StudentCountKind::Enrollment, $this->region, '2025-2026'))->toBe([
        'Agricultural, Forestry, and Fisheries' => 5523,
        'Architectural and Town-Planning' => 186,
        'IT-Related' => 16740,
        'Social and Behavioral Sciences' => 2126,
    ])
        ->and(StudentCount::query()->where('survey_region_id', $this->otherRegion->id)->exists())->toBeFalse()
        ->and(DisciplineGroup::query()->count())->toBe(18);

    $entry = ActivityLog::query()->sole();
    expect($entry->action)->toBe(ActivityAction::Imported)
        ->and($entry->module)->toBe(ActivityModule::StudentCounts)
        ->and($entry->subject_label)->toBe('AY 2025-2026 enrollment for Regional Office XII')
        ->and($entry->survey_region_id)->toBe($this->region->id)
        ->and($entry->properties)->toMatchArray(['kind' => 'enrollment', 'rows' => 4, 'file' => 'figures.xlsx']);
});

test('importing a year again replaces only that year, kind and region', function () {
    $import = fn (string $kind, array $rows, ?User $as = null, array $extra = []) => $this->actingAs($as ?? $this->admin)
        ->post(route('settings.student-counts.import'), ['kind' => $kind, 'file' => studentSheet($rows), ...$extra]);

    $import('enrollment', [['Engineering', 100, 50, '2025-2026'], ['Maritime', 80, 2, '2025-2026'], ['Engineering', 90, 40, '2024-2025']]);
    $import('graduates', [['Engineering', 10, 5, '2025-2026']]);
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('admin');
    $import('enrollment', [['Engineering', 7, 7, '2025-2026']], $central, ['region' => $this->otherRegion->id]);

    $import('enrollment', [['Engineering', 120, 60, '2025-2026']])->assertSessionHasNoErrors();

    expect(storedMales(StudentCountKind::Enrollment, $this->region, '2025-2026'))->toBe(['Engineering' => 120])
        ->and(storedMales(StudentCountKind::Enrollment, $this->region, '2024-2025'))->toBe(['Engineering' => 90])
        ->and(storedMales(StudentCountKind::Graduates, $this->region, '2025-2026'))->toBe(['Engineering' => 10])
        ->and(storedMales(StudentCountKind::Enrollment, $this->otherRegion, '2025-2026'))->toBe(['Engineering' => 7]);
});

test('CHED RO XII\'s AY 2025-2026 enrollment file fits the eighteen groups exactly', function () {
    // Copied from enrollment_2025_2026_first_semester.xlsx (screenshot, 2026-10-03).
    $rows = [
        ['AGRICULTURAL, FORESTRY, AND FISHERIES', 5523, 5318], ['ARCHITECTURAL AND TOWN-PLANNING', 186, 242],
        ['BUSINESS ADMINISTRATION AND RELATED', 21430, 34696], ['CRIMINAL JUSTICE EDUCATION', 17098, 6795],
        ['EDUCATION SCIENCE AND TEACHER TRAINING', 13749, 26990], ['ENGINEERING', 8134, 4698],
        ['FINE AND APPLIED ARTS', 34, 21], ['HUMANITIES', 845, 1546], ['IT-RELATED', 16740, 8628],
        ['MARITIME', 2558, 104], ['MASS COMMUNICATION AND DOCUMENTATION', 289, 478], ['MATHEMATICS', 163, 156],
        ['MEDICAL AND ALLIED', 4261, 18286], ['NATURAL SCIENCE', 662, 1519], ['OTHER DISCIPLINES', 3571, 8112],
        ['RELIGION AND THEOLOGY', 41, 21], ['SERVICE TRADES', 1421, 4854], ['SOCIAL AND BEHAVIORAL SCIENCES', 2126, 4990],
    ];

    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), [
            'kind' => 'enrollment',
            'file' => studentSheet(array_map(fn (array $row): array => [...$row, '2025-2026'], $rows)),
        ])
        ->assertSessionHas('inertia.flash_data.toast.message', 'Imported 18 discipline groups: AY 2025-2026 enrollment for Regional Office XII.');

    expect(DisciplineGroup::query()->count())->toBe(18)
        ->and(StudentCount::query()->sum('male'))->toBe(98831)
        ->and(StudentCount::query()->sum('female'))->toBe(127454);
});

test('a CSV file imports like a workbook', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), [
            'kind' => 'graduates',
            'file' => studentSheet([['Humanities', 259, 451, '2024-2025'], ['Maritime', '367', '7', '2024-2025']], 'csv', ['discipline group', 'Male', 'Female', 'academic year']),
        ])
        ->assertSessionHasNoErrors();

    expect(storedMales(StudentCountKind::Graduates, $this->region, '2024-2025'))->toBe(['Humanities' => 259, 'Maritime' => 367]);
});

test('the old system\'s short names join today\'s groups, and unknown groups are added', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), [
            'kind' => 'graduates',
            'file' => studentSheet([
                ['Agricultural', 832, 1079, '2022-2023'],
                ['Criminal Justice', 300, 100, '2022-2023'],
                ['LAW AND JURISPRUDENCE', 12, 15, '2022-2023'],
                ['Home Economics', 1, 9, '2022-2023'],
            ]),
        ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast.message', 'Imported 4 discipline groups: AY 2022-2023 graduates for Regional Office XII. New: Law and Jurisprudence, Home Economics.');

    expect(storedMales(StudentCountKind::Graduates, $this->region, '2022-2023'))->toEqualCanonicalizing([
        'Agricultural, Forestry, and Fisheries' => 832,
        'Criminal Justice Education' => 300,
        'Law and Jurisprudence' => 12,
        'Home Economics' => 1,
    ])
        ->and(DisciplineGroup::query()->orderByDesc('sort_order')->limit(2)->pluck('sort_order', 'name')->all())
        ->toBe(['Home Economics' => 20, 'Law and Jurisprudence' => 19]);
});

test('a file with problems is refused whole, naming the rows', function (array $rows, array $headings, string $message) {
    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), ['kind' => 'enrollment', 'file' => studentSheet($rows, headings: $headings)])
        ->assertSessionHasErrors(['file' => $message]);

    expect(StudentCount::query()->exists())->toBeFalse()
        ->and(ActivityLog::query()->exists())->toBeFalse();
})->with([
    'a missing column' => [[['Engineering', 1, 2, '2025-2026']], ['Discipline Group', 'Male Count', 'Academic Year'], 'The first row needs the columns Discipline Group, Male Count, Female Count and Academic Year.'],
    'no rows' => [[], ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'], 'The file has no rows under its headings.'],
    'a negative count' => [[['Engineering', -1, 2, '2025-2026']], ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'], 'Row 2: Male Count must be a whole number, 0 or more.'],
    'a fraction' => [[['Engineering', 1, 2.5, '2025-2026']], ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'], 'Row 2: Female Count must be a whole number, 0 or more.'],
    'a blank group and a bad year' => [[['', 1, 2, '2025']], ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'], 'Row 2: the discipline group is blank; Academic Year must read like 2025-2026.'],
    'a year not in Settings' => [[['Engineering', 1, 2, '2015-2016']], ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'], 'Row 2: AY 2015-2016 is not in Settings → Academic years. Add it there first.'],
    'a group twice' => [[['Engineering', 1, 2, '2025-2026'], ['ENGINEERING', 3, 4, '2025-2026']], ['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'], 'Row 3: ENGINEERING is listed twice for AY 2025-2026.'],
]);

test('only the first five problems are listed', function () {
    $rows = array_map(fn (int $index): array => ["Group {$index}", 'many', 1, '2025-2026'], range(1, 7));

    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), ['kind' => 'enrollment', 'file' => studentSheet($rows)])
        ->assertSessionHasErrors('file');

    $lines = explode("\n", session('errors')->first('file'));
    expect($lines)->toHaveCount(6)
        ->and($lines[0])->toBe('Row 2: Male Count must be a whole number, 0 or more.')
        ->and($lines[5])->toBe('And 2 more problems.');
});

test('only workbooks and CSV files are read', function () {
    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), ['kind' => 'enrollment', 'file' => UploadedFile::fake()->create('figures.pdf', 10)])
        ->assertSessionHasErrors(['file' => 'Choose an Excel workbook (.xlsx) or a CSV file.']);

    $this->actingAs($this->admin)
        ->post(route('settings.student-counts.import'), ['kind' => 'enrollment', 'file' => UploadedFile::fake()->createWithContent('figures.xlsx', 'not a workbook')])
        ->assertSessionHasErrors(['file' => 'The file could not be read. Save it as an Excel workbook (.xlsx) or a CSV file and try again.']);
});

test('the Central Office names the region; accounts without an office or permission cannot import', function () {
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('admin');
    $payload = fn () => ['kind' => 'enrollment', 'file' => studentSheet([['Engineering', 1, 2, '2025-2026']])];

    $this->actingAs($central)->post(route('settings.student-counts.import'), $payload())
        ->assertSessionHasErrors(['region' => 'Choose the region these figures belong to.']);
    $this->actingAs($central)->post(route('settings.student-counts.import'), [...$payload(), 'region' => $this->otherRegion->id])
        ->assertSessionHasNoErrors();
    expect(storedMales(StudentCountKind::Enrollment, $this->otherRegion, '2025-2026'))->toBe(['Engineering' => 1]);

    $officeless = User::factory()->create();
    $officeless->assignRole('admin');
    $this->actingAs($officeless)->post(route('settings.student-counts.import'), $payload())->assertForbidden();

    $viewer = User::factory()->regionalOffice($this->region)->create();
    $viewer->assignRole('ched-employee');
    $this->actingAs($viewer)->post(route('settings.student-counts.import'), $payload())->assertForbidden();
    $this->actingAs($viewer)->get(route('settings.student-counts.index'))->assertForbidden();
});

test('the page shows the newest year with figures, each region\'s own or every region\'s', function () {
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('admin');
    $this->actingAs($this->admin)->post(route('settings.student-counts.import'), [
        'kind' => 'enrollment',
        'file' => studentSheet([['Engineering', 100, 50, '2025-2026'], ['Maritime', 80, 2, '2025-2026'], ['Engineering', 90, 40, '2024-2025']]),
    ]);
    $this->actingAs($central)->post(route('settings.student-counts.import'), [
        'kind' => 'enrollment', 'region' => $this->otherRegion->id,
        'file' => studentSheet([['Engineering', 10, 20, '2025-2026']]),
    ]);

    $this->actingAs($this->admin)->get(route('settings.student-counts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/student-counts')
            ->where('kind', 'enrollment')
            ->where('academic_year', '2025-2026')
            ->where('figures.male', 180)
            ->where('figures.female', 52)
            ->where('figures.regions', ['Regional Office XII'])
            ->where('figures.groups', [
                ['id' => DisciplineGroup::query()->where('name', 'Engineering')->value('id'), 'name' => 'Engineering', 'male' => 100, 'female' => 50],
                ['id' => DisciplineGroup::query()->where('name', 'Maritime')->value('id'), 'name' => 'Maritime', 'male' => 80, 'female' => 2],
            ])
            ->where('years', [['label' => '2025-2026', 'groups' => 2], ['label' => '2024-2025', 'groups' => 1]])
            ->where('region', '')
            ->has('regions', 1)
            ->where('permissions', ['import' => true, 'delete' => true]));

    $this->actingAs($central)->get(route('settings.student-counts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('figures.male', 190)
            ->where('figures.regions', ['Regional Office XII', 'Regional Office XI']));

    $this->actingAs($central)->get(route('settings.student-counts.index', ['region' => $this->otherRegion->id, 'kind' => 'graduates']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('kind', 'graduates')
            ->where('region', (string) $this->otherRegion->id)
            ->where('figures', null)
            ->where('years', []));
});

test('a year\'s figures are deleted for one region, and the homepage forgets them', function () {
    $this->actingAs($this->admin)->post(route('settings.student-counts.import'), [
        'kind' => 'graduates',
        'file' => studentSheet([['Engineering', 100, 50, '2024-2025'], ['Engineering', 90, 40, '2023-2024']]),
    ]);
    expect(StudentStatistics::forHomepage()['datasets'])->toHaveCount(2)
        ->and(Cache::has(StudentStatistics::homepageCacheKey(null)))->toBeTrue();

    $this->actingAs($this->admin)
        ->delete(route('settings.student-counts.destroy'), ['kind' => 'graduates', 'academic_year' => '2024-2025'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('inertia.flash_data.toast', ['type' => 'deleted', 'message' => 'AY 2024-2025 graduates for Regional Office XII deleted.']);

    expect(storedMales(StudentCountKind::Graduates, $this->region, '2024-2025'))->toBe([])
        ->and(storedMales(StudentCountKind::Graduates, $this->region, '2023-2024'))->toBe(['Engineering' => 90])
        ->and(Cache::has(StudentStatistics::homepageCacheKey(null)))->toBeFalse()
        ->and(ActivityLog::query()->latest('id')->first()->action)->toBe(ActivityAction::Deleted);

    $employee = User::factory()->regionalOffice($this->region)->create();
    $employee->assignRole('ched-employee');
    $this->actingAs($employee)
        ->delete(route('settings.student-counts.destroy'), ['kind' => 'graduates', 'academic_year' => '2023-2024'])
        ->assertForbidden();
});

test('the template lists every discipline group under the analyst\'s headings', function () {
    $response = $this->actingAs($this->admin)->get(route('settings.student-counts.template'))->assertOk();
    $file = $response->baseResponse->getFile();

    $reader = new Reader;
    $reader->open($file->getPathname());
    $rows = [];
    foreach ($reader->getSheetIterator() as $sheet) {
        foreach ($sheet->getRowIterator() as $row) {
            $rows[] = $row->toArray();
        }
    }
    $reader->close();

    expect($response->headers->get('content-disposition'))->toContain('enrollment-and-graduates-template.xlsx')
        ->and($rows[0])->toBe(['Discipline Group', 'Male Count', 'Female Count', 'Academic Year'])
        ->and($rows)->toHaveCount(19)
        ->and($rows[1][0])->toBe('Agricultural, Forestry, and Fisheries');
});

test('academic years and regions holding figures are kept', function () {
    $this->actingAs($this->admin)->post(route('settings.student-counts.import'), [
        'kind' => 'enrollment',
        'file' => studentSheet([['Engineering', 1, 2, '2023-2024']]),
    ]);
    $year = AcademicYear::query()->where('label', '2023-2024')->sole();

    $this->delete(route('settings.academic-years.destroy', $year))->assertSessionHasErrors('academic_year');
    $this->put(route('settings.academic-years.update', $year), ['start_year' => 2019, 'is_active' => true])
        ->assertSessionHasErrors('start_year');
    expect($year->fresh())->not->toBeNull();

    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('admin');
    $this->actingAs($central)->post(route('settings.student-counts.import'), [
        'kind' => 'enrollment', 'region' => $this->otherRegion->id,
        'file' => studentSheet([['Engineering', 1, 2, '2023-2024']]),
    ]);
    $this->delete(route('settings.survey-directories.destroy', ['type' => 'regions', 'id' => $this->otherRegion->id]))
        ->assertSessionHas('inertia.flash_data.toast.message', 'Regions with enrollment or graduate figures cannot be deleted. Deactivate it instead.');
    expect($this->otherRegion->fresh())->not->toBeNull();
});
