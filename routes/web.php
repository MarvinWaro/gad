<?php

use App\Http\Controllers\Admin\CarouselSlideController;
use App\Http\Controllers\Admin\EventCancellationController;
use App\Http\Controllers\Admin\EventCheckInController;
use App\Http\Controllers\Admin\EventGuestController;
use App\Http\Controllers\Admin\EventRegistrationController as EventRegistrantController;
use App\Http\Controllers\Admin\EventScannerController;
use App\Http\Controllers\Admin\GadEventController;
use App\Http\Controllers\Admin\SiteFeedbackController as AdminSiteFeedbackController;
use App\Http\Controllers\Admin\SurveyController;
use App\Http\Controllers\Admin\SurveyResponseController;
use App\Http\Controllers\Admin\SurveySummaryController;
use App\Http\Controllers\CertificateDocumentController;
use App\Http\Controllers\CertificateFileController;
use App\Http\Controllers\CertificateRequestController;
use App\Http\Controllers\CertificateVerificationController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventRegistrationController;
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
use App\Http\Controllers\PublicEventController;
use App\Http\Controllers\PublicSurveyController;
use App\Http\Controllers\SiteFeedbackController;
use App\Http\Controllers\SiteRatingController;
use App\Http\Resources\PublicEventResource;
use App\Models\CarouselSlide;
use App\Models\GadEvent;
use App\Models\SiteSetting;
use App\Models\Survey;
use App\Support\CertificateFiles;
use App\Support\HomepageStories;
use App\Support\PublicEvents;
use App\Support\PublicUpload;
use App\Support\StudentStatistics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
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
                    'src' => PublicUpload::url($slide->image_path),
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
        // The next GAD events still on, those on now first, for the region
        // in ?events_region= or every region (docs/event-registration.md).
        'events' => function () use ($request): array {
            $region = PublicEvents::region($request->integer('events_region') ?: null);

            return [
                'region' => $region,
                'regions' => PublicEvents::regions(),
                'events' => PublicEventResource::collection(PublicEvents::upcoming($region))->resolve($request),
            ];
        },
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

// Where a certificate's QR leads: whether PHLGADIS gave it (docs/certificates.md).
Route::get('/verify', [CertificateVerificationController::class, 'show'])
    ->middleware('throttle:30,1')
    ->name('verify.index');
Route::get('/verify/{number}', [CertificateVerificationController::class, 'show'])
    ->where('number', '[A-Za-z0-9 -]{1,30}')
    ->middleware('throttle:30,1')
    ->name('verify.show');

Route::inertia('/resources/definition-of-terms', 'resources/definition-of-terms')->name('resources.terms');
Route::inertia('/resources/gad-enabling-republic-acts', 'resources/gad-enabling-republic-acts')->name('resources.acts');
Route::inertia('/resources/issuances', 'resources/issuances')->name('resources.issuances');
Route::inertia('/resources/manuals', 'resources/manuals')->name('resources.manuals');

// The public website's GAD events (docs/event-registration.md): the list,
// and each event's page, addressed by its public ULID.
Route::get('/gad-events', [PublicEventController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('public-events.index');
Route::get('/gad-events/{event:ulid}', [PublicEventController::class, 'show'])
    ->whereUlid('event')
    ->middleware('throttle:60,1')
    ->name('public-events.show');

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
    // A certificate's printed contents, for its holder or the staff who
    // release it; its signatures and logos come through signed links.
    Route::get('certificates/{certificate}/document', [CertificateDocumentController::class, 'show'])
        ->whereUlid('certificate')
        ->middleware(['can:download,certificate', 'throttle:30,1'])
        ->name('certificates.document');
    Route::get('certificate-files/{folder}/{file}', [CertificateFileController::class, 'show'])
        ->whereIn('folder', CertificateFiles::FOLDERS)
        ->where('file', '[A-Za-z0-9]{1,64}\.(png|jpe?g)')
        ->middleware('signed')
        ->name('certificate-files.show');

    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('events', [EventController::class, 'index'])->name('events.index');
    // An event's page, and joining or leaving it (docs/event-registration.md).
    // Addressed by its public ULID, so its link can be shared.
    Route::whereUlid('event')->group(function () {
        Route::get('events/{event:ulid}', [EventController::class, 'show'])
            ->middleware('can:view,event')
            ->name('events.show');
        Route::post('events/{event:ulid}/registration', [EventRegistrationController::class, 'store'])
            ->middleware(['can:join,event', 'throttle:30,1'])
            ->name('events.registration.store');
        Route::delete('events/{event:ulid}/registration', [EventRegistrationController::class, 'destroy'])
            ->middleware(['can:join,event', 'throttle:30,1'])
            ->name('events.registration.destroy');
        // Asking for a certificate after missing a day (docs/certificates.md).
        Route::post('events/{event:ulid}/certificate-requests', [CertificateRequestController::class, 'store'])
            ->middleware(['can:view,event', 'throttle:10,1'])
            ->name('events.certificate-requests.store');
    });
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
        // Who joined, and closing or reopening registration (docs/event-registration.md).
        Route::get('events/{event}/registrations', [EventRegistrantController::class, 'index'])
            ->middleware('can:viewRegistrations,event')
            ->name('events.registrations.index');
        Route::put('events/{event}/registration', [EventRegistrantController::class, 'update'])
            ->middleware('can:update,event')
            ->name('events.registration.update');
        // Keeping the list by hand: people with accounts, and guests without.
        Route::middleware('can:update,event')->group(function () {
            Route::get('events/{event}/people', [EventRegistrantController::class, 'people'])
                ->middleware('throttle:90,1')
                ->name('events.people');
            Route::post('events/{event}/registrations', [EventRegistrantController::class, 'store'])
                ->name('events.registrations.store');
            Route::put('events/{event}/registrations/{registration}/attendance', [EventRegistrantController::class, 'attendance'])
                ->whereUlid('registration')->scopeBindings()
                ->name('events.registrations.attendance');
            Route::delete('events/{event}/registrations/{registration}', [EventRegistrantController::class, 'destroy'])
                ->whereUlid('registration')->scopeBindings()
                ->name('events.registrations.destroy');
            Route::post('events/{event}/guests', [EventGuestController::class, 'store'])->name('events.guests.store');
            Route::put('events/{event}/guests/{guest}', [EventGuestController::class, 'update'])
                ->whereUlid('guest')->scopeBindings()
                ->name('events.guests.update');
            Route::delete('events/{event}/guests/{guest}', [EventGuestController::class, 'destroy'])
                ->whereUlid('guest')->scopeBindings()
                ->name('events.guests.destroy');
            Route::post('events/{event}/guests/{guest}/certificates', [EventGuestController::class, 'certificate'])
                ->whereUlid('guest')->scopeBindings()
                ->name('events.guests.certificates.store');
            // Calling it off, or putting it back on.
            Route::put('events/{event}/cancellation', [EventCancellationController::class, 'update'])
                ->name('events.cancellation.update');
        });

        // The QR scanner (docs/event-check-in.md). GadEventPolicy::checkIn:
        // staff check people in at the events they see, today only.
        Route::get('scanner', [EventScannerController::class, 'show'])->middleware('can:events.check-in')->name('scanner');
        Route::get('events/{event}/check-ins', [EventCheckInController::class, 'index'])
            ->middleware(['can:checkIn,event', 'throttle:60,1'])
            ->name('events.check-ins.index');
        Route::post('events/{event}/check-ins', [EventCheckInController::class, 'store'])
            ->middleware(['can:checkIn,event', 'throttle:120,1'])
            ->name('events.check-ins.store');
        Route::delete('events/{event}/check-ins/{checkIn}', [EventCheckInController::class, 'destroy'])
            ->whereUlid('checkIn')->scopeBindings()
            ->middleware(['can:checkIn,event', 'throttle:60,1'])
            ->name('events.check-ins.destroy');

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
