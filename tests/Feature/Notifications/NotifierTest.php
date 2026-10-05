<?php

use App\Actions\Monitoring\ManageMonitoringReport;
use App\Actions\Monitoring\SubmitChecklist;
use App\Enums\ChecklistType;
use App\Enums\NotificationKind;
use App\Jobs\NotifyAllAccounts;
use App\Models\ActivityLog;
use App\Models\GadEvent;
use App\Models\MonitoringReport;
use App\Models\Notification;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\Notifier;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Notice HEI']);
    $this->region = $this->hei->cluster->region;
    $this->otherRegion = SurveyRegion::query()->create(['name' => 'Fictional Other Region', 'is_active' => true]);
});

/** An account at an HEI, with an HEI role. */
function noticeMember(SurveyHei $hei, string $role = 'hei'): User
{
    $user = User::factory()->create(['survey_hei_id' => $hei->id]);
    $user->assignRole($role);

    return $user;
}

/** CHED staff in a regional office, or the Central Office with none. */
function noticeStaff(string $role, ?SurveyRegion $region = null): User
{
    $factory = User::factory();
    $user = ($region ? $factory->regionalOffice($region) : $factory->nationalOffice())->create();
    $user->assignRole($role);

    return $user;
}

function noticePost(User $author): Post
{
    return Post::query()->create([
        'user_id' => $author->id,
        'survey_hei_id' => $author->survey_hei_id,
        'body' => 'Orientation on the Safe Spaces Act for first-year students.',
    ]);
}

/** The kinds a person has been told about, oldest first. */
function noticesOf(User $user): array
{
    return $user->notifications()->oldest('created_at')->oldest('id')->get()
        ->map(fn (Notification $notification): string => $notification->kind->value)
        ->all();
}

test('a comment tells the post\'s author, and a reply tells the person it answers', function () {
    $author = noticeMember($this->hei);
    $commenter = noticeMember($this->hei);
    $third = noticeMember($this->hei);
    $post = noticePost($author);

    $this->actingAs($commenter)->postJson(route('posts.comments.store', $post), ['body' => 'Well done!'])->assertCreated();
    expect(noticesOf($author))->toBe(['post_commented']);

    $comment = PostComment::query()->sole();
    // The author answers: the commenter hears of it, the author is not told of their own reply.
    $this->actingAs($author)->postJson(route('posts.comments.store', $post), ['body' => 'Thank you!', 'parent_id' => $comment->id])->assertCreated();
    expect(noticesOf($commenter))->toBe(['comment_replied'])
        ->and(noticesOf($author))->toBe(['post_commented']);

    // Someone else answers the commenter: the commenter hears of the reply, the author of the comment.
    $this->actingAs($third)->postJson(route('posts.comments.store', $post), ['body' => 'Agreed.', 'parent_id' => $comment->id])->assertCreated();
    expect(noticesOf($commenter))->toBe(['comment_replied', 'comment_replied'])
        ->and(noticesOf($author))->toBe(['post_commented', 'post_commented']);

    // Commenting on your own post tells no one.
    $this->actingAs($author)->postJson(route('posts.comments.store', $post), ['body' => 'More photos soon.'])->assertCreated();
    expect(Notification::query()->count())->toBe(4);
});

test('the first reaction tells the author once, a change updates it, and taking it back removes it', function () {
    $author = noticeMember($this->hei);
    $member = noticeMember($this->hei);
    $post = noticePost($author);

    $this->actingAs($member)->putJson(route('posts.reaction.update', $post), ['type' => 'heart'])->assertOk();
    $notice = Notification::query()->sole();
    expect($notice->kind)->toBe(NotificationKind::PostReacted)
        ->and($notice->user_id)->toBe($author->id)
        ->and($notice->activity->properties)->toBe(['reaction' => 'heart']);

    $notice->update(['read_at' => now()]);
    $this->actingAs($member)->putJson(route('posts.reaction.update', $post), ['type' => 'clap'])->assertOk();
    $notice->refresh();
    expect(Notification::query()->count())->toBe(1)
        ->and($notice->activity->properties)->toBe(['reaction' => 'clap'])
        ->and($notice->read_at)->not->toBeNull();

    $this->actingAs($member)->deleteJson(route('posts.reaction.destroy', $post))->assertOk();
    expect(Notification::query()->count())->toBe(0);

    // Reacting to your own post tells no one.
    $this->actingAs($author)->putJson(route('posts.reaction.update', $post), ['type' => 'care'])->assertOk();
    expect(Notification::query()->count())->toBe(0);
});

test('sharing tells the original author, and tagging tells the people tagged who can sign in', function () {
    $author = noticeMember($this->hei);
    $sharer = noticeMember($this->hei);
    $tagged = noticeMember($this->hei);
    $post = noticePost($author);

    $this->actingAs($sharer)->post(route('posts.share', $post), ['body' => 'Worth reading.'])->assertSessionHasNoErrors();
    $share = Post::query()->whereNotNull('shared_post_id')->sole();
    // Sharing a share passes the original along, and tells its author.
    $this->actingAs($tagged)->post(route('posts.share', $share))->assertSessionHasNoErrors();

    expect(noticesOf($author))->toBe(['post_shared', 'post_shared'])
        ->and(noticesOf($sharer))->toBe([]);

    $this->actingAs($author)->post(route('posts.store'), [
        'body' => 'Our CODI orientation, with the committee.',
        'tags' => [$tagged->id, $sharer->id],
    ])->assertSessionHasNoErrors();

    expect(noticesOf($tagged))->toBe(['post_tagged'])
        ->and(noticesOf($sharer))->toBe(['post_tagged']);
});

test('a moderator removing a post or comment tells its author, and removing your own tells no one', function () {
    $author = noticeMember($this->hei);
    $moderator = noticeStaff('admin');
    $post = noticePost($author);
    $comment = $post->comments()->create(['user_id' => $author->id, 'body' => 'An off-topic aside.']);
    $own = noticePost($author);

    $this->actingAs($moderator)->deleteJson(route('comments.destroy', $comment))->assertOk();
    $this->actingAs($moderator)->delete(route('posts.destroy', $post))->assertSessionHasNoErrors();
    $this->actingAs($author)->delete(route('posts.destroy', $own))->assertSessionHasNoErrors();

    expect(noticesOf($author))->toBe(['comment_removed', 'post_removed']);
});

test('a submitted report tells the reviewers whose office covers it, and a review tells the HEI\'s focal persons', function () {
    Storage::fake('monitoring');
    $focal = noticeMember($this->hei, 'hei-focal');
    $colleague = noticeMember($this->hei, 'hei-focal');
    $plainMember = noticeMember($this->hei, 'hei');
    $reviewer = noticeStaff('ched-focal', $this->region);
    $central = noticeStaff('ched-focal');
    $elsewhere = noticeStaff('ched-focal', $this->otherRegion);
    $viewer = noticeStaff('ched-employee', $this->region);
    $away = noticeStaff('ched-focal', $this->region);
    $away->update(['status' => 'inactive']);
    $workflow = app(ManageMonitoringReport::class);

    $report = $workflow->open($focal, ['academic_year' => '2026-2027', 'semester' => 1]);
    $report->currentRevision()->update(['finalized_at' => now()]);
    $workflow->submit($focal, $report, $report->fresh()->lock_version, UploadedFile::fake()->create('signed.pdf', 10, 'application/pdf'));

    expect(noticesOf($reviewer))->toBe(['report_submitted'])
        ->and(noticesOf($central))->toBe(['report_submitted'])
        ->and(noticesOf($elsewhere))->toBe([])
        ->and(noticesOf($viewer))->toBe([])
        ->and(noticesOf($away))->toBe([]);

    $workflow->review($reviewer, $report, ['lock_version' => $report->fresh()->lock_version, 'decision' => 'returned', 'comment' => 'Attach the CODI roster.']);

    expect(noticesOf($focal))->toBe(['report_returned'])
        ->and(noticesOf($colleague))->toBe(['report_returned'])
        ->and(noticesOf($plainMember))->toBe([])
        ->and($focal->notifications()->sole()->activity->properties['comment'])->toBe('Attach the CODI roster.');

    $report = MonitoringReport::query()->sole();
    $report->currentRevision()->update(['finalized_at' => now()]);
    $workflow->submit($focal, $report, $report->fresh()->lock_version, UploadedFile::fake()->create('signed.pdf', 10, 'application/pdf'));
    $workflow->review($central, $report, ['lock_version' => $report->fresh()->lock_version, 'decision' => 'reviewed']);

    expect(noticesOf($colleague))->toBe(['report_returned', 'report_reviewed'])
        ->and(noticesOf($reviewer))->toBe(['report_submitted', 'report_submitted']);
});

test('a GAD survey answer tells the reviewers whose office covers the HEI', function () {
    $focal = noticeMember($this->hei, 'hei-focal');
    $reviewer = noticeStaff('ched-focal', $this->region);
    $elsewhere = noticeStaff('ched-focal', $this->otherRegion);

    app(SubmitChecklist::class)->handle($focal, ChecklistType::Training, '2026-2027', ['gender-sensitivity']);
    app(SubmitChecklist::class)->handle($focal, ChecklistType::Training, '2026-2027', ['gender-sensitivity', 'gad-agenda']);

    expect(noticesOf($reviewer))->toBe(['gad_survey_submitted', 'gad_survey_submitted'])
        ->and(noticesOf($elsewhere))->toBe([]);

    $this->actingAs($reviewer)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence', [
            'before' => 'updated the',
            'subject' => 'GAD Training Survey, AY 2026-2027',
            'after' => 'for Fictional Notice HEI',
        ])
        ->assertJsonPath('data.1.sentence.before', 'submitted the');
});

test('a registration waiting for approval tells the user managers of its region, and approval tells the person', function () {
    $manager = noticeStaff('admin', $this->region);
    $central = noticeStaff('admin');
    $elsewhere = noticeStaff('admin', $this->otherRegion);
    $employee = noticeStaff('ched-employee', $this->region);

    $this->post(route('register.store'), registrationPayload($this->hei, ['email' => 'pending@example.test']));
    auth()->logout();
    $pending = User::query()->where('email', 'pending@example.test')->sole();

    expect(noticesOf($manager))->toBe(['account_pending'])
        ->and(noticesOf($central))->toBe(['account_pending'])
        ->and(noticesOf($elsewhere))->toBe([])
        ->and(noticesOf($employee))->toBe([]);

    $this->actingAs($manager)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.actor.name', 'Test User')
        ->assertJsonPath('data.0.sentence.before', 'registered from Fictional Notice HEI and is waiting for approval');

    $this->actingAs($manager)->patch(route('settings.users.status', $pending), ['status' => 'active'])->assertSessionHasNoErrors();

    expect(noticesOf($pending))->toBe(['account_approved']);
});

test('instant registration tells no one, since there is nothing to approve', function () {
    $manager = noticeStaff('admin', $this->region);
    $this->region->update(['instant_registration' => true]);

    $this->post(route('register.store'), registrationPayload($this->hei, ['email' => 'instant@example.test']));

    expect(noticesOf($manager))->toBe([]);
});

test('a new GAD event is announced in the background', function () {
    $creator = noticeStaff('admin');
    $payload = [
        'title' => 'Regional GAD Focal Persons Training',
        'category' => 'training',
        'is_all_day' => false,
        'starts_at' => '2026-10-02T09:00',
        'ends_at' => '2026-10-02T16:00',
    ];

    Queue::fake();
    $this->actingAs($creator)->post(route('admin.events.store'), $payload)->assertSessionHasNoErrors();

    Queue::assertPushed(NotifyAllAccounts::class, fn (NotifyAllAccounts $job): bool => $job->kind === NotificationKind::EventCreated);
    expect(Notification::query()->count())->toBe(0);
});

test('the announcement tells every active account but the creator, once even when it runs again', function () {
    $creator = noticeStaff('admin');
    $member = noticeMember($this->hei);
    $staff = noticeStaff('ched-employee', $this->otherRegion);
    $pending = User::factory()->pending()->create(['survey_hei_id' => $this->hei->id]);

    $this->actingAs($creator)->post(route('admin.events.store'), [
        'title' => 'Regional GAD Focal Persons Training',
        'category' => 'training',
        'is_all_day' => false,
        'starts_at' => '2026-10-02T09:00',
        'ends_at' => '2026-10-02T16:00',
    ])->assertSessionHasNoErrors();

    $entry = ActivityLog::query()->where('subject_type', 'event')->sole();
    (new NotifyAllAccounts(NotificationKind::EventCreated, $entry->id))->handle(app(Notifier::class));

    expect(noticesOf($member))->toBe(['event_created'])
        ->and(noticesOf($staff))->toBe(['event_created'])
        ->and(noticesOf($creator))->toBe([])
        ->and(noticesOf($pending))->toBe([]);

    // A deleted event is not announced.
    $event = GadEvent::query()->sole();
    $event->delete();
    Notification::query()->delete();
    (new NotifyAllAccounts(NotificationKind::EventCreated, $entry->id))->handle(app(Notifier::class));
    expect(Notification::query()->count())->toBe(0);
});

test('survey answers count up one notice per survey until it is read', function () {
    $this->seed(SurveySeeder::class);
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $version = $survey->versions()->firstOrFail();
    $manager = noticeStaff('admin', $this->region);
    $central = noticeStaff('admin');
    $elsewhere = noticeStaff('admin', $this->otherRegion);
    $employee = noticeStaff('ched-employee', $this->region);
    $answer = fn (?int $region): SurveyResponse => SurveyResponse::query()->create([
        'survey_version_id' => $version->id,
        'public_reference' => 'RA7877-'.Str::upper(Str::random(10)),
        'age' => 20,
        'sex' => 'female',
        'respondent_group' => 'student',
        'survey_region_id' => $region,
        'answers' => ['experiences' => ['none'], 'perpetrators' => []],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
    ]);
    $notifier = app(Notifier::class);

    $notifier->surveyResponseReceived($answer($this->region->id));
    $notifier->surveyResponseReceived($answer($this->region->id));

    $notice = $manager->notifications()->sole();
    expect($notice->kind)->toBe(NotificationKind::SurveyResponses)
        ->and($notice->count)->toBe(2)
        ->and($notice->activity_log_id)->toBeNull()
        ->and($central->notifications()->sole()->count)->toBe(2)
        ->and(noticesOf($elsewhere))->toBe([])
        ->and(noticesOf($employee))->toBe([]);

    $this->actingAs($manager)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.actor', null)
        ->assertJsonPath('data.0.sentence', ['before' => '2 new responses to', 'subject' => $survey->title, 'after' => ''])
        ->assertJsonPath('data.0.url', route('admin.surveys.responses.index', $survey));

    // Read, the next answer starts a new notice; one naming no region reaches every manager.
    $notice->update(['read_at' => now()]);
    $notifier->surveyResponseReceived($answer(null));

    expect($manager->notifications()->count())->toBe(2)
        ->and($elsewhere->notifications()->sole()->count)->toBe(1)
        ->and($central->notifications()->sole()->count)->toBe(3);
});

test('survey answers also reach the region\'s CHED Focals and the focal persons of the HEI chosen', function () {
    $this->seed(SurveySeeder::class);
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $version = $survey->versions()->firstOrFail();
    $chedFocal = noticeStaff('ched-focal', $this->region);
    $chedFocalElsewhere = noticeStaff('ched-focal', $this->otherRegion);
    $heiFocal = noticeMember($this->hei, 'hei-focal');
    $heiMember = noticeMember($this->hei);
    $neighbourFocal = noticeMember(createSurveyHei(['name' => 'Fictional Neighbour HEI']), 'hei-focal');
    $answer = fn (?SurveyHei $hei): SurveyResponse => SurveyResponse::query()->create([
        'survey_version_id' => $version->id,
        'public_reference' => 'RA7877-'.Str::upper(Str::random(10)),
        'age' => 20,
        'sex' => 'female',
        'respondent_group' => 'student',
        'survey_region_id' => $this->region->id,
        'survey_cluster_id' => $hei?->survey_cluster_id,
        'survey_hei_id' => $hei?->id,
        'answers' => ['experiences' => ['none'], 'perpetrators' => []],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
    ]);
    $notifier = app(Notifier::class);

    $notifier->surveyResponseReceived($answer($this->hei));
    $notifier->surveyResponseReceived($answer($this->hei));
    // An answer naming no HEI reaches the region's staff only.
    $notifier->surveyResponseReceived($answer(null));

    expect($chedFocal->notifications()->sole()->count)->toBe(3)
        ->and($heiFocal->notifications()->sole()->count)->toBe(2)
        ->and(noticesOf($chedFocalElsewhere))->toBe([])
        ->and(noticesOf($heiMember))->toBe([])
        ->and(noticesOf($neighbourFocal))->toBe([]);

    // Each opens what they may read: the Summary, or their HEI's home and its counts.
    $this->actingAs($chedFocal)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence', ['before' => '3 new responses to', 'subject' => $survey->title, 'after' => ''])
        ->assertJsonPath('data.0.url', route('admin.surveys.summary', $survey));
    $this->actingAs($heiFocal)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.sentence', ['before' => '2 new responses to', 'subject' => $survey->title, 'after' => ''])
        ->assertJsonPath('data.0.url', route('dashboard'));
});

test('a public survey answer reaches the managers without slowing or naming the respondent', function () {
    $this->seed(SurveySeeder::class);
    $manager = noticeStaff('admin', $this->region);
    $survey = Survey::query()->where('slug', 'ra-7877')->sole();
    $version = $survey->draftVersion();
    $version->update(['retention_days' => 365, 'status' => 'published', 'published_at' => now()]);
    $region = SurveyRegion::query()->where('name', 'Regional Office XII')->sole();
    $cluster = SurveyCluster::query()->where('survey_region_id', $region->id)->firstOrFail();

    $this->post(route('surveys.responses.store', $survey), [
        ...respondentFollowUps(),
        'version_id' => $version->id,
        'age' => 24,
        'sex' => 'female',
        'respondent_group' => 'student',
        'region_id' => $region->id,
        'hei_id' => $this->hei->id,
        'experiences' => ['none'],
        'perpetrators' => [],
        'other_relative_details' => [],
        'consent' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $notice = $manager->notifications()->sole();
    expect($notice->kind)->toBe(NotificationKind::SurveyResponses)
        ->and($notice->subject_type)->toBe('survey')
        ->and($notice->subject_id)->toBe((string) $survey->id)
        ->and(ActivityLog::query()->count())->toBe(0);
});

test('a notice that cannot be written never undoes the action it tells of', function () {
    $author = noticeMember($this->hei);
    $commenter = noticeMember($this->hei);
    $post = noticePost($author);
    Schema::drop('notifications');

    $this->actingAs($commenter)->postJson(route('posts.comments.store', $post), ['body' => 'Well done!'])->assertCreated();

    expect(PostComment::query()->count())->toBe(1)
        ->and(ActivityLog::query()->where('action', 'commented')->count())->toBe(1);
});
