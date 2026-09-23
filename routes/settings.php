<?php

use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\RoleManagementController;
use App\Http\Controllers\Settings\SecurityController;
use App\Http\Controllers\Settings\SurveyDirectoryController;
use App\Http\Controllers\Settings\UserManagementController;
use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
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
    Route::get('settings/regions', [SurveyDirectoryController::class, 'regions'])
        ->middleware('can:survey-directories.view')->name('settings.regions.index');
    Route::get('settings/clusters', [SurveyDirectoryController::class, 'clusters'])
        ->middleware('can:survey-directories.view')->name('settings.clusters.index');
    Route::get('settings/heis', [SurveyDirectoryController::class, 'heis'])
        ->middleware('can:survey-directories.view')->name('settings.heis.index');
    Route::post('settings/survey-directories/sync-heis', [SurveyDirectoryController::class, 'sync'])
        ->middleware('can:survey-directories.create')->name('settings.survey-directories.sync');
    Route::post('settings/survey-directories/{type}', [SurveyDirectoryController::class, 'store'])
        ->middleware('can:survey-directories.create')->name('settings.survey-directories.store');
    Route::put('settings/survey-directories/{type}/{id}', [SurveyDirectoryController::class, 'update'])
        ->middleware('can:survey-directories.update')->name('settings.survey-directories.update');
    Route::delete('settings/survey-directories/{type}/{id}', [SurveyDirectoryController::class, 'destroy'])
        ->middleware('can:survey-directories.delete')->name('settings.survey-directories.destroy');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
