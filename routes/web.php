<?php

use App\Http\Controllers\Admin\CarouselSlideController;
use App\Http\Controllers\Admin\GadEventController;
use App\Http\Controllers\Admin\SiteFeedbackController as AdminSiteFeedbackController;
use App\Http\Controllers\Admin\SurveyController;
use App\Http\Controllers\Admin\SurveyResponseController;
use App\Http\Controllers\Admin\SurveySummaryController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\MyProfileController;
use App\Http\Controllers\NewerPostsController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PeopleSearchController;
use App\Http\Controllers\PersonProfileController;
use App\Http\Controllers\PostCommentController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PostHomepageController;
use App\Http\Controllers\PostReactionController;
use App\Http\Controllers\PostShareController;
use App\Http\Controllers\PostTagSuggestionController;
use App\Http\Controllers\PublicSurveyController;
use App\Http\Controllers\SiteFeedbackController;
use App\Http\Controllers\SiteRatingController;
use App\Models\CarouselSlide;
use App\Models\GadEvent;
use App\Models\SiteSetting;
use App\Models\Survey;
use App\Support\HomepageStories;
use App\Support\StudentStatistics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    // Each prop is a closure, so a partial reload (the statistics' Region
    // filter) runs only what it asks for.
    return Inertia::render('welcome', [
        'carouselSlides' => fn () => CarouselSlide::query()
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
            ]),
        // Slugs of surveys a visitor can actually answer right now, so the
        // "Know Your Rights" cards advertise participation only where it is open.
        'openSurveys' => fn () => Survey::query()
            ->where('status', 'active')
            ->whereHas('versions', fn ($query) => $query->where('status', 'published'))
            ->pluck('slug'),
        'ratingButton' => fn () => SiteSetting::ratingButtonEnabled(),
        // "Gender mainstreaming in action": the year's most reacted photo posts.
        'stories' => fn () => HomepageStories::top(),
        // The statistics section: imported enrollment and graduates by sex,
        // for the region in ?region= or every region.
        'statistics' => fn () => StudentStatistics::forHomepage($request->integer('region') ?: null),
    ]);
})->name('home');

Route::get('/hei', function () {
    return Inertia::render('Index');
})->name('hei.index');

// The homepage's anonymous "Rate PHLGADIS" answers, throttled per visitor.
Route::post('/ratings', [SiteRatingController::class, 'store'])
    ->middleware('throttle:ratings')
    ->name('ratings.store');

// The website feedback form, which replaced the old system's Google Form.
Route::get('/feedback', [SiteFeedbackController::class, 'create'])->name('feedback.create');
Route::post('/feedback', [SiteFeedbackController::class, 'store'])
    ->middleware('throttle:feedback')
    ->name('feedback.store');

Route::inertia('/resources/definition-of-terms', 'resources/definition-of-terms')->name('resources.terms');
Route::inertia('/resources/gad-enabling-republic-acts', 'resources/gad-enabling-republic-acts')->name('resources.acts');
Route::inertia('/resources/issuances', 'resources/issuances')->name('resources.issuances');
Route::inertia('/resources/manuals', 'resources/manuals')->name('resources.manuals');

Route::inertia('/about', 'about')->name('about');
Route::inertia('/about/gad-herstory', 'about/gad-herstory')->name('about.herstory');
Route::inertia('/help/faq', 'help/faq')->name('help.faq');

Route::get('/surveys/{law}', [PublicSurveyController::class, 'show'])->whereIn('law', [
    'ra-7877',
    'ra-9262',
    'ra-9710',
    'ra-11313',
])->name('surveys.show');
Route::post('/surveys/{survey:slug}/responses', [PublicSurveyController::class, 'store'])
    ->middleware('throttle:survey-answers')
    ->name('surveys.responses.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('events', [EventController::class, 'index'])->name('events.index');
    Route::get('profile', MyProfileController::class)->name('my-profile');

    // People: profiles, following and search (docs/people-and-following.md).
    // Addressed by the account's public ULID, never its number.
    Route::whereUlid('person')->group(function () {
        Route::get('people/{person:ulid}', [PersonProfileController::class, 'show'])->name('people.show');
        Route::get('people/{person:ulid}/followers', [PersonProfileController::class, 'followers'])
            ->middleware('throttle:60,1')
            ->name('people.followers');
        Route::get('people/{person:ulid}/following', [PersonProfileController::class, 'following'])
            ->middleware('throttle:60,1')
            ->name('people.following');
        Route::post('people/{person:ulid}/follow', [FollowController::class, 'store'])
            ->middleware('throttle:30,1')
            ->name('people.follow');
        Route::delete('people/{person:ulid}/follow', [FollowController::class, 'destroy'])
            ->middleware('throttle:30,1')
            ->name('people.unfollow');
    });
    Route::get('search', [PeopleSearchController::class, 'index'])->name('search');
    // Asked as the reader types, a pause after each change.
    Route::get('search/people', [PeopleSearchController::class, 'suggestions'])
        ->middleware('throttle:90,1')
        ->name('search.people');

    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    // The bell asks every 30 seconds, and again whenever it opens.
    Route::get('notifications/recent', [NotificationController::class, 'recent'])
        ->middleware('throttle:60,1')
        ->name('notifications.recent');
    Route::get('notifications/summary', [NotificationController::class, 'summary'])
        ->middleware('throttle:60,1')
        ->name('notifications.summary');
    Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::whereUlid('notification')->group(function () {
        Route::get('notifications/{notification}', [NotificationController::class, 'open'])->name('notifications.open');
        Route::patch('notifications/{notification}', [NotificationController::class, 'update'])->name('notifications.update');
        Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    });

    Route::post('posts', [PostController::class, 'store'])->middleware('throttle:20,1')->name('posts.store');
    Route::get('posts/tag-suggestions', PostTagSuggestionController::class)
        ->middleware('throttle:60,1')
        ->name('posts.tag-suggestions');
    Route::get('posts/newer', NewerPostsController::class)
        ->middleware('throttle:30,1')
        ->name('posts.newer');
    Route::get('posts/{post}', [PostController::class, 'show'])->whereUlid('post')->name('posts.show');
    Route::put('posts/{post}', [PostController::class, 'update'])->whereUlid('post')->name('posts.update');
    Route::delete('posts/{post}', [PostController::class, 'destroy'])->whereUlid('post')->name('posts.destroy');
    Route::post('posts/{post}/share', PostShareController::class)->whereUlid('post')->middleware('throttle:20,1')->name('posts.share');
    Route::put('posts/{post}/homepage', PostHomepageController::class)->whereUlid('post')->name('posts.homepage.update');
    Route::get('posts/{post}/reactions', [PostReactionController::class, 'index'])
        ->whereUlid('post')
        ->middleware('throttle:60,1')
        ->name('posts.reactions.index');
    Route::put('posts/{post}/reaction', [PostReactionController::class, 'update'])
        ->whereUlid('post')
        ->middleware('throttle:60,1')
        ->name('posts.reaction.update');
    Route::delete('posts/{post}/reaction', [PostReactionController::class, 'destroy'])
        ->whereUlid('post')
        ->name('posts.reaction.destroy');
    Route::post('posts/{post}/comments', [PostCommentController::class, 'store'])
        ->whereUlid('post')
        ->middleware('throttle:30,1')
        ->name('posts.comments.store');
    Route::delete('comments/{comment}', [PostCommentController::class, 'destroy'])->name('comments.destroy');

    Route::get('community', CommunityController::class)->middleware('can:posts.view')->name('community');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('events', [GadEventController::class, 'index'])->middleware('can:events.view')->name('events.index');
        // GadEventPolicy: staff change their own region's events.
        Route::post('events', [GadEventController::class, 'store'])->middleware('can:create,'.GadEvent::class)->name('events.store');
        Route::put('events/{event}', [GadEventController::class, 'update'])->middleware('can:update,event')->name('events.update');
        Route::delete('events/{event}', [GadEventController::class, 'destroy'])->middleware('can:delete,event')->name('events.destroy');

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

        Route::get('feedback', [AdminSiteFeedbackController::class, 'index'])
            ->middleware('can:feedback.view')
            ->name('feedback.index');
        Route::get('feedback/export', [AdminSiteFeedbackController::class, 'export'])
            ->middleware('can:feedback.export')
            ->name('feedback.export');
        Route::delete('feedback/{siteFeedback}', [AdminSiteFeedbackController::class, 'destroy'])
            ->whereUlid('siteFeedback')
            ->middleware('can:delete,siteFeedback')
            ->name('feedback.destroy');

        Route::get('surveys', [SurveyController::class, 'index'])->middleware('can:surveys.view')->name('surveys.index');
        Route::post('surveys', [SurveyController::class, 'store'])->middleware('can:surveys.create')->name('surveys.store');
        Route::get('surveys/{survey}/edit', [SurveyController::class, 'edit'])->middleware('can:surveys.view')->name('surveys.edit');
        Route::put('surveys/{survey}', [SurveyController::class, 'update'])->middleware('can:surveys.update')->name('surveys.update');
        Route::post('surveys/{survey}/publish', [SurveyController::class, 'publish'])->middleware('can:surveys.publish')->name('surveys.publish');
        Route::patch('surveys/{survey}/archive', [SurveyController::class, 'archive'])->middleware('can:surveys.publish')->name('surveys.archive');
        Route::delete('surveys/{survey}', [SurveyController::class, 'destroy'])->middleware('can:surveys.delete')->name('surveys.destroy');
        Route::get('surveys/{survey}/summary', SurveySummaryController::class)->middleware('can:surveys.view')->name('surveys.summary');
        Route::get('surveys/{survey}/responses', [SurveyResponseController::class, 'index'])->middleware('can:survey-responses.view')->name('surveys.responses.index');
        Route::get('surveys/{survey}/responses/export', [SurveyResponseController::class, 'export'])->middleware('can:survey-responses.export')->name('surveys.responses.export');
        Route::get('surveys/{survey}/responses/{surveyResponse}', [SurveyResponseController::class, 'show'])->middleware('can:survey-responses.view')->name('surveys.responses.show');
        Route::delete('surveys/{survey}/responses/{surveyResponse}', [SurveyResponseController::class, 'destroy'])->middleware('can:survey-responses.delete')->name('surveys.responses.destroy');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/monitoring.php';
require __DIR__.'/quests.php';
