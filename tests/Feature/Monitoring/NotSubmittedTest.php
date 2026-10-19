<?php

use App\Models\ChecklistResponse;
use App\Models\MonitoringReport;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // The first semester of 2026-2027, in Philippine time.
    $this->travelTo('2026-09-29 02:00:00');
    $this->seed(RbacSeeder::class);
    $this->region = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true]);
    $cluster = SurveyCluster::query()->create(['survey_region_id' => $this->region->id, 'name' => 'South Cotabato', 'is_active' => true]);
    $this->hei = fn (string $name, bool $active = true) => SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => $name, 'is_active' => $active]);
    $this->focal = User::factory()->regionalOffice($this->region)->create();
    $this->focal->assignRole('ched-focal');
});

function gapReport(SurveyHei $hei, string $status, string $year = '2026-2027', int $semester = 1): MonitoringReport
{
    return MonitoringReport::query()->create([
        'survey_hei_id' => $hei->id,
        'survey_cluster_id' => $hei->survey_cluster_id,
        'survey_region_id' => $hei->cluster->survey_region_id,
        'institution_name' => $hei->name,
        'academic_year' => $year,
        'semester' => $semester,
        'status' => $status,
    ]);
}

test('the region\'s institutions that have not sent this semester\'s report: not started, drafts and returned', function () {
    $notStarted = ($this->hei)('Alpha College');
    $draft = ($this->hei)('Bravo University');
    $returned = ($this->hei)('Charlie Institute');
    $submitted = ($this->hei)('Delta College');
    $reviewed = ($this->hei)('Echo State University');
    ($this->hei)('Closed College', false);
    $draftReport = gapReport($draft, 'draft');
    gapReport($returned, 'returned');
    gapReport($submitted, 'submitted');
    gapReport($reviewed, 'reviewed');
    // Sent for another semester only: still owes this one.
    gapReport($notStarted, 'submitted', semester: 2);
    $member = User::factory()->create(['survey_hei_id' => $draft->id]);
    $member->assignRole('hei-focal');
    $elsewhere = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true])->id, 'name' => 'Davao', 'is_active' => true])->id,
        'name' => 'Elsewhere College',
        'is_active' => true,
    ]);

    $this->actingAs($this->focal)->get(route('admin.monitoring.not-submitted'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('monitoring/not-submitted')
            ->where('period', ['academic_year' => '2026-2027', 'semester' => 1])
            ->has('gaps.data', 3)
            ->where('gaps.data.0', ['hei' => ['id' => $notStarted->id, 'name' => 'Alpha College'], 'region' => 'Regional Office XII', 'status' => 'not_started', 'report_id' => null, 'has_focal' => false])
            ->where('gaps.data.1.status', 'draft')
            ->where('gaps.data.1.report_id', $draftReport->id)
            ->where('gaps.data.1.has_focal', true)
            ->where('gaps.data.2.status', 'returned'));

    // Another semester: Alpha sent that one; the others owe it.
    $this->get(route('admin.monitoring.not-submitted', ['semester' => 2]))
        ->assertInertia(fn (Assert $page) => $page->has('gaps.data', 4)->where('gaps.data.0.hei.name', 'Bravo University'));
    $this->get(route('admin.monitoring.not-submitted', ['search' => 'Bravo']))
        ->assertInertia(fn (Assert $page) => $page->has('gaps.data', 1)->where('gaps.data.0.hei.name', 'Bravo University'));

    // The Central Office sees every region's.
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('admin');
    $this->actingAs($central)->get(route('admin.monitoring.not-submitted'))
        ->assertInertia(fn (Assert $page) => $page->has('gaps.data', 4)->where('gaps.data.3.hei.name', $elsewhere->name));
});

test('the institutions that have not answered a GAD survey for the year', function () {
    $answered = ($this->hei)('Alpha College');
    $missing = ($this->hei)('Bravo University');
    ChecklistResponse::query()->create([
        'type' => 'training',
        'survey_hei_id' => $answered->id,
        'survey_cluster_id' => $answered->survey_cluster_id,
        'survey_region_id' => $this->region->id,
        'academic_year' => '2026-2027',
        'submitted_at' => now(),
    ]);

    $this->actingAs($this->focal)->get(route('admin.checklists.not-submitted', 'training'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('subject.kind', 'checklist')
            ->where('period.academic_year', '2026-2027')
            ->has('gaps.data', 1)
            ->where('gaps.data.0.hei.name', $missing->name)
            ->where('gaps.data.0.status', 'not_started'));
    // The other survey is owed by both.
    $this->get(route('admin.checklists.not-submitted', 'compliance'))
        ->assertInertia(fn (Assert $page) => $page->has('gaps.data', 2));
});

test('HEI accounts cannot open the lists', function () {
    $member = User::factory()->create(['survey_hei_id' => ($this->hei)('Alpha College')->id]);
    $member->assignRole('hei-focal');

    $this->actingAs($member)->get(route('admin.monitoring.not-submitted'))->assertForbidden();
    $this->get(route('admin.checklists.not-submitted', 'training'))->assertForbidden();
});
