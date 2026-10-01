<?php

use App\Models\AcademicYear;
use App\Models\MonitoringReport;
use App\Models\User;
use App\Support\AcademicPeriod;
use Database\Seeders\AcademicYearSeeder;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});

test('the settings list begins with the years previously offered by monitoring', function () {
    expect(AcademicPeriod::options())->toBe(AcademicPeriod::calendarOptions());

    $this->actingAs($this->admin)->get(route('settings.academic-years.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/academic-years')
            ->where('academicYears.data.0.label', AcademicPeriod::calendarOptions()[0])
            ->where('permissions.create', true));
});

test('academic year seeding is repeatable and preserves managed status and timestamps', function () {
    $year = AcademicYear::query()->where('start_year', 2025)->sole();
    $year->update(['is_active' => false]);
    $createdAt = $year->created_at;
    $count = AcademicYear::query()->count();

    $this->seed(AcademicYearSeeder::class);
    $this->seed(AcademicYearSeeder::class);

    expect(AcademicYear::query()->count())->toBe($count)
        ->and($year->refresh()->is_active)->toBeFalse()
        ->and($year->created_at->equalTo($createdAt))->toBeTrue();
});

test('the academic year table can be searched', function () {
    $this->actingAs($this->admin)->get(route('settings.academic-years.index', ['search' => '2025-2026']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('academicYears.data', 1)
            ->where('academicYears.data.0.label', '2025-2026')
            ->where('filters.search', '2025-2026'));
});

test('an admin can create, edit, deactivate, reactivate and delete an unused year', function () {
    $this->actingAs($this->admin)->post(route('settings.academic-years.store'), [
        'start_year' => '2035',
    ])->assertSessionHasNoErrors();

    $year = AcademicYear::query()->where('start_year', 2035)->sole();
    expect($year->label)->toBe('2035-2036')
        ->and(AcademicPeriod::options())->toContain('2035-2036');

    $this->put(route('settings.academic-years.update', $year), [
        'start_year' => 2036, 'is_active' => false,
    ])->assertSessionHasNoErrors();
    expect($year->refresh()->label)->toBe('2036-2037')
        ->and(AcademicPeriod::options())->not->toContain('2036-2037');

    $this->put(route('settings.academic-years.update', $year), [
        'start_year' => 2036, 'is_active' => true,
    ])->assertSessionHasNoErrors();
    expect(AcademicPeriod::options())->toContain('2036-2037');

    $this->delete(route('settings.academic-years.destroy', $year))->assertSessionHasNoErrors();
    expect(AcademicYear::query()->whereKey($year->id)->exists())->toBeFalse();
});

test('invalid and duplicate years are refused', function () {
    $this->actingAs($this->admin);

    foreach (['2026-2027', '9999', 'abcd', '999'] as $start) {
        $this->post(route('settings.academic-years.store'), ['start_year' => $start])
            ->assertSessionHasErrors('start_year');
    }

    $this->post(route('settings.academic-years.store'), ['start_year' => AcademicPeriod::FIRST_YEAR])
        ->assertSessionHasErrors('start_year');
});

test('years with filed reports cannot be renamed or deleted', function () {
    $year = AcademicYear::query()->where('start_year', 2025)->sole();
    $hei = createSurveyHei();
    MonitoringReport::query()->create([
        'survey_hei_id' => $hei->id,
        'survey_cluster_id' => $hei->survey_cluster_id,
        'survey_region_id' => $hei->cluster->survey_region_id,
        'institution_name' => $hei->name,
        'academic_year' => $year->label,
        'semester' => 1,
    ]);

    $this->actingAs($this->admin)->put(route('settings.academic-years.update', $year), [
        'start_year' => 2035, 'is_active' => true,
    ])->assertSessionHasErrors('start_year');

    $this->delete(route('settings.academic-years.destroy', $year))
        ->assertSessionHasErrors('academic_year');
    expect($year->refresh()->label)->toBe('2025-2026');

    $this->put(route('settings.academic-years.update', $year), [
        'start_year' => 2025, 'is_active' => false,
    ])->assertSessionHasNoErrors();
    expect(AcademicPeriod::options())->not->toContain('2025-2026')
        ->and(AcademicPeriod::recordOptions())->toContain('2025-2026');
});

test('academic year management requires its own permissions', function () {
    $user = User::factory()->create();
    $user->assignRole('gad-focal-person');

    $this->actingAs($user)->get(route('settings.academic-years.index'))->assertForbidden();
    $this->post(route('settings.academic-years.store'), ['start_year' => 2035])->assertForbidden();
});
