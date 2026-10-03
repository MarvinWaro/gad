<?php

use App\Enums\ChecklistType;
use App\Models\ChecklistResponse;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // The first semester of 2026-2027, in Philippine time.
    $this->travelTo('2026-09-29 02:00:00');
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Checklist HEI']);
    $this->member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $this->member->assignRole('hei-focal');
    $this->region = $this->hei->cluster->region;
});

function checklistStaff(?SurveyRegion $region = null, bool $national = false, string $role = 'ched-focal'): User
{
    $factory = User::factory();
    $factory = $national ? $factory->nationalOffice() : ($region ? $factory->regionalOffice($region) : $factory);
    $staff = $factory->create();
    $staff->assignRole($role);

    return $staff;
}

/** @param  list<string>  $items */
function checklistSubmit($test, string $type, array $items, string $year = '2026-2027', ?User $user = null): TestResponse
{
    return $test->actingAs($user ?? $test->member)
        ->post('/records/'.$type, ['academic_year' => $year, 'items' => $items]);
}

test('HEI focal persons get each checklist word for word, for this year', function () {
    $this->actingAs($this->member)->get('/records/training')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('monitoring/checklist')
        ->where('checklist.type', 'training')
        ->where('checklist.name', 'GAD Training Survey')
        ->where('checklist.title', 'GAD Related Trainings')
        ->where('checklist.instruction', 'Please check any of the GAD trainings, conference, or seminars you have attended')
        ->has('checklist.items', 8)
        ->where('checklist.items.0', ['key' => 'gender-sensitivity', 'label' => 'Gender Sensitivity Training'])
        ->where('checklist.items.7.label', 'Collection of sex disaggregated data')
        ->where('academicYear', '2026-2027')
        ->has('history', 0)
        ->where('canSubmit', true));

    $this->get('/records/compliance')->assertInertia(fn (Assert $page) => $page
        ->where('checklist.name', 'GAD Compliance Survey')
        ->where('checklist.title', 'Implementing Rules and Regulations on Gender-Based Sexual Harassment in Higher Education Institutions')
        ->where('checklist.instruction', 'Please check all the implementations that your institution have complied with')
        ->has('checklist.items', 12)
        ->where('checklist.items.0.label', 'Existence and Implementation of Committee on Decorum and Investigation')
        ->where('checklist.items.11.label', 'Existence and Implementation of Gender Resource Center'));

    $this->get('/records/feedback')->assertNotFound();
});

test('submitting again replaces the year\'s answer, which colleagues share', function () {
    checklistSubmit($this, 'training', ['gad-agenda', 'gender-sensitivity'])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/records/training?academic_year=2026-2027');

    $response = ChecklistResponse::query()->sole();
    expect($response->type)->toBe(ChecklistType::Training)
        ->and($response->survey_cluster_id)->toBe($this->hei->survey_cluster_id)
        ->and($response->survey_region_id)->toBe($this->region->id)
        // Stored in the checklist's order, whatever order they came in.
        ->and($response->answers->pluck('item_key')->all())->toBe(['gender-sensitivity', 'gad-agenda']);

    $colleague = User::factory()->create(['survey_hei_id' => $this->hei->id, 'name' => 'Example Colleague']);
    $colleague->assignRole('hei-focal');
    checklistSubmit($this, 'training', ['sex-disaggregated-data'], user: $colleague)->assertSessionHasNoErrors();
    // Checking none is an answer too.
    checklistSubmit($this, 'training', [], '2025-2026')->assertSessionHasNoErrors();

    expect(ChecklistResponse::query()->count())->toBe(2);
    $this->actingAs($this->member)->get('/records/training?academic_year=2025-2026')->assertInertia(fn (Assert $page) => $page
        ->where('academicYear', '2025-2026')
        ->has('history', 2)
        ->where('history.0.academic_year', '2026-2027')
        ->where('history.0.items', ['sex-disaggregated-data'])
        ->where('history.0.submitted_by', 'Example Colleague')
        ->where('history.0.submitted_at', '2026-09-29T02:00:00+00:00')
        ->where('history.1.items', []));
    // A year that isn't offered falls back to this year.
    $this->get('/records/training?academic_year=1999-2000')
        ->assertInertia(fn (Assert $page) => $page->where('academicYear', '2026-2027'));
    // The other checklist keeps its own answers.
    $this->get('/records/compliance')->assertInertia(fn (Assert $page) => $page->has('history', 0));
});

test('answers come from the checklist, for a year on the list', function () {
    checklistSubmit($this, 'training', ['codi'])->assertSessionHasErrors('items.0');
    checklistSubmit($this, 'compliance', ['codi', 'codi'])->assertSessionHasErrors('items.0');
    checklistSubmit($this, 'training', ['gad-agenda'], '2019-2020')->assertSessionHasErrors('academic_year');
    $this->actingAs($this->member)->post('/records/training', ['academic_year' => '2026-2027'])
        ->assertSessionHasErrors('items');

    expect(ChecklistResponse::query()->count())->toBe(0);
});

test('only the HEI\'s focal persons answer, and only for an active HEI', function () {
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');
    $this->actingAs($member)->get('/records/training')->assertForbidden();
    checklistSubmit($this, 'training', [], user: $member)->assertForbidden();

    $staff = checklistStaff($this->region, role: 'admin');
    $this->actingAs($staff)->get('/records/training')->assertForbidden();
    checklistSubmit($this, 'training', [], user: $staff)->assertForbidden();

    $this->hei->update(['is_active' => false]);
    $this->actingAs($this->member)->get('/records/compliance')
        ->assertInertia(fn (Assert $page) => $page->where('canSubmit', false));
    checklistSubmit($this, 'compliance', ['codi'])->assertForbidden();
    expect(ChecklistResponse::query()->count())->toBe(0);
});

test('staff see the answers from the regions their office covers', function () {
    checklistSubmit($this, 'compliance', ['codi', 'code-of-conduct']);
    checklistSubmit($this, 'training', ['gad-agenda']);
    $elsewhere = SurveyRegion::query()->create(['name' => 'Regional Office XI']);

    $this->actingAs(checklistStaff($this->region))->get('/admin/monitoring/compliance')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('monitoring/checklist-responses')
            ->where('checklist.type', 'compliance')
            ->has('responses.data', 1)
            ->where('responses.data.0.items', ['codi', 'code-of-conduct'])
            ->where('responses.data.0.place.hei.name', 'Fictional Checklist HEI')
            ->where('responses.data.0.place.region.id', $this->region->id)
            ->where('responses.meta.total', 1)
            ->where('hasOffice', true)
            ->has('regions', 1)
            // No clusters: the region's institutions list straight away.
            ->missing('clusters')
            ->where('heis.0.name', 'Fictional Checklist HEI'));

    $this->actingAs(checklistStaff($elsewhere))->get('/admin/monitoring/compliance')
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 0));
    $this->actingAs(checklistStaff())->get('/admin/monitoring/compliance')
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 0)->where('hasOffice', false));
    $this->actingAs(checklistStaff(national: true, role: 'ched-employee'))->get('/admin/monitoring/training')
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 1)->where('responses.data.0.items', ['gad-agenda']));

    $this->actingAs($this->member)->get('/admin/monitoring/training')->assertForbidden();
});

test('CHED filters the answers by year, place and name', function () {
    checklistSubmit($this, 'training', ['gad-agenda']);
    checklistSubmit($this, 'training', ['gad-agenda'], '2025-2026');
    $cluster = SurveyCluster::query()->create(['survey_region_id' => $this->region->id, 'name' => 'Sultan Kudarat', 'is_active' => true]);
    $other = SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => 'Example Other College', 'is_active' => true]);
    $otherMember = User::factory()->create(['survey_hei_id' => $other->id]);
    $otherMember->assignRole('hei-focal');
    checklistSubmit($this, 'training', [], user: $otherMember)->assertSessionHasNoErrors();

    $this->actingAs(checklistStaff($this->region));
    $this->get('/admin/monitoring/training')->assertInertia(fn (Assert $page) => $page->has('responses.data', 3));
    $this->get('/admin/monitoring/training?academic_year=2025-2026')
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 1));
    $this->get('/admin/monitoring/training?hei='.$other->id)->assertInertia(fn (Assert $page) => $page
        ->has('responses.data', 1)
        ->where('responses.data.0.place.hei.name', 'Example Other College')
        ->missing('responses.data.0.place.cluster')
        ->has('heis', 2));
    $this->get('/admin/monitoring/training?search=Checklist')
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 2));
    $this->get('/admin/monitoring/training?academic_year=2026')->assertSessionHasErrors('academic_year');
});
