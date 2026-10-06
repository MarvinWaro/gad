<?php

use App\Models\Role;
use App\Models\Survey;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    $this->survey = Survey::query()->where('slug', 'ra-9262')->sole();
    $this->region = SurveyRegion::query()->firstOrFail();
    $this->focal = User::factory()->regionalOffice($this->region)->create();
    $this->focal->assignRole('ched-focal');
});

function viewOnlyResponse(?int $regionId, string $reference): SurveyResponse
{
    return SurveyResponse::query()->create([
        'survey_version_id' => test()->survey->versions()->firstOrFail()->id,
        'public_reference' => $reference,
        'age' => 20,
        'sex' => 'female',
        'respondent_group' => 'student',
        'survey_region_id' => $regionId,
        'answers' => ['experiences' => ['none'], 'perpetrators' => []],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
    ]);
}

test('a CHED Focal reads the surveys, their insights, Summary and questionnaire', function () {
    $this->actingAs($this->focal)->get(route('admin.surveys.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/surveys/index')
            ->where('permissions', ['create' => false, 'update' => false, 'publish' => false, 'delete' => false, 'responses' => true])
            ->where('insightFilters.options.regions', fn ($regions) => count($regions) === 1)
            ->loadDeferredProps(fn (Assert $reload) => $reload->where('insights.scope.national', false)));

    $this->get(route('admin.surveys.summary', $this->survey))->assertOk();

    $this->get(route('admin.surveys.edit', $this->survey))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('permissions', ['update' => false, 'publish' => false]));
});

test('a CHED Focal reads its own region\'s responses one by one, never another region\'s or those naming none', function () {
    $ours = viewOnlyResponse($this->region->id, 'RA9262-OURS');
    $elsewhere = viewOnlyResponse(SurveyRegion::query()->create(['name' => 'Fictional Other Region'])->id, 'RA9262-ELSEWHERE');
    $unplaced = viewOnlyResponse(null, 'RA9262-UNPLACED');
    $this->actingAs($this->focal);

    $this->get(route('admin.surveys.responses.index', $this->survey))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('responses.data', 1)
            ->where('responses.data.0.reference', 'RA9262-OURS')
            ->where('permissions', ['export' => false, 'delete' => false]));
    $this->get(route('admin.surveys.responses.show', [$this->survey, $ours]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('canDelete', false));

    foreach ([$elsewhere, $unplaced] as $response) {
        $this->get(route('admin.surveys.responses.show', [$this->survey, $response]))->assertNotFound();
    }

    // The library counts the same responses.
    $this->get(route('admin.surveys.index'))
        ->assertInertia(fn (Assert $page) => $page->where('surveys.data', fn ($surveys) => collect($surveys)->firstWhere('id', $this->survey->id)['responses_count'] === 1));

    // The Central Office reads every one, those naming no region included.
    $admin = User::factory()->nationalOffice()->create();
    $admin->assignRole('admin');
    $this->actingAs($admin)->get(route('admin.surveys.responses.index', $this->survey))
        ->assertInertia(fn (Assert $page) => $page->has('responses.data', 3));
    $this->get(route('admin.surveys.index'))
        ->assertInertia(fn (Assert $page) => $page->where('surveys.data', fn ($surveys) => collect($surveys)->firstWhere('id', $this->survey->id)['responses_count'] === 3));
});

test('a CHED Focal changes nothing, and cannot export or delete responses', function () {
    $response = viewOnlyResponse($this->region->id, 'RA9262-'.Str::upper(Str::random(10)));
    $this->actingAs($this->focal);

    $this->get(route('admin.surveys.responses.export', $this->survey))->assertForbidden();
    $this->delete(route('admin.surveys.responses.destroy', [$this->survey, $response]))->assertForbidden();
    $this->post(route('admin.surveys.store'), ['code' => 'NEW', 'title' => 'New'])->assertForbidden();
    $this->put(route('admin.surveys.update', $this->survey), [])->assertForbidden();
    $this->post(route('admin.surveys.publish', $this->survey))->assertForbidden();
    $this->patch(route('admin.surveys.archive', $this->survey))->assertForbidden();
    $this->delete(route('admin.surveys.destroy', $this->survey))->assertForbidden();

    expect(Survey::query()->whereKey($this->survey->id)->value('status'))->toBe('active')
        ->and(SurveyResponse::query()->whereKey($response->id)->exists())->toBeTrue();
});

test('existing databases give CHED Focals survey viewing, then their region\'s responses', function () {
    $role = Role::query()->where('slug', 'ched-focal')->sole();
    $role->permissions()->detach(DB::table('permissions')->whereIn('slug', ['surveys.view', 'survey-responses.view'])->pluck('id'));
    expect($this->focal->fresh()->can('surveys.view'))->toBeFalse();

    (require database_path('migrations/2026_10_10_000000_let_ched_focal_view_surveys.php'))->up();

    expect($this->focal->fresh()->can('surveys.view'))->toBeTrue()
        ->and($this->focal->fresh()->can('survey-responses.view'))->toBeFalse();

    (require database_path('migrations/2026_10_14_000000_let_ched_focal_read_regional_survey_responses.php'))->up();

    expect($this->focal->fresh()->can('survey-responses.view'))->toBeTrue()
        ->and($this->focal->fresh()->can('survey-responses.export'))->toBeFalse()
        ->and($this->focal->fresh()->can('survey-responses.delete'))->toBeFalse();
});
