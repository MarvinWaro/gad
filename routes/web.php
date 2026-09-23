<?php

use App\Http\Controllers\Admin\CarouselSlideController;
use App\Http\Controllers\Admin\SurveyController;
use App\Http\Controllers\Admin\SurveyResponseController;
use App\Http\Controllers\PublicSurveyController;
use App\Models\CarouselSlide;
use App\Models\Survey;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function () {
    $carouselSlides = CarouselSlide::query()
        ->where('is_active', true)
        ->orderBy('sort_order')
        ->oldest('id')
        ->get()
        ->map(fn (CarouselSlide $slide): array => [
            'id' => "carousel-{$slide->id}",
            'title' => $slide->title,
            'description' => $slide->description,
            'href' => $slide->link,
            'media' => [
                'src' => Storage::disk('public')->url($slide->image_path),
                'alt' => $slide->title,
                'variant' => 'campus',
            ],
        ]);

    // Slugs of surveys a visitor can actually answer right now, so the
    // "Know Your Rights" cards advertise participation only where it is open.
    $openSurveys = Survey::query()
        ->where('status', 'active')
        ->whereHas('versions', fn ($query) => $query->where('status', 'published'))
        ->pluck('slug');

    return Inertia::render('welcome', [
        'carouselSlides' => $carouselSlides,
        'openSurveys' => $openSurveys,
    ]);
})->name('home');

Route::get('/surveys/{law}', [PublicSurveyController::class, 'show'])->whereIn('law', [
    'ra-7877',
    'ra-9262',
    'ra-9710',
    'ra-11313',
])->name('surveys.show');
Route::post('/surveys/{survey:slug}/responses', [PublicSurveyController::class, 'store'])
    ->middleware('throttle:5,60')
    ->name('surveys.responses.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('carousels', [CarouselSlideController::class, 'index'])
            ->middleware('can:carousel.view')
            ->name('carousels.index');
        Route::post('carousels', [CarouselSlideController::class, 'store'])
            ->middleware('can:carousel.create')
            ->name('carousels.store');
        Route::put('carousels/{carouselSlide}', [CarouselSlideController::class, 'update'])
            ->middleware('can:carousel.update')
            ->name('carousels.update');
        Route::delete('carousels/{carouselSlide}', [CarouselSlideController::class, 'destroy'])
            ->middleware('can:carousel.delete')
            ->name('carousels.destroy');

        Route::get('surveys', [SurveyController::class, 'index'])->middleware('can:surveys.view')->name('surveys.index');
        Route::post('surveys', [SurveyController::class, 'store'])->middleware('can:surveys.create')->name('surveys.store');
        Route::get('surveys/{survey}/edit', [SurveyController::class, 'edit'])->middleware('can:surveys.view')->name('surveys.edit');
        Route::put('surveys/{survey}', [SurveyController::class, 'update'])->middleware('can:surveys.update')->name('surveys.update');
        Route::post('surveys/{survey}/publish', [SurveyController::class, 'publish'])->middleware('can:surveys.publish')->name('surveys.publish');
        Route::patch('surveys/{survey}/archive', [SurveyController::class, 'archive'])->middleware('can:surveys.publish')->name('surveys.archive');
        Route::delete('surveys/{survey}', [SurveyController::class, 'destroy'])->middleware('can:surveys.delete')->name('surveys.destroy');
        Route::get('surveys/{survey}/responses', [SurveyResponseController::class, 'index'])->middleware('can:survey-responses.view')->name('surveys.responses.index');
        Route::get('surveys/{survey}/responses/export', [SurveyResponseController::class, 'export'])->middleware('can:survey-responses.export')->name('surveys.responses.export');
        Route::get('surveys/{survey}/responses/{surveyResponse}', [SurveyResponseController::class, 'show'])->middleware('can:survey-responses.view')->name('surveys.responses.show');
        Route::delete('surveys/{survey}/responses/{surveyResponse}', [SurveyResponseController::class, 'destroy'])->middleware('can:survey-responses.delete')->name('surveys.responses.destroy');
    });
});

require __DIR__.'/settings.php';
