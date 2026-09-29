<?php

use App\Http\Controllers\Admin\MonitoringAccessController;
use App\Http\Controllers\Admin\MonitoringReviewController;
use App\Http\Controllers\MonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/records', [MonitoringController::class, 'records'])->name('monitoring.records');
    Route::get('/monitoring', [MonitoringController::class, 'create'])->name('monitoring.create');
    Route::post('/monitoring', [MonitoringController::class, 'store'])->name('monitoring.store');
    Route::get('/monitoring/{report}', [MonitoringController::class, 'show'])->whereUlid('report')->name('monitoring.show');
    Route::put('/monitoring/{report}', [MonitoringController::class, 'update'])->whereUlid('report')->name('monitoring.update');
    Route::post('/monitoring/{report}/attachment', [MonitoringController::class, 'upload'])->whereUlid('report')->middleware('throttle:20,1')->name('monitoring.upload');
    Route::get('/monitoring/{report}/revisions/{revision}/attachment', [MonitoringController::class, 'attachment'])->whereUlid('report')->whereUlid('revision')->name('monitoring.attachment');
    Route::get('/monitoring/{report}/revisions/{revision}/print', [MonitoringController::class, 'print'])->whereUlid('report')->whereUlid('revision')->name('monitoring.print');
    Route::post('/monitoring/{report}/submit', [MonitoringController::class, 'submit'])->whereUlid('report')->name('monitoring.submit');
    Route::get('/admin/monitoring', [MonitoringReviewController::class, 'index'])->middleware('can:monitoring.view')->name('admin.monitoring.index');
    Route::post('/admin/monitoring/{report}/review', [MonitoringReviewController::class, 'review'])->whereUlid('report')->name('admin.monitoring.review');
    Route::get('/admin/monitoring/access', [MonitoringAccessController::class, 'index'])->middleware('can:users.update')->name('admin.monitoring.access');
    Route::put('/admin/monitoring/access/{user}', [MonitoringAccessController::class, 'update'])->middleware('can:users.update')->name('admin.monitoring.access.update');
});
