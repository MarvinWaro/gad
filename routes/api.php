<?php

use Illuminate\Support\Facades\Route;
//use App\Http\Controllers\Api\HeidaStatisticsController;
use App\Http\Controllers\Api\HeiController;

// Route::get(
//     '/heida/statistics',
//     [HeidaStatisticsController::class, 'index']
// );

// Route::get(
//     '/heida/programs',
//     [HeidaStatisticsController::class, 'programs']
// );

Route::get('/regions', [HeiController::class, 'regions']);
Route::get('/heis', [HeiController::class, 'index']);