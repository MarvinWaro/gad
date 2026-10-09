<?php

use App\Http\Controllers\Settings\AcademicYearController;
use App\Http\Controllers\Settings\ActivityLogController;
use App\Http\Controllers\Settings\BadgeController;
use App\Http\Controllers\Settings\ProfileAvatarController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RegionOfficeController;
use App\Http\Controllers\Settings\RegionRegistrationController;
use App\Http\Controllers\Settings\RoleManagementController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\SiteRatingManagementController;
use App\Http\Controllers\Settings\StudentCountController;
use App\Http\Controllers\Settings\SurveyDirectoryController;
use App\Http\Controllers\Settings\TemporaryPasswordController;
use App\Http\Controllers\Settings\UserManagementController;
use App\Models\SurveyRegion;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('settings/profile/avatar', [ProfileAvatarController::class, 'update'])
        ->middleware('throttle:10,1')
        ->name('profile.avatar.update');
    Route::delete('settings/profile/avatar', [ProfileAvatarController::class, 'destroy'])->name('profile.avatar.destroy');

    // An account on a temporary password chooses its own here first.
    Route::get('password/change', [TemporaryPasswordController::class, 'edit'])->name('password.change');
    Route::put('password/change', [TemporaryPasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.change.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/academic-years', [AcademicYearController::class, 'index'])
        ->middleware('can:academic-years.view')->name('settings.academic-years.index');
    Route::post('settings/academic-years', [AcademicYearController::class, 'store'])
        ->middleware('can:academic-years.create')->name('settings.academic-years.store');
    Route::put('settings/academic-years/{academicYear}', [AcademicYearController::class, 'update'])
        ->middleware('can:academic-years.update')->name('settings.academic-years.update');
    Route::delete('settings/academic-years/{academicYear}', [AcademicYearController::class, 'destroy'])
        ->middleware('can:academic-years.delete')->name('settings.academic-years.destroy');

    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])
        ->middleware(RequirePassword::class)
        ->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    Route::get('settings/users', [UserManagementController::class, 'index'])
        ->middleware('can:users.view')
        ->name('settings.users.index');
    Route::post('settings/users', [UserManagementController::class, 'store'])
        ->middleware('can:users.create')
        ->name('settings.users.store');
    Route::put('settings/users/{user}', [UserManagementController::class, 'update'])
        ->middleware('can:users.update')
        ->name('settings.users.update');
    Route::patch('settings/users/{user}/status', [UserManagementController::class, 'updateStatus'])
        ->middleware('can:users.update')
        ->name('settings.users.status');
    // On-the-spot registration: a region's new accounts skip approval.
    Route::put('settings/regions/{region}/registration', [RegionRegistrationController::class, 'update'])
        ->middleware('can:users.update')
        ->name('settings.regions.registration');
    Route::delete('settings/users/{user}', [UserManagementController::class, 'destroy'])
        ->middleware('can:users.delete')
        ->name('settings.users.destroy');

    Route::get('settings/roles', [RoleManagementController::class, 'index'])
        ->middleware('can:roles.view')
        ->name('settings.roles.index');
    Route::post('settings/roles', [RoleManagementController::class, 'store'])
        ->middleware('can:roles.create')
        ->name('settings.roles.store');
    Route::put('settings/roles/{role}', [RoleManagementController::class, 'update'])
        ->middleware('can:roles.update')
        ->name('settings.roles.update');
    Route::delete('settings/roles/{role}', [RoleManagementController::class, 'destroy'])
        ->middleware('can:roles.delete')
        ->name('settings.roles.destroy');

    Route::get('settings/respondent-groups', [SurveyDirectoryController::class, 'respondentGroups'])
        ->middleware('can:survey-directories.view')->name('settings.respondent-groups.index');
    // Directory managers, and offices keeping their own letterhead (SurveyRegionPolicy).
    Route::get('settings/regions', [SurveyDirectoryController::class, 'regions'])
        ->middleware('can:viewAny,'.SurveyRegion::class)->name('settings.regions.index');
    Route::put('settings/regions/{region}/office', [RegionOfficeController::class, 'update'])
        ->middleware('can:updateOffice,region')->name('settings.regions.office');
    Route::get('settings/heis', [SurveyDirectoryController::class, 'heis'])
        ->middleware('can:survey-directories.view')->name('settings.heis.index');
    Route::put('settings/respondent-groups/{group}/follow-ups', [SurveyDirectoryController::class, 'updateFollowUps'])
        ->middleware('can:survey-directories.update')->name('settings.respondent-groups.follow-ups');
    Route::post('settings/survey-directories/sync-heis', [SurveyDirectoryController::class, 'sync'])
        ->middleware('can:survey-directories.create')->name('settings.survey-directories.sync');
    Route::post('settings/survey-directories/{type}', [SurveyDirectoryController::class, 'store'])
        ->middleware('can:survey-directories.create')->name('settings.survey-directories.store');
    Route::put('settings/survey-directories/{type}/{id}', [SurveyDirectoryController::class, 'update'])
        ->middleware('can:survey-directories.update')->name('settings.survey-directories.update');
    Route::delete('settings/survey-directories/{type}/{id}', [SurveyDirectoryController::class, 'destroy'])
        ->middleware('can:survey-directories.delete')->name('settings.survey-directories.destroy');

    Route::get('settings/activity-logs', [ActivityLogController::class, 'index'])
        ->middleware('can:activity-logs.view')->name('settings.activity-logs.index');

    Route::get('settings/ratings', [SiteRatingManagementController::class, 'index'])
        ->middleware('can:site-ratings.view')->name('settings.ratings.index');
    Route::get('settings/ratings/export', [SiteRatingManagementController::class, 'export'])
        ->middleware('can:site-ratings.export')->name('settings.ratings.export');
    Route::put('settings/ratings/button', [SiteRatingManagementController::class, 'updateButton'])
        ->middleware('can:site-ratings.update')->name('settings.ratings.button');
    Route::delete('settings/ratings/{siteRating}', [SiteRatingManagementController::class, 'destroy'])
        ->whereUlid('siteRating')
        ->middleware('can:site-ratings.delete')->name('settings.ratings.destroy');

    // Enrollment and graduates by sex, imported until CHED's enrollment API exists.
    Route::get('settings/student-counts', [StudentCountController::class, 'index'])
        ->middleware('can:student-counts.view')->name('settings.student-counts.index');
    Route::get('settings/student-counts/template', [StudentCountController::class, 'template'])
        ->middleware('can:student-counts.view')->name('settings.student-counts.template');
    Route::post('settings/student-counts/import', [StudentCountController::class, 'import'])
        ->middleware(['can:student-counts.import', 'throttle:20,1'])->name('settings.student-counts.import');
    Route::delete('settings/student-counts', [StudentCountController::class, 'destroy'])
        ->middleware('can:student-counts.delete')->name('settings.student-counts.destroy');

    // Badges (docs/badges.md). The Form Requests check the badge's place.
    Route::get('settings/badges', [BadgeController::class, 'index'])
        ->middleware('can:badges.view')->name('settings.badges.index');
    Route::post('settings/badges', [BadgeController::class, 'store'])
        ->middleware('can:badges.create')->name('settings.badges.store');
    Route::whereUlid('badge')->group(function () {
        Route::get('settings/badges/{badge}', [BadgeController::class, 'show'])
            ->middleware('can:badges.view')->name('settings.badges.show');
        // A form with a picture: sent as POST with _method=PUT.
        Route::put('settings/badges/{badge}', [BadgeController::class, 'update'])
            ->middleware('can:badges.update')->name('settings.badges.update');
        Route::patch('settings/badges/{badge}/status', [BadgeController::class, 'status'])
            ->middleware('can:badges.update')->name('settings.badges.status');
        Route::delete('settings/badges/{badge}', [BadgeController::class, 'destroy'])
            ->middleware('can:delete,badge')->name('settings.badges.destroy');
        Route::get('settings/badges/{badge}/people', [BadgeController::class, 'people'])
            ->middleware(['can:award,badge', 'throttle:60,1'])->name('settings.badges.people');
        Route::post('settings/badges/{badge}/awards', [BadgeController::class, 'award'])
            ->middleware('can:badges.award')->name('settings.badges.awards.store');
        Route::delete('settings/badges/{badge}/awards/{award}', [BadgeController::class, 'revoke'])
            ->middleware('can:award,badge')->scopeBindings()->name('settings.badges.awards.destroy');
    });
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
