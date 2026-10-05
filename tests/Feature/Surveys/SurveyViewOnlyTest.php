<?php

use App\Models\Role;
use App\Models\Survey;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->survey = Survey::query()->where('slug', 'ra-9262')->sole();
    $this->focal = User::factory()->regionalOffice(SurveyRegion::query()->firstOrFail())->create();
    $this->focal->assignRole('ched-focal');
});

test('a CHED Focal reads the surveys, their insights, Summary and questionnaire', function () {
    $this->actingAs($this->focal)->get(route('admin.surveys.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/surveys/index')
            ->where('permissions', ['create' => false, 'update' => false, 'publish' => false, 'delete' => false, 'responses' => false])
            ->where('insightFilters.options.regions', fn ($regions) => count($regions) === 1)
            ->loadDeferredProps(fn (Assert $reload) => $reload->where('insights.scope.national', false)));

    $this->get(route('admin.surveys.summary', $this->survey))->assertOk();

    $this->get(route('admin.surveys.edit', $this->survey))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('permissions', ['update' => false, 'publish' => false]));
});

test('a CHED Focal changes nothing and never opens single responses', function () {
    $this->actingAs($this->focal);

    $this->get(route('admin.surveys.responses.index', $this->survey))->assertForbidden();
    $this->get(route('admin.surveys.responses.export', $this->survey))->assertForbidden();
    $this->post(route('admin.surveys.store'), ['code' => 'NEW', 'title' => 'New'])->assertForbidden();
    $this->put(route('admin.surveys.update', $this->survey), [])->assertForbidden();
    $this->post(route('admin.surveys.publish', $this->survey))->assertForbidden();
    $this->patch(route('admin.surveys.archive', $this->survey))->assertForbidden();
    $this->delete(route('admin.surveys.destroy', $this->survey))->assertForbidden();

    expect(Survey::query()->whereKey($this->survey->id)->value('status'))->toBe('active');
});

test('existing databases give CHED Focals survey viewing', function () {
    $role = Role::query()->where('slug', 'ched-focal')->sole();
    $role->permissions()->detach(DB::table('permissions')->where('slug', 'surveys.view')->value('id'));
    expect($this->focal->fresh()->can('surveys.view'))->toBeFalse();

    (require database_path('migrations/2026_10_10_000000_let_ched_focal_view_surveys.php'))->up();

    expect($this->focal->fresh()->can('surveys.view'))->toBeTrue()
        ->and($this->focal->fresh()->can('survey-responses.view'))->toBeFalse();
});
