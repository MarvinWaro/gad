<?php

use App\Models\MonitoringReport;
use App\Models\Permission;
use App\Models\Role;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\MonitoringTemplate;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->artisan('monitoring:setup')->assertSuccessful();
    Storage::fake('monitoring');
    $this->hei = createSurveyHei(['name' => 'Fictional Monitoring HEI']);
    $this->member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $this->member->assignRole('hei');
    $this->reviewer = User::factory()->create();
    $this->reviewer->assignRole('admin');
});

function monitoringDraft($test): MonitoringReport
{
    $test->actingAs($test->member)->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 1])->assertRedirect();

    return MonitoringReport::query()->sole();
}

function monitoringAnswers(MonitoringReport $report): array
{
    return [
        'lock_version' => $report->fresh()->lock_version,
        'address' => 'Fictional campus address', 'accomplished_on' => '2026-09-29',
        'president_name' => 'Example President', 'focal_person_name' => 'Example Focal Person',
        'answers' => array_fill_keys(MonitoringTemplate::keys(), 'Documented institutional activities and actual situation.'),
    ];
}

function monitoringPdf(): UploadedFile
{
    return UploadedFile::fake()->createWithContent('signed.pdf', "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
}

function monitoringReady($test, MonitoringReport $report): void
{
    $test->actingAs($test->member)->put('/monitoring/'.$report->id, monitoringAnswers($report))->assertSessionHasNoErrors();
    $test->post('/monitoring/'.$report->id.'/attachment', ['lock_version' => $report->fresh()->lock_version, 'file' => monitoringPdf()])->assertSessionHasNoErrors();
}

function monitoringSubmit($test, MonitoringReport $report): void
{
    monitoringReady($test, $report);
    $test->post('/monitoring/'.$report->id.'/submit', ['lock_version' => $report->fresh()->lock_version, 'confirmed' => true])->assertSessionHasNoErrors();
}

function monitoringAssign($test): void
{
    DB::table('monitoring_reviewer_regions')->insert(['user_id' => $test->reviewer->id, 'survey_region_id' => $test->hei->cluster->survey_region_id]);
}

test('drafts are shared within an institution and report periods are unique', function () {
    $report = monitoringDraft($this);
    $colleague = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $colleague->assignRole('hei');
    $this->actingAs($colleague)->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 1])->assertRedirect('/monitoring/'.$report->id);
    expect(MonitoringReport::query()->count())->toBe(1);
    $this->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page->component('monitoring/show')->where('report.can_edit', true));
    $this->put('/monitoring/'.$report->id, ['lock_version' => 0, 'address' => 'Partial draft', 'answers' => ['gfps-membership' => 'In progress']])->assertSessionHasNoErrors();
    expect($report->currentRevision()->address)->toBe('Partial draft');
    $this->post('/monitoring', ['academic_year' => '2026-2028', 'semester' => 1])->assertSessionHasErrors('academic_year');
    $this->post('/monitoring', ['academic_year' => '2026-2027', 'semester' => 3])->assertSessionHasErrors('semester');
});

test('stale saves and uploads are rejected without replacing current answers or attachments', function () {
    $report = monitoringDraft($this);
    $payload = monitoringAnswers($report);
    $this->put('/monitoring/'.$report->id, $payload)->assertSessionHasNoErrors();
    $payload['address'] = 'Stale overwrite';
    $this->put('/monitoring/'.$report->id, $payload)->assertSessionHasErrors('lock_version');
    $this->post('/monitoring/'.$report->id.'/attachment', ['lock_version' => 0, 'file' => monitoringPdf()])->assertSessionHasErrors('lock_version');
    expect($report->currentRevision()->address)->toBe('Fictional campus address');
    expect(Storage::disk('monitoring')->allFiles())->toBe([]);
});

test('blank form fields are allowed but submission needs a signed PDF and confirmation', function () {
    $report = monitoringDraft($this);
    $this->post('/monitoring/'.$report->id.'/submit', ['lock_version' => 0, 'confirmed' => true])->assertSessionHasErrors('file');
    $this->put('/monitoring/'.$report->id, [
        'lock_version' => 0, 'address' => '', 'accomplished_on' => '',
        'president_name' => '', 'focal_person_name' => '', 'answers' => [],
    ])->assertSessionHasNoErrors();
    $this->post('/monitoring/'.$report->id.'/submit', ['lock_version' => 1, 'confirmed' => true])->assertSessionHasErrors('file');
    $this->post('/monitoring/'.$report->id.'/attachment', ['lock_version' => 1, 'file' => monitoringPdf()])->assertSessionHasNoErrors();
    $this->post('/monitoring/'.$report->id.'/submit', ['lock_version' => 2, 'confirmed' => false])->assertSessionHasErrors('confirmed');
    $this->post('/monitoring/'.$report->id.'/submit', ['lock_version' => 2, 'confirmed' => true])->assertSessionHasNoErrors();
    expect($report->fresh()->status)->toBe('submitted');
    expect($report->currentRevision()->answers()->where('answer', '')->count())->toBe(20);
    $this->put('/monitoring/'.$report->id, monitoringAnswers($report))->assertForbidden();
    $this->post('/monitoring/'.$report->id.'/attachment', ['lock_version' => 3, 'file' => monitoringPdf()])->assertForbidden();
});

test('PDF uploads validate content and size and edits invalidate the signed draft', function () {
    $report = monitoringDraft($this);
    monitoringReady($this, $report);
    $revision = $report->currentRevision();
    $old = $revision->attachment->path;
    $this->post('/monitoring/'.$report->id.'/attachment', ['lock_version' => 2, 'file' => UploadedFile::fake()->createWithContent('fake.pdf', 'not a pdf')])->assertSessionHasErrors('file');
    $this->post('/monitoring/'.$report->id.'/attachment', ['lock_version' => 2, 'file' => UploadedFile::fake()->create('large.pdf', 20481, 'application/pdf')])->assertSessionHasErrors('file');
    $payload = monitoringAnswers($report);
    $payload['president_name'] = 'New President';
    $this->put('/monitoring/'.$report->id, $payload)->assertSessionHasNoErrors();
    expect($revision->fresh()->attachment)->toBeNull();
    // Test transactions defer physical cleanup until commit; metadata is invalid immediately.
    $this->post('/monitoring/'.$report->id.'/submit', ['lock_version' => 3, 'confirmed' => true])->assertSessionHasErrors('file');
});

test('returned reports preserve immutable submissions and accept a newly signed revision', function () {
    $report = monitoringDraft($this);
    monitoringSubmit($this, $report);
    $original = $report->currentRevision();
    $originalFile = $original->attachment->path;
    monitoringAssign($this);
    $this->actingAs($this->reviewer)->post('/admin/monitoring/'.$report->id.'/review', ['lock_version' => 3, 'decision' => 'returned', 'comment' => ''])->assertSessionHasErrors('comment');
    $this->post('/admin/monitoring/'.$report->id.'/review', ['lock_version' => 3, 'decision' => 'returned', 'comment' => 'Please describe the training dates.'])->assertSessionHasNoErrors();
    expect($report->fresh()->status)->toBe('returned');
    expect($report->currentRevision()->number)->toBe(2);
    expect($report->currentRevision()->submitted_at)->toBeNull();
    expect($report->currentRevision()->attachment)->toBeNull();
    expect($original->fresh()->attachment->path)->toBe($originalFile);
    monitoringSubmit($this, $report);
    $this->actingAs($this->reviewer)->post('/admin/monitoring/'.$report->id.'/review', ['lock_version' => $report->fresh()->lock_version, 'decision' => 'reviewed', 'comment' => 'Reviewed documents.'])->assertSessionHasNoErrors();
    expect($report->fresh()->status)->toBe('reviewed');
    expect($report->revisions()->count())->toBe(2);
    expect($original->fresh()->submitted_at)->not->toBeNull();
    Storage::disk('monitoring')->assertExists($originalFile);
    $this->actingAs($this->member)->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page->where('report.can_edit', false)->has('report.revisions', 2));
});

test('institution and regional boundaries protect reports printouts and files', function () {
    $report = monitoringDraft($this);
    monitoringSubmit($this, $report);
    $revision = $report->currentRevision();
    $stranger = User::factory()->create(['survey_hei_id' => createSurveyHei(['name' => 'Other institution'])->id]);
    $stranger->assignRole('hei');
    foreach ([$stranger, $this->reviewer] as $viewer) {
        $this->actingAs($viewer)->get('/monitoring/'.$report->id)->assertForbidden();
        $this->get('/monitoring/'.$report->id.'/revisions/'.$revision->id.'/attachment')->assertForbidden();
        $this->get('/monitoring/'.$report->id.'/revisions/'.$revision->id.'/print')->assertForbidden();
    }
    $otherRegion = SurveyRegion::query()->create(['name' => 'Fictional Other Region', 'is_active' => true]);
    DB::table('monitoring_reviewer_regions')->insert(['user_id' => $this->reviewer->id, 'survey_region_id' => $otherRegion->id]);
    $this->actingAs($this->reviewer)->get('/admin/monitoring')->assertInertia(fn (Assert $page) => $page->has('reports.data', 0));
    $this->post('/admin/monitoring/'.$report->id.'/review', ['lock_version' => 3, 'decision' => 'reviewed'])->assertForbidden();
    monitoringAssign($this);
    $this->get('/admin/monitoring?region='.$this->hei->cluster->survey_region_id)->assertInertia(fn (Assert $page) => $page->has('reports.data', 1));
    $this->get('/monitoring/'.$report->id.'/revisions/'.$revision->id.'/attachment')->assertDownload();
    $this->get('/monitoring/'.$report->id.'/revisions/'.$revision->id.'/print')->assertOk()->assertSee('Example President');
});

test('national access is explicit and only user managers can assign monitoring access', function () {
    $report = monitoringDraft($this);
    monitoringSubmit($this, $report);
    $this->actingAs($this->member)->put('/admin/monitoring/access/'.$this->reviewer->id, ['national_access' => true, 'regions' => []])->assertForbidden();
    $this->actingAs($this->reviewer)->put('/admin/monitoring/access/'.$this->reviewer->id, ['national_access' => true, 'regions' => []])->assertSessionHasNoErrors();
    $this->get('/monitoring/'.$report->id)->assertOk();
    $this->put('/admin/monitoring/access/'.$this->reviewer->id, ['national_access' => false, 'regions' => []])->assertSessionHasNoErrors();
    $this->get('/monitoring/'.$report->id)->assertForbidden();
});

test('submitted identity survives directory changes and print output escapes answers', function () {
    $report = monitoringDraft($this);
    $payload = monitoringAnswers($report);
    $payload['answers']['gfps-membership'] = '<script>alert(1)</script>';
    $this->put('/monitoring/'.$report->id, $payload)->assertSessionHasNoErrors();
    $revision = $report->currentRevision();
    $this->hei->update(['name' => 'Renamed later']);
    $this->get('/monitoring/'.$report->id.'/revisions/'.$revision->id.'/print')->assertSee('Fictional Monitoring HEI')->assertDontSee('<script>alert(1)</script>', false)->assertSee('&lt;script&gt;', false);
});

test('setup adds permissions idempotently without replacing custom grants or geographic assignments', function () {
    $role = Role::query()->where('slug', 'admin')->sole();
    $custom = Permission::query()->create(['name' => 'Custom', 'slug' => 'custom.permission', 'group' => 'Custom']);
    $role->permissions()->attach($custom);
    monitoringAssign($this);
    $this->artisan('monitoring:setup')->assertSuccessful();
    $this->artisan('monitoring:setup')->assertSuccessful();
    expect($role->permissions()->where('slug', 'custom.permission')->exists())->toBeTrue();
    expect(Permission::query()->where('slug', 'monitoring.view')->count())->toBe(1);
    expect(DB::table('monitoring_reviewer_access')->count())->toBe(0);
    expect(DB::table('monitoring_reviewer_regions')->count())->toBe(1);
});

test('current template has twelve official requirements and twenty answer boxes', function () {
    $sections = MonitoringTemplate::definition()['sections'];
    expect(array_column($sections, 'number'))->toBe(range(1, 12));
    expect(MonitoringTemplate::keys())->toHaveCount(20)->not->toContain('gfps-establishment', 'opportunity');
    expect($sections[3]['standalone'])->toBeFalse();
    expect(array_column($sections[3]['items'], 'key'))->toBe(['opportunity-hiring', 'opportunity-admission']);
    expect(array_column($sections[3]['items'], 'label'))->toBe(['Hiring of administrators/faculty/personnel', 'Admission of students']);
    expect($sections[11]['standalone'])->toBeFalse();
    expect($sections[11]['items'][0]['label'])->toBe('Programs for PWDs, Senior Citizens, Indigenous Peoples, Solo Parents, LGBTQA++, etc.');
    expect($sections[1]['standalone'])->toBeTrue();
    expect(array_column($sections, 'key'))->toContain('gad-corner', 'breastfeeding', 'child-minding');
    expect($sections[6]['title'])->toBe('GAD Corner in the HEI or GAD section in the library');
    expect($sections[9]['number'])->toBe(10);
    expect($sections[11]['title'])->toBe('Support to Gender Equality, Disability and Social Inclusion (GEDSI)');
    expect(MonitoringTemplate::keys(MonitoringTemplate::PREVIOUS_VERSION))->toHaveCount(19)->toContain('opportunity');
    expect(MonitoringTemplate::keys(MonitoringTemplate::LEGACY_VERSION))->toHaveCount(20)->toContain('gfps-establishment');
});

test('editable legacy drafts retain answers while their old signed attachment is invalidated', function () {
    $report = monitoringDraft($this);
    $draft = $report->currentRevision();
    $draft->update(['template_version' => MonitoringTemplate::LEGACY_VERSION]);
    $draft->answers()->create(['requirement_key' => 'gfps-establishment', 'answer' => 'Earlier parent answer']);
    $draft->answers()->create(['requirement_key' => 'gfps-membership', 'answer' => 'Earlier membership answer']);
    $this->post('/monitoring/'.$report->id.'/attachment', ['lock_version' => 0, 'file' => monitoringPdf()])->assertSessionHasNoErrors();

    $submitted = $this->actingAs($this->member)->post('/monitoring', ['academic_year' => '2027-2028', 'semester' => 1]);
    $submitted->assertRedirect();
    $olderReport = MonitoringReport::query()->where('academic_year', '2027-2028')->firstOrFail();
    $older = $olderReport->currentRevision();
    $this->post('/monitoring/'.$olderReport->id.'/attachment', ['lock_version' => 0, 'file' => monitoringPdf()])->assertSessionHasNoErrors();
    $submittedFile = $older->fresh()->attachment->path;
    $older->update(['template_version' => MonitoringTemplate::LEGACY_VERSION, 'submitted_at' => now()]);
    $olderReport->update(['status' => 'submitted']);
    $older->answers()->create(['requirement_key' => 'gfps-establishment', 'answer' => 'Historical submitted answer']);

    $migration = require base_path('database/migrations/2026_09_29_000001_upgrade_editable_monitoring_templates.php');
    $migration->up();

    expect($draft->fresh()->template_version)->toBe(MonitoringTemplate::PREVIOUS_VERSION);
    expect($draft->fresh()->attachment)->toBeNull();
    expect($report->fresh()->lock_version)->toBe(2);
    $this->put('/monitoring/'.$report->id, ['lock_version' => 1, 'answers' => []])->assertSessionHasErrors('lock_version');
    $preserved = $draft->answers()->pluck('answer', 'requirement_key')->all();
    expect($preserved['gfps-establishment'])->toBe('Earlier parent answer');
    expect($preserved['gfps-membership'])->toBe('Earlier membership answer');
    expect($older->fresh()->template_version)->toBe(MonitoringTemplate::LEGACY_VERSION);
    expect($older->answers()->firstWhere('requirement_key', 'gfps-establishment')->answer)->toBe('Historical submitted answer');
    Storage::disk('monitoring')->assertExists($submittedFile);
    $this->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page->where('report.revisions.0.legacy_overview', 'Earlier parent answer'));
    $this->get('/monitoring/'.$report->id.'/revisions/'.$draft->id.'/print')->assertOk()->assertSee('Earlier GFPS overview answer')->assertSee('Earlier parent answer');
    $this->get('/monitoring/'.$olderReport->id.'/revisions/'.$older->id.'/print')->assertOk()->assertSee('Historical submitted answer');

    $nextMigration = require base_path('database/migrations/2026_09_29_000002_split_equal_opportunity_answers.php');
    $nextMigration->up();
    expect($draft->fresh()->template_version)->toBe(MonitoringTemplate::VERSION);
    expect($report->fresh()->lock_version)->toBe(3);
    expect($draft->answers()->firstWhere('requirement_key', 'gfps-establishment')->answer)->toBe('Earlier parent answer');

    monitoringAssign($this);
    $this->actingAs($this->reviewer)->post('/admin/monitoring/'.$olderReport->id.'/review', [
        'lock_version' => $olderReport->fresh()->lock_version,
        'decision' => 'returned', 'comment' => 'Please update the signed copy.',
    ])->assertSessionHasNoErrors();
    expect($olderReport->currentRevision()->template_version)->toBe(MonitoringTemplate::VERSION);
    expect($olderReport->currentRevision()->answers()->firstWhere('requirement_key', 'gfps-establishment')->answer)->toBe('Historical submitted answer');
    expect($older->fresh()->template_version)->toBe(MonitoringTemplate::LEGACY_VERSION);
    Storage::disk('monitoring')->assertExists($submittedFile);

    $this->actingAs($this->member);
    $this->put('/monitoring/'.$report->id, [
        'lock_version' => $report->fresh()->lock_version,
        'answers' => ['gfps-membership' => 'Revised membership answer'],
    ])->assertSessionHasNoErrors();
    expect($draft->answers()->firstWhere('requirement_key', 'gfps-establishment')->answer)->toBe('Earlier parent answer');
});

test('splitting item four preserves combined answers and submitted v2 history', function () {
    $report = monitoringDraft($this);
    $draft = $report->currentRevision();
    $draft->update(['template_version' => MonitoringTemplate::PREVIOUS_VERSION]);
    $this->put('/monitoring/'.$report->id, [
        'lock_version' => 0, 'answers' => ['opportunity' => 'Earlier hiring and admissions summary'],
    ])->assertSessionHasNoErrors();
    $this->post('/monitoring/'.$report->id.'/attachment', [
        'lock_version' => 1, 'file' => monitoringPdf(),
    ])->assertSessionHasNoErrors();

    $this->post('/monitoring', ['academic_year' => '2027-2028', 'semester' => 1])->assertRedirect();
    $submittedReport = MonitoringReport::query()->where('academic_year', '2027-2028')->firstOrFail();
    $submitted = $submittedReport->currentRevision();
    $submitted->update(['template_version' => MonitoringTemplate::PREVIOUS_VERSION]);
    $this->put('/monitoring/'.$submittedReport->id, [
        'lock_version' => 0, 'answers' => ['opportunity' => 'Submitted v2 answer'],
    ])->assertSessionHasNoErrors();
    $this->post('/monitoring/'.$submittedReport->id.'/attachment', [
        'lock_version' => 1, 'file' => monitoringPdf(),
    ])->assertSessionHasNoErrors();
    $submittedFile = $submitted->fresh()->attachment->path;
    $this->post('/monitoring/'.$submittedReport->id.'/submit', [
        'lock_version' => 2, 'confirmed' => true,
    ])->assertSessionHasNoErrors();

    $migration = require base_path('database/migrations/2026_09_29_000002_split_equal_opportunity_answers.php');
    $migration->up();

    expect($draft->fresh()->template_version)->toBe(MonitoringTemplate::VERSION);
    expect($draft->fresh()->attachment)->toBeNull();
    expect($report->fresh()->lock_version)->toBe(3);
    expect($draft->answers()->firstWhere('requirement_key', 'opportunity')->answer)->toBe('Earlier hiring and admissions summary');
    $this->get('/monitoring/'.$report->id)->assertInertia(fn (Assert $page) => $page->where('report.revisions.0.legacy_opportunity', 'Earlier hiring and admissions summary'));
    $this->get('/monitoring/'.$report->id.'/revisions/'.$draft->id.'/print')->assertOk()
        ->assertSee('Earlier Equal Opportunity answer')->assertSee('a. Hiring of administrators/faculty/personnel')
        ->assertSee('b. Admission of students');
    $this->put('/monitoring/'.$report->id, [
        'lock_version' => 3, 'answers' => [
            'opportunity-hiring' => 'Hiring practices', 'opportunity-admission' => 'Admissions practices',
        ],
    ])->assertSessionHasNoErrors();
    expect($draft->answers()->firstWhere('requirement_key', 'opportunity')->answer)->toBe('Earlier hiring and admissions summary');

    expect($submitted->fresh()->template_version)->toBe(MonitoringTemplate::PREVIOUS_VERSION);
    Storage::disk('monitoring')->assertExists($submittedFile);
    $this->get('/monitoring/'.$submittedReport->id.'/revisions/'.$submitted->id.'/print')->assertOk()->assertSee('Submitted v2 answer');
    monitoringAssign($this);
    $this->actingAs($this->reviewer)->post('/admin/monitoring/'.$submittedReport->id.'/review', [
        'lock_version' => $submittedReport->fresh()->lock_version,
        'decision' => 'returned', 'comment' => 'Please address each part separately.',
    ])->assertSessionHasNoErrors();
    expect($submittedReport->currentRevision()->template_version)->toBe(MonitoringTemplate::VERSION);
    expect($submittedReport->currentRevision()->answers()->firstWhere('requirement_key', 'opportunity')->answer)->toBe('Submitted v2 answer');
    expect($submitted->fresh()->template_version)->toBe(MonitoringTemplate::PREVIOUS_VERSION);
    Storage::disk('monitoring')->assertExists($submittedFile);
});
