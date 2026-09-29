<?php

use App\Models\MonitoringAnswer;
use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\MonitoringTemplate;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // The first semester of 2026-2027, in Philippine time.
    $this->travelTo('2026-09-29 02:00:00');
    $this->seed(RbacSeeder::class);
    Storage::fake('monitoring');
    $this->hei = createSurveyHei(['name' => 'Fictional Monitoring HEI']);
    $this->member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $this->member->assignRole('hei');
    $this->region = $this->hei->cluster->region;
});

function monitoringReport($test): MonitoringReport
{
    $test->actingAs($test->member)
        ->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 1])
        ->assertRedirect();

    return MonitoringReport::query()->sole();
}

/** @param  array<string, string>  $answers */
function monitoringSave($test, MonitoringReport $report, array $answers = [], array $details = []): TestResponse
{
    $revision = $report->fresh()->currentRevision;
    $stored = $revision->answers->pluck('answer', 'requirement_key');
    $current = $revision->details();

    return $test->actingAs($test->member)->patchJson('/monitoring/'.$report->id.'/draft', array_filter([
        'answers' => collect($answers)->map(fn (string $value, string $key): array => ['base' => $stored[$key] ?? '', 'value' => $value])->all(),
        'details' => collect($details)->map(fn (string $value, string $key): array => ['base' => $current[$key], 'value' => $value])->all(),
    ]));
}

function monitoringFinalize($test, MonitoringReport $report): TestResponse
{
    return $test->actingAs($test->member)
        ->post('/monitoring/'.$report->id.'/finalize', ['lock_version' => $report->fresh()->lock_version]);
}

function monitoringPdf(string $name = 'signed.pdf'): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
}

function monitoringSubmit($test, MonitoringReport $report): TestResponse
{
    return $test->actingAs($test->member)->post('/monitoring/'.$report->id.'/submit', [
        'lock_version' => $report->fresh()->lock_version,
        'confirmed' => true,
        'file' => monitoringPdf(),
    ]);
}

/** A full answer set, submitted: the state CHED reviews. */
function monitoringSubmitted($test): MonitoringReport
{
    $report = monitoringReport($test);
    monitoringSave($test, $report, array_fill_keys(MonitoringTemplate::keys(), 'Actual situation.'), [
        'address' => 'Fictional campus address',
        'accomplished_on' => '2026-09-29',
        'president_name' => 'Example President',
        'focal_person_name' => 'Example Focal Person',
    ])->assertOk();
    monitoringFinalize($test, $report)->assertSessionHasNoErrors();
    monitoringSubmit($test, $report)->assertSessionHasNoErrors();

    return $report->fresh();
}

function monitoringStaff(?SurveyRegion $region = null, bool $national = false, string $role = 'admin'): User
{
    $factory = User::factory();
    $factory = $national ? $factory->nationalOffice() : ($region ? $factory->regionalOffice($region) : $factory);
    $staff = $factory->create();
    $staff->assignRole($role);

    return $staff;
}

test('colleagues at an HEI share one report per period', function () {
    $report = monitoringReport($this);
    $colleague = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $colleague->assignRole('hei');

    $this->actingAs($colleague)
        ->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 1])
        ->assertRedirect('/monitoring/'.$report->id);

    expect(MonitoringReport::query()->count())->toBe(1)
        ->and(MonitoringAnswer::query()->count())->toBe(20)
        ->and($report->survey_region_id)->toBe($this->region->id);

    $this->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page
        ->component('monitoring/show')
        ->where('viewer', 'hei')
        ->where('report.abilities.edit', true)
        ->where('report.abilities.sign', false)
        ->where('report.place.hei.name', 'Fictional Monitoring HEI')
        ->where('report.place.region.name', 'Regional Office XII')
        ->where('office.name', 'Regional Office XII')
        ->has('templates.2025.sections', 12)
        ->has('report.revisions', 1));

    $this->post('/monitoring', ['academic_year' => '2019-2020', 'semester' => 1])->assertSessionHasErrors('academic_year');
    $this->post('/monitoring', ['academic_year' => '2026-2028', 'semester' => 1])->assertSessionHasErrors('academic_year');
    $this->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 3])->assertSessionHasErrors('semester');
});

test('the start page offers the current period and the HEI\'s open reports', function () {
    $report = monitoringReport($this);

    $this->get('/monitoring')->assertInertia(fn (Assert $page) => $page
        ->component('monitoring/create')
        ->where('period.academic_year', '2026-2027')
        ->where('period.semester', 1)
        ->where('academicYears.0', '2027-2028')
        ->where('openReports.0.id', $report->id));
});

test('autosave keeps text exactly as typed and merges colleagues\' changes', function () {
    $report = monitoringReport($this);

    monitoringSave($this, $report, ['gfps-membership' => "  Chair and members\r\n\n"], ['address' => ' Campus road '])
        ->assertOk()
        ->assertJsonPath('lock_version', 1)
        ->assertJsonPath('conflicts.answers', [])
        ->assertJsonPath('conflicts.details', []);

    $revision = $report->fresh()->currentRevision;
    expect($revision->answers->firstWhere('requirement_key', 'gfps-membership')->answer)->toBe("  Chair and members\n\n")
        ->and($revision->address)->toBe(' Campus road ');

    // A colleague started from the blank answer: their edit to it is refused,
    // while their other field saves.
    $this->actingAs($this->member)->patchJson('/monitoring/'.$report->id.'/draft', [
        'answers' => [
            'gfps-membership' => ['base' => '', 'value' => 'Their version'],
            'gfps-policies' => ['base' => '', 'value' => 'Policy review done'],
        ],
    ])
        ->assertOk()
        ->assertJsonPath('conflicts.answers.gfps-membership', "  Chair and members\n\n")
        ->assertJsonMissingPath('conflicts.answers.gfps-policies');

    $answers = $report->fresh()->currentRevision->answers->pluck('answer', 'requirement_key');
    expect($answers['gfps-membership'])->toBe("  Chair and members\n\n")
        ->and($answers['gfps-policies'])->toBe('Policy review done');

    // Blanking a detail stores it as empty.
    monitoringSave($this, $report, details: ['address' => ''])->assertOk();
    expect($report->fresh()->currentRevision->address)->toBeNull();
});

test('autosave accepts only the form\'s fields', function () {
    $report = monitoringReport($this);
    $url = '/monitoring/'.$report->id.'/draft';

    $this->actingAs($this->member)->patchJson($url, ['answers' => ['made-up' => ['base' => '', 'value' => 'x']]])
        ->assertUnprocessable()->assertJsonValidationErrors('answers');
    $this->patchJson($url, ['answers' => ['codi' => ['base' => '', 'value' => str_repeat('a', 20001)]]])
        ->assertUnprocessable()->assertJsonValidationErrors('answers.codi.value');
    $this->patchJson($url, ['details' => ['accomplished_on' => ['base' => '', 'value' => '29/09/2026']]])
        ->assertUnprocessable()->assertJsonValidationErrors('details.accomplished_on.value');
    $this->patchJson($url, ['details' => ['status' => ['base' => '', 'value' => 'reviewed']]])
        ->assertUnprocessable()->assertJsonValidationErrors('details');

    $stranger = User::factory()->create(['survey_hei_id' => createSurveyHei(['name' => 'Another HEI'])->id]);
    $stranger->assignRole('hei');
    $this->actingAs($stranger)->patchJson($url, ['answers' => ['codi' => ['base' => '', 'value' => 'x']]])->assertForbidden();
});

test('finalizing locks the answers under a document code', function () {
    $report = monitoringReport($this);
    monitoringSave($this, $report, ['codi' => 'CODI constituted'])->assertOk();

    $this->actingAs($this->member)
        ->post('/monitoring/'.$report->id.'/finalize', ['lock_version' => 0])
        ->assertSessionHasErrors('lock_version');

    monitoringFinalize($this, $report)->assertSessionHasNoErrors();
    $revision = $report->fresh()->currentRevision;
    $code = $revision->document_code;

    expect($revision->finalized_at)->not->toBeNull()
        ->and($revision->finalized_by)->toBe($this->member->id)
        ->and($code)->toMatch('/^[0-9A-F]{4}-[0-9A-F]{4}$/');

    monitoringSave($this, $report, ['codi' => 'Changed after signing'])
        ->assertUnprocessable()->assertJsonValidationErrors('report');

    $this->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page
        ->where('report.abilities.edit', false)
        ->where('report.abilities.sign', true)
        ->where('report.revisions.0.document_code', $code));

    // Unlocking clears the code; finalizing the same answers gives it back.
    $this->post('/monitoring/'.$report->id.'/reopen', ['lock_version' => $report->fresh()->lock_version])->assertSessionHasNoErrors();
    expect($report->fresh()->currentRevision->document_code)->toBeNull();
    monitoringFinalize($this, $report)->assertSessionHasNoErrors();
    expect($report->fresh()->currentRevision->document_code)->toBe($code);

    $this->post('/monitoring/'.$report->id.'/reopen', ['lock_version' => $report->fresh()->lock_version])->assertSessionHasNoErrors();
    monitoringSave($this, $report, ['codi' => 'CODI constituted and trained'])->assertOk();
    monitoringFinalize($this, $report)->assertSessionHasNoErrors();
    expect($report->fresh()->currentRevision->document_code)->not->toBe($code);
});

test('submitting needs a finalized report, a signed PDF and confirmation', function () {
    $report = monitoringReport($this);

    monitoringSubmit($this, $report)->assertSessionHasErrors('report');
    expect(Storage::disk('monitoring')->allFiles())->toBe([]);

    monitoringFinalize($this, $report)->assertSessionHasNoErrors();
    $version = fn () => $report->fresh()->lock_version;

    $this->post('/monitoring/'.$report->id.'/submit', ['lock_version' => $version(), 'confirmed' => true])
        ->assertSessionHasErrors('file');
    $this->post('/monitoring/'.$report->id.'/submit', [
        'lock_version' => $version(), 'confirmed' => true,
        'file' => UploadedFile::fake()->createWithContent('renamed.pdf', 'not a pdf'),
    ])->assertSessionHasErrors('file');
    $this->post('/monitoring/'.$report->id.'/submit', [
        'lock_version' => $version(), 'confirmed' => true,
        'file' => UploadedFile::fake()->create('huge.pdf', 20481, 'application/pdf'),
    ])->assertSessionHasErrors('file');
    $this->post('/monitoring/'.$report->id.'/submit', [
        'lock_version' => $version(), 'confirmed' => false, 'file' => monitoringPdf(),
    ])->assertSessionHasErrors('confirmed');

    // A stale version is refused, and its upload is not kept.
    $this->post('/monitoring/'.$report->id.'/submit', [
        'lock_version' => 0, 'confirmed' => true, 'file' => monitoringPdf(),
    ])->assertSessionHasErrors('lock_version');
    expect(Storage::disk('monitoring')->allFiles())->toBe([]);

    monitoringSubmit($this, $report)->assertSessionHasNoErrors();
    $revision = $report->fresh()->currentRevision;

    expect($report->fresh()->status)->toBe('submitted')
        ->and($revision->submitted_by)->toBe($this->member->id)
        ->and($revision->attachment)->not->toBeNull()
        ->and(Storage::disk('monitoring')->allFiles())->toHaveCount(1);

    monitoringSave($this, $report, ['codi' => 'Too late'])->assertUnprocessable();
    $this->post('/monitoring/'.$report->id.'/reopen', ['lock_version' => $report->fresh()->lock_version])
        ->assertSessionHasErrors('report');
});

test('a returned report opens the next revision with the same answers', function () {
    $report = monitoringSubmitted($this);
    $staff = monitoringStaff(national: true);
    $firstFile = $report->currentRevision->attachment->path;

    $this->actingAs($staff)
        ->post('/admin/monitoring/'.$report->id.'/review', ['lock_version' => $report->lock_version, 'decision' => 'returned'])
        ->assertSessionHasErrors('comment');
    $this->post('/admin/monitoring/'.$report->id.'/review', [
        'lock_version' => $report->lock_version, 'decision' => 'returned', 'comment' => 'Attach the CODI roster.',
    ])->assertSessionHasNoErrors();

    $report->refresh();
    $next = $report->currentRevision;

    expect($report->status)->toBe('returned')
        ->and($next->number)->toBe(2)
        ->and($next->finalized_at)->toBeNull()
        ->and($next->attachment)->toBeNull()
        ->and($next->president_name)->toBe('Example President')
        ->and($next->answers->pluck('answer', 'requirement_key')['codi'])->toBe('Actual situation.')
        ->and(Storage::disk('monitoring')->exists($firstFile))->toBeTrue();

    // The HEI corrects, signs again and resubmits; CHED marks it reviewed.
    monitoringSave($this, $report, ['codi' => 'Roster attached.'])->assertOk();
    monitoringFinalize($this, $report)->assertSessionHasNoErrors();
    monitoringSubmit($this, $report)->assertSessionHasNoErrors();

    $this->actingAs($staff)->post('/admin/monitoring/'.$report->id.'/review', [
        'lock_version' => $report->fresh()->lock_version, 'decision' => 'reviewed',
    ])->assertSessionHasNoErrors();

    expect($report->fresh()->status)->toBe('reviewed')
        ->and(MonitoringRevision::query()->count())->toBe(2);

    $this->post('/admin/monitoring/'.$report->id.'/review', [
        'lock_version' => $report->fresh()->lock_version, 'decision' => 'reviewed',
    ])->assertSessionHasErrors('report');

    $this->actingAs($this->member)->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page
        ->where('report.status', 'reviewed')
        ->where('report.abilities.edit', false)
        ->has('report.revisions', 2)
        ->where('report.revisions.1.reviews.0.decision', 'returned'));
});

test('staff see and review only reports their office covers', function () {
    $report = monitoringSubmitted($this);
    $elsewhere = SurveyRegion::query()->create(['name' => 'Regional Office XI']);
    $review = ['lock_version' => $report->lock_version, 'decision' => 'reviewed'];

    foreach ([monitoringStaff($elsewhere), monitoringStaff()] as $outsider) {
        $this->actingAs($outsider)->get('/admin/monitoring')
            ->assertInertia(fn (Assert $page) => $page->component('monitoring/records')->has('reports.data', 0));
        $this->get('/monitoring/'.$report->id)->assertForbidden();
        $this->post('/admin/monitoring/'.$report->id.'/review', $review)->assertForbidden();
    }

    $this->actingAs(monitoringStaff())->get('/admin/monitoring')
        ->assertInertia(fn (Assert $page) => $page->where('hasOffice', false));

    $regional = monitoringStaff($this->region, role: 'gad-focal-person');
    $this->actingAs($regional)->get('/admin/monitoring')->assertInertia(fn (Assert $page) => $page
        ->has('reports.data', 1)
        ->where('reports.data.0.abilities.review', true)
        ->has('regions', 1));
    $this->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page
        ->where('viewer', 'staff')
        ->where('report.abilities.review', true)
        ->where('report.abilities.edit', false));

    $this->actingAs(monitoringStaff(national: true))->get('/admin/monitoring?region='.$elsewhere->id)
        ->assertInertia(fn (Assert $page) => $page->has('reports.data', 0));
    $this->get('/admin/monitoring?region='.$this->region->id)
        ->assertInertia(fn (Assert $page) => $page->has('reports.data', 1));

    $stranger = User::factory()->create(['survey_hei_id' => createSurveyHei(['name' => 'Another HEI'])->id]);
    $stranger->assignRole('hei');
    $this->actingAs($stranger)->get('/monitoring/'.$report->id)->assertForbidden();
    $this->get('/admin/monitoring')->assertForbidden();
});

test('signed copies open inline or download only for people who can view them', function () {
    $report = monitoringSubmitted($this);
    $revision = $report->currentRevision;
    $url = '/monitoring/'.$report->id.'/revisions/'.$revision->id.'/attachment';

    $this->actingAs($this->member)->get($url)
        ->assertOk()
        ->assertDownload('GAD-Monitoring-Report_2026-2027_S1_Rev1_signed.pdf');
    $this->get($url.'?inline=1')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/pdf')
        ->assertHeader('X-Content-Type-Options', 'nosniff');
    expect($this->get($url.'?inline=1')->headers->get('Content-Disposition'))->toStartWith('inline');

    $otherHei = createSurveyHei(['name' => 'Second HEI']);
    $otherMember = User::factory()->create(['survey_hei_id' => $otherHei->id]);
    $otherMember->assignRole('hei');
    $this->actingAs($otherMember)->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 1]);
    $other = MonitoringReport::query()->where('survey_hei_id', $otherHei->id)->sole();

    $this->get($url)->assertForbidden();
    // A revision is only reachable through its own report.
    $this->get('/monitoring/'.$other->id.'/revisions/'.$revision->id.'/attachment')->assertNotFound();
});

test('the name printed for signing survives a rename in the directory', function () {
    $report = monitoringReport($this);
    $this->hei->update(['name' => 'Renamed By Sync']);

    $this->get('/monitoring/'.$report->id)
        ->assertInertia(fn (Assert $page) => $page->where('report.place.hei.name', 'Fictional Monitoring HEI'));
});

test('records list the institution\'s own reports', function () {
    $report = monitoringReport($this);
    $other = User::factory()->create(['survey_hei_id' => createSurveyHei(['name' => 'Another HEI'])->id]);
    $other->assignRole('hei');
    $this->actingAs($other)->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 1]);

    $this->actingAs($this->member)->get('/records')->assertInertia(fn (Assert $page) => $page
        ->component('monitoring/records')
        ->has('reports.data', 1)
        ->where('reports.data.0.id', $report->id)
        ->where('canCreate', true));
    $this->get('/records?status=submitted')->assertInertia(fn (Assert $page) => $page->has('reports.data', 0));

    $this->actingAs(monitoringStaff(national: true))->get('/records')->assertForbidden();
});

test('the template transcribes the official form', function () {
    $template = MonitoringTemplate::definition();
    $sections = collect($template['sections']);

    expect($sections->pluck('number')->all())->toBe(['1)', '2)', '3)', '4)', '5)', '6)', '7)', '8)', '9)', '10)', '11)', '12.'])
        ->and($sections->pluck('layout')->all())->toBe(['rows', 'single', 'rows', 'combined', 'rows', 'rows', 'single', 'single', 'single', 'single', 'rows', 'combined'])
        ->and($sections->where('bold', true)->pluck('key')->all())->toBe(['gfps', 'curriculum', 'opportunity', 'research', 'extension', 'gedsi'])
        ->and(MonitoringTemplate::keys())->toBe([
            'gfps-membership', 'gfps-policies', 'gfps-tasks', 'plan-budget',
            'curriculum-noted', 'curriculum-training', 'curriculum-materials', 'curriculum-nstp',
            'opportunity-hiring', 'opportunity-admission', 'research-topics',
            'extension-inclusion', 'extension-partnerships', 'gad-corner', 'breastfeeding',
            'child-minding', 'sex-disaggregated-data', 'codi', 'complaint-reports', 'gedsi-programs',
        ])
        ->and($sections[1]['detail'])->toBe('GAD Program, Activities and Projects implemented by HEI per AY')
        ->and($sections[3]['items'][0]['label'])->toBe('Hiring of administrators/faculty/personnel')
        ->and($sections[11]['title'])->toBe('Support to Gender Equality, Disability and Social Inclusion (GEDSI)')
        ->and($template['columns']['instruction'])->toBe('Please state actual situations per item.');

    expect(fn () => MonitoringTemplate::definition('2025-v1'))->toThrow(InvalidArgumentException::class);
});
