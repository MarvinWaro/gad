<?php

use App\Http\Controllers\ManageQuestController;
use App\Http\Controllers\QuestController;
use App\Models\Quest;
use Illuminate\Support\Facades\Route;

// GAD Quest (Beta, docs/gad-quest.md). Players and staff share the /quests
// prefix, so one navigation item covers both.
Route::middleware(['auth', 'verified'])->prefix('quests')->name('quests.')->group(function () {
    Route::prefix('manage')->name('manage.')->group(function () {
        Route::get('/', [ManageQuestController::class, 'index'])->name('index');
        Route::get('create', [ManageQuestController::class, 'create'])
            ->middleware('can:create,'.Quest::class)
            ->name('create');
        Route::post('/', [ManageQuestController::class, 'store'])->name('store');

        Route::whereUlid('quest')->group(function () {
            Route::get('{quest}', [ManageQuestController::class, 'show'])->name('show');
            Route::get('{quest}/edit', [ManageQuestController::class, 'edit'])
                ->middleware('can:update,quest')
                ->name('edit');
            Route::put('{quest}', [ManageQuestController::class, 'update'])->name('update');
            Route::patch('{quest}/status', [ManageQuestController::class, 'status'])->name('status');
            Route::patch('{quest}/retakes', [ManageQuestController::class, 'retakes'])->name('retakes');
            Route::delete('{quest}', [ManageQuestController::class, 'destroy'])
                ->middleware('can:delete,quest')
                ->name('destroy');
        });
    });

    Route::get('/', [QuestController::class, 'index'])->middleware('can:playAny,'.Quest::class)->name('index');
    Route::whereUlid('quest')->group(function () {
        Route::get('{quest}', [QuestController::class, 'show'])->middleware('can:play,quest')->name('show');
        Route::post('{quest}/attempts', [QuestController::class, 'start'])
            ->middleware(['can:play,quest', 'throttle:10,1'])
            ->name('attempts.store');
        Route::post('{quest}/answers', [QuestController::class, 'answer'])
            ->middleware('throttle:60,1')
            ->name('answers.store');
    });
});
