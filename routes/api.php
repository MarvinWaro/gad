<?php

use App\Http\Controllers\Api\HeiController;
use Illuminate\Support\Facades\Route;

// The public /hei page's HEIDA browser: throttled, and cached by
// HeidaDirectoryBrowser so visitors never flood HEIDA.
Route::get('/regions', [HeiController::class, 'regions'])->middleware('throttle:60,1');
Route::get('/heis', [HeiController::class, 'index'])->middleware('throttle:60,1');
