<?php

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\NotificationKind;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Inbox HEI']);
    $this->member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $this->member->assignRole('hei');
    $this->commenter = User::factory()->create(['name' => 'Fictional Commenter', 'survey_hei_id' => $this->hei->id]);
});

/**
 * A comment on one of the recipient's posts, as Notifier writes it, a
 * minute older than the one before.
 */
function inboxNotice(User $recipient, User $actor, string $body = 'Our GAD orientation', array $attributes = []): Notification
{
    static $minutes = 0;
    $post = Post::query()->create(['user_id' => $recipient->id, 'survey_hei_id' => $recipient->survey_hei_id, 'body' => $body]);
    $entry = ActivityLog::query()->create([
        'user_id' => $actor->id,
        'actor_name' => $actor->name,
        'survey_hei_id' => $recipient->survey_hei_id,
        'module' => ActivityModule::Community,
        'action' => ActivityAction::Commented,
        'subject_type' => 'post',
        'subject_id' => $post->id,
        'subject_label' => "“{$body}”",
        'ip_address' => '203.0.113.7',
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/141.0',
    ]);

    return Notification::query()->create([
        'user_id' => $recipient->id,
        'kind' => NotificationKind::PostCommented,
        'activity_log_id' => $entry->id,
        'notified_at' => now()->subMinutes(++$minutes),
        ...$attributes,
    ]);
}

test('every page carries the bell\'s count, and the bell can ask for it again', function () {
    inboxNotice($this->member, $this->commenter);
    $latest = inboxNotice($this->member, $this->commenter, attributes: ['notified_at' => now()]);
    inboxNotice($this->member, $this->commenter, attributes: ['read_at' => now()]);

    $this->actingAs($this->member)->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('inbox.unread', 2)
            ->where('inbox.latest_at', $latest->notified_at->toIso8601ZuluString()));

    $this->getJson(route('notifications.summary'))
        ->assertOk()
        ->assertExactJson(['unread' => 2, 'latest_at' => $latest->notified_at->toIso8601ZuluString()]);
});

test('the bell lists five at a time, newest first, without the entry\'s address or device', function () {
    $notices = collect(range(1, 7))->map(fn (int $index) => inboxNotice($this->member, $this->commenter, "Post {$index}"));

    $first = $this->actingAs($this->member)->getJson(route('notifications.recent'))
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('data.0.id', $notices[0]->id)
        ->assertJsonPath('data.0.kind', ['code' => 'post_commented', 'label' => 'Comments on your posts', 'tone' => 'info'])
        ->assertJsonPath('data.0.module', ['code' => 'community', 'label' => 'Gender Mainstreaming'])
        ->assertJsonPath('data.0.actor.name', 'Fictional Commenter')
        ->assertJsonPath('data.0.sentence', ['before' => 'commented on your post', 'subject' => '“Post 1”', 'after' => ''])
        ->assertJsonPath('data.0.url', route('posts.show', $notices[0]->activity->subject_id))
        ->assertJsonPath('data.0.read_at', null)
        ->assertJsonPath('inbox.unread', 7);

    expect($first->getContent())->not->toContain('203.0.113.7')
        ->and($first->getContent())->not->toContain('Chrome');

    $this->getJson(route('notifications.recent', ['cursor' => $first->json('meta.next_cursor')]))
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.1.id', $notices[6]->id)
        ->assertJsonPath('meta.next_cursor', null);
});

test('opening a notification reads it and goes to its record, or back when the record is gone', function () {
    $notice = inboxNotice($this->member, $this->commenter);
    $gone = inboxNotice($this->member, $this->commenter, 'A removed post');
    Post::query()->whereKey($gone->activity->subject_id)->delete();

    $this->actingAs($this->member)->get(route('notifications.open', $notice))
        ->assertRedirect(route('posts.show', $notice->activity->subject_id));
    expect($notice->fresh()->read_at)->not->toBeNull();

    $this->get(route('notifications.open', $gone))
        ->assertRedirect(route('notifications.index'));
    expect($gone->fresh()->read_at)->not->toBeNull();
});

test('marking read or unread, all as read, and deleting answer with the new count', function () {
    $one = inboxNotice($this->member, $this->commenter);
    $two = inboxNotice($this->member, $this->commenter);
    inboxNotice($this->member, $this->commenter);

    $this->actingAs($this->member)->patchJson(route('notifications.update', $one), ['read' => true])
        ->assertOk()
        ->assertJsonPath('notification.id', $one->id)
        ->assertJsonPath('inbox.unread', 2);
    expect($one->fresh()->read_at)->not->toBeNull();

    $this->patchJson(route('notifications.update', $one), ['read' => false])
        ->assertJsonPath('notification.read_at', null)
        ->assertJsonPath('inbox.unread', 3);

    $this->patchJson(route('notifications.update', $one), [])->assertUnprocessable()->assertJsonValidationErrors('read');

    $this->deleteJson(route('notifications.destroy', $two))->assertOk()->assertJsonPath('inbox.unread', 2);
    expect(Notification::query()->find($two->id))->toBeNull()
        ->and(ActivityLog::query()->find($two->activity_log_id))->not->toBeNull();

    $this->postJson(route('notifications.read-all'))->assertOk()->assertJsonPath('inbox.unread', 0);
    expect($this->member->notifications()->unread()->count())->toBe(0);
});

test('no one can open, change or delete someone else\'s notifications', function () {
    $notice = inboxNotice($this->member, $this->commenter);
    $stranger = User::factory()->create();
    $stranger->assignRole('admin');

    $this->actingAs($stranger)->get(route('notifications.open', $notice))->assertNotFound();
    $this->patchJson(route('notifications.update', $notice), ['read' => true])->assertNotFound();
    $this->deleteJson(route('notifications.destroy', $notice))->assertNotFound();
    $this->postJson(route('notifications.read-all'))->assertOk();

    expect($notice->fresh()->read_at)->toBeNull();
    $this->getJson(route('notifications.recent'))->assertJsonCount(0, 'data');
});

test('signed-out visitors get no count and no notifications', function () {
    $this->get(route('home'))->assertInertia(fn (Assert $page) => $page->where('inbox', null));
    $this->getJson(route('notifications.summary'))->assertUnauthorized();
});

test('the page lists every notification with tabs, type, module and search', function () {
    inboxNotice($this->member, $this->commenter, 'Safe Spaces orientation');
    inboxNotice($this->member, $this->commenter, 'Women\'s Month', ['read_at' => now()]);
    $approval = inboxNotice($this->member, User::factory()->create(['name' => 'Fictional Administrator']), 'Account', [
        'kind' => NotificationKind::AccountApproved,
    ]);

    $this->actingAs($this->member)->get(route('notifications.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('notifications/index')
            ->has('notifications.data', 3)
            ->where('filters', ['status' => '', 'search' => '', 'kind' => '', 'module' => ''])
            ->where('kinds', [
                ['value' => 'account_approved', 'label' => 'Account approved'],
                ['value' => 'post_commented', 'label' => 'Comments on your posts'],
            ])
            ->where('modules', [
                ['value' => 'community', 'label' => 'Gender Mainstreaming'],
                ['value' => 'users', 'label' => 'Users'],
            ]));

    $this->get(route('notifications.index', ['status' => 'unread']))
        ->assertInertia(fn (Assert $page) => $page->has('notifications.data', 2));
    $this->get(route('notifications.index', ['kind' => 'account_approved']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('notifications.data', 1)
            ->where('notifications.data.0.id', $approval->id)
            ->where('notifications.data.0.url', route('dashboard')));
    $this->get(route('notifications.index', ['module' => 'community']))
        ->assertInertia(fn (Assert $page) => $page->has('notifications.data', 2));
    $this->get(route('notifications.index', ['search' => 'Safe Spaces']))
        ->assertInertia(fn (Assert $page) => $page->has('notifications.data', 1));
    $this->get(route('notifications.index', ['search' => 'Fictional Administrator']))
        ->assertInertia(fn (Assert $page) => $page->has('notifications.data', 1));

    $this->get(route('notifications.index', ['kind' => 'not-a-kind']))->assertSessionHasErrors('kind');
});
