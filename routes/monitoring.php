<?php

use App\Http\Controllers\Admin\MonitoringReviewController;
use App\Http\Controllers\MonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/records', [MonitoringController::class, 'records'])->name('monitoring.records');
    Route::get('/monitoring', [MonitoringController::class, 'create'])->name('monitoring.create');
    Route::post('/monitoring', [MonitoringController::class, 'store'])->name('monitoring.store');

    Route::whereUlid('report')->group(function () {
        Route::get('/monitoring/{report}', [MonitoringController::class, 'show'])->name('monitoring.show');
        // Autosave; exempt from trimming in bootstrap/app.php.
        Route::patch('/monitoring/{report}/draft', [MonitoringController::class, 'saveDraft'])
            ->middleware('throttle:120,1')->name('monitoring.draft');
        Route::post('/monitoring/{report}/finalize', [MonitoringController::class, 'finalize'])->name('monitoring.finalize');
        Route::post('/monitoring/{report}/reopen', [MonitoringController::class, 'reopen'])->name('monitoring.reopen');
        Route::post('/monitoring/{report}/submit', [MonitoringController::class, 'submit'])
            ->middleware('throttle:20,1')->name('monitoring.submit');
        Route::get('/monitoring/{report}/revisions/{revision}/attachment', [MonitoringController::class, 'attachment'])
            ->whereUlid('revision')->name('monitoring.attachment');
        Route::post('/admin/monitoring/{report}/review', [MonitoringReviewController::class, 'review'])->name('admin.monitoring.review');
    });

    Route::get('/admin/monitoring', [MonitoringReviewController::class, 'index'])
        ->middleware('can:monitoring.view')->name('admin.monitoring.index');
});
