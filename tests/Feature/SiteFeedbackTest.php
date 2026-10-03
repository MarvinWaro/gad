<?php

use App\Enums\FeedbackType;
use App\Enums\NotificationKind;
use App\Models\ActivityLog;
use App\Models\SiteFeedback;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'NOTRE DAME OF MARBEL UNIVERSITY']);
    $this->region = $this->hei->cluster->region;
    $this->otherRegion = SurveyRegion::query()->create(['name' => 'Regional Office XI', 'is_active' => true]);
    $this->otherHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $this->otherRegion->id, 'name' => 'Davao', 'is_active' => true])->id,
        'name' => 'University of Southeastern Philippines',
        'is_active' => true,
    ]);
});

function feedbackStaff(string $role, ?SurveyRegion $region = null): User
{
    $factory = User::factory();
    $user = ($region === null ? $factory->nationalOffice() : $factory->regionalOffice($region))->create();
    $user->assignRole($role);

    return $user;
}

/** @param  array<string, mixed>  $attributes */
function storedFeedback(array $attributes = []): SiteFeedback
{
    return SiteFeedback::query()->create([
        'type' => FeedbackType::Comment,
        'feedback' => 'The dashboard is easy to read.',
        ...$attributes,
    ]);
}

test('anyone can open the feedback form, with the old form\'s questions and the directory', function () {
    $this->get(route('feedback.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('feedback')
            ->where('types.2', ['code' => 'bug', 'label' => 'Bug Reports'])
            ->where('questions.choices.0.label', 'How difficult is reading characters on the screen?')
            ->where('questions.choices.1.options.1.label', 'A little Confusing')
            ->where('questions.scales.0.low', 'Strongly Disagree')
            ->where('questions.scales.1.items.2.label', 'User Friendliness of the system')
            ->has('regions', 2)
            // Institutions come once a region is picked.
            ->where('region', null)
            ->where('heis', [])
            ->where('prefill', ['region_id' => '', 'hei_id' => ''])
            ->where('sent', false));
});

test('a signed-in visitor finds their own region and institution filled in', function () {
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');

    $this->actingAs($member)->get(route('feedback.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('prefill', ['region_id' => (string) $this->region->id, 'hei_id' => (string) $this->hei->id])
            // Their region's institutions come with the page, so theirs shows.
            ->where('region', $this->region->id)
            ->where('heis', [['id' => $this->hei->id, 'name' => 'NOTRE DAME OF MARBEL UNIVERSITY', 'region_id' => $this->region->id]]));

    $staff = feedbackStaff('ched-employee', $this->otherRegion);
    $this->actingAs($staff)->get(route('feedback.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('prefill', ['region_id' => (string) $this->otherRegion->id, 'hei_id' => '']));
});

test('picking a region loads only its institutions', function () {
    $this->get(route('feedback.create', ['region' => $this->otherRegion->id]))->assertInertia(fn (Assert $page) => $page
        ->reloadOnly(['region', 'heis'], fn (Assert $reload) => $reload
            ->where('region', $this->otherRegion->id)
            ->where('heis', [[
                'id' => $this->otherHei->id,
                'name' => 'University of Southeastern Philippines',
                'region_id' => $this->otherRegion->id,
            ]])
            ->missing('questions')));

    $this->get(route('feedback.create', ['region' => 999999]))
        ->assertInertia(fn (Assert $page) => $page->where('region', null)->where('heis', []));
});

test('only the type and the feedback are required', function () {
    $this->post(route('feedback.store'), ['type' => 'bug', 'feedback' => "  The export button does nothing.  \n"])
        ->assertRedirect(route('feedback.create'))
        ->assertSessionHas('feedback_sent', true)
        ->assertSessionHasNoErrors();

    $feedback = SiteFeedback::query()->sole();
    expect($feedback->type)->toBe(FeedbackType::Bug)
        ->and($feedback->feedback)->toBe('The export button does nothing.')
        ->and($feedback->suggestions)->toBeNull()
        ->and($feedback->reading_ease)->toBeNull()
        ->and($feedback->email)->toBeNull()
        ->and($feedback->survey_region_id)->toBeNull();

    $this->get(route('feedback.create'))->assertInertia(fn (Assert $page) => $page->where('sent', true));
});

test('a full answer keeps every score, and the institution decides the cluster', function () {
    $this->post(route('feedback.store'), [
        'type' => 'feature',
        'feedback' => 'Please add a calendar export.',
        'suggestions' => 'An iCal link would do.',
        'reading_ease' => 4,
        'information_clarity' => 3,
        'terms_consistent' => 5,
        'messages_consistent' => 4,
        'prompts_clear' => 4,
        'progress_informed' => 3,
        'aesthetically_pleasing' => 5,
        'navigation_ease' => 5,
        'exploring_ease' => 2,
        'user_friendliness' => 4,
        'email' => 'maria@example.edu.ph',
        'name' => 'Maria Santos',
        'region_id' => $this->region->id,
        'hei_id' => $this->hei->id,
    ])->assertSessionHasNoErrors();

    $feedback = SiteFeedback::query()->sole();
    expect($feedback->only(['reading_ease', 'terms_consistent', 'exploring_ease', 'user_friendliness']))
        ->toBe(['reading_ease' => 4, 'terms_consistent' => 5, 'exploring_ease' => 2, 'user_friendliness' => 4])
        ->and($feedback->email)->toBe('maria@example.edu.ph')
        ->and($feedback->survey_region_id)->toBe($this->region->id)
        ->and($feedback->survey_cluster_id)->toBe($this->hei->survey_cluster_id)
        ->and($feedback->survey_hei_id)->toBe($this->hei->id);
});

test('answers outside the form are refused', function (array $input, string $field) {
    $this->post(route('feedback.store'), [
        'type' => 'comment',
        'feedback' => 'Looks good.',
        ...$input,
    ])->assertSessionHasErrors($field);

    expect(SiteFeedback::query()->count())->toBe(0);
})->with([
    'no type' => [['type' => ''], 'type'],
    'unknown type' => [['type' => 'praise'], 'type'],
    'no feedback' => [['feedback' => '   '], 'feedback'],
    'long feedback' => [['feedback' => str_repeat('a', 2001)], 'feedback'],
    'score below the scale' => [['terms_consistent' => 0], 'terms_consistent'],
    'score above the scale' => [['navigation_ease' => 6], 'navigation_ease'],
    'five on a four-choice question' => [['reading_ease' => 5], 'reading_ease'],
    'not an email' => [['email' => 'maria at school'], 'email'],
    'an institution without its region' => [fn () => ['hei_id' => $this->hei->id], 'region_id'],
    'an institution from another region' => [fn () => ['region_id' => $this->region->id, 'hei_id' => $this->otherHei->id], 'hei_id'],
]);

test('a bot that fills the hidden field is thanked but not stored', function () {
    $this->post(route('feedback.store'), ['type' => 'comment', 'feedback' => 'Buy now', 'website' => 'https://spam.test'])
        ->assertRedirect(route('feedback.create'))
        ->assertSessionHasNoErrors();

    expect(SiteFeedback::query()->count())->toBe(0);
});

test('a visitor may send five an hour, counted apart from the other public forms', function () {
    $this->post(route('ratings.store'), ['rating' => 5]);
    foreach (range(1, 5) as $attempt) {
        $this->post(route('feedback.store'), ['type' => 'comment', 'feedback' => "Note {$attempt}."])->assertRedirect();
    }

    $this->post(route('feedback.store'), ['type' => 'comment', 'feedback' => 'One too many.'])->assertTooManyRequests();
    expect(SiteFeedback::query()->count())->toBe(5);
});

test('admins are told, by region, in one notice that counts up', function () {
    $central = feedbackStaff('admin');
    $regional = feedbackStaff('admin', $this->region);
    $elsewhere = feedbackStaff('admin', $this->otherRegion);
    $focal = feedbackStaff('gad-focal-person', $this->region);

    $send = fn (?int $regionId) => $this->post(route('feedback.store'), ['type' => 'comment', 'feedback' => 'Nice.', 'region_id' => $regionId]);
    $send($this->region->id);
    $send($this->region->id);

    $notice = $regional->notifications()->sole();
    expect($notice->kind)->toBe(NotificationKind::SiteFeedback)
        ->and($notice->count)->toBe(2)
        ->and($central->notifications()->sole()->count)->toBe(2)
        ->and($elsewhere->notifications()->count())->toBe(0)
        ->and($focal->notifications()->count())->toBe(0);

    $this->actingAs($regional)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.actor', null)
        ->assertJsonPath('data.0.sentence', ['before' => '2 new website feedback responses', 'subject' => null, 'after' => ''])
        ->assertJsonPath('data.0.url', route('admin.feedback.index'));

    // Feedback that names no region reaches every admin.
    $send(null);

    expect($elsewhere->notifications()->sole()->count)->toBe(1)
        ->and($central->notifications()->sole()->count)->toBe(3);
});

test('only staff who may read feedback open the list', function () {
    $this->actingAs(feedbackStaff('gad-focal-person'))->get(route('admin.feedback.index'))->assertForbidden();
    $this->actingAs(feedbackStaff('admin'))->get(route('admin.feedback.index'))->assertOk();
});

test('a regional office reads its own region\'s feedback and feedback that names none', function () {
    $own = storedFeedback(['feedback' => 'Own region.', 'survey_region_id' => $this->region->id]);
    $unplaced = storedFeedback(['feedback' => 'No region.']);
    storedFeedback(['feedback' => 'Another region.', 'survey_region_id' => $this->otherRegion->id]);

    $this->actingAs(feedbackStaff('admin', $this->region))->get(route('admin.feedback.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/feedback/index')
            ->has('feedback.data', 2)
            ->where('feedback.data', fn ($rows) => collect($rows)->pluck('id')->sort()->values()->all() === collect([$own->id, $unplaced->id])->sort()->values()->all())
            ->where('summary.total', 2));

    $this->actingAs(feedbackStaff('admin'))->get(route('admin.feedback.index'))
        ->assertInertia(fn (Assert $page) => $page->has('feedback.data', 3));
});

test('the summary counts types and averages each question', function () {
    storedFeedback(['type' => FeedbackType::Bug, 'terms_consistent' => 5, 'navigation_ease' => 2, 'reading_ease' => 4, 'email' => 'a@example.com']);
    storedFeedback(['type' => FeedbackType::Bug, 'terms_consistent' => 4, 'prompts_clear' => 3]);
    storedFeedback(['type' => FeedbackType::Question, 'terms_consistent' => 2]);

    $this->actingAs(feedbackStaff('admin'))->get(route('admin.feedback.index', ['type' => 'bug']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('feedback.data', 2)
            ->where('summary.total', 2)
            ->where('summary.with_contact', 1)
            // Type counts ignore the chosen type.
            ->where('summary.types.0', ['code' => 'comment', 'label' => 'Comments/Recommendations', 'count' => 0])
            ->where('summary.types.1.count', 1)
            ->where('summary.types.2.count', 2)
            ->where('summary.scores.terms_consistent', ['average' => 4.5, 'answers' => 2, 'counts' => [0, 0, 0, 1, 1]])
            ->where('summary.scores.reading_ease.counts', [0, 0, 0, 1])
            ->where('summary.scores.exploring_ease.average', null)
            // (5 + 4 + 3) / 3 answers on the agreement scale.
            ->where('summary.scales.agreement', 4)
            ->where('summary.scales.ease', 2));
});

test('the list filters by place and by search', function () {
    storedFeedback(['feedback' => 'Login is slow.', 'survey_region_id' => $this->region->id, 'survey_cluster_id' => $this->hei->survey_cluster_id, 'survey_hei_id' => $this->hei->id]);
    storedFeedback(['feedback' => 'Charts are lovely.', 'name' => 'Login Tester']);
    storedFeedback(['feedback' => 'Another place.', 'survey_region_id' => $this->otherRegion->id]);
    $admin = feedbackStaff('admin');

    $this->actingAs($admin)->get(route('admin.feedback.index', ['hei' => $this->hei->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('feedback.data', 1)
            ->where('feedback.data.0.place', ['region' => 'Regional Office XII', 'hei' => 'Notre Dame of Marbel University']));
    $this->actingAs($admin)->get(route('admin.feedback.index', ['search' => 'login']))
        ->assertInertia(fn (Assert $page) => $page->has('feedback.data', 2));
});

test('the export streams what is in view, safe to open in a spreadsheet', function () {
    storedFeedback(['feedback' => '=HYPERLINK("http://bad.test")', 'reading_ease' => 2, 'terms_consistent' => 4, 'survey_region_id' => $this->region->id]);
    storedFeedback(['feedback' => 'Out of reach.', 'survey_region_id' => $this->otherRegion->id]);
    $admin = feedbackStaff('admin', $this->region);

    $csv = $this->actingAs($admin)->get(route('admin.feedback.export'))->assertOk()->streamedContent();

    expect($csv)->toContain('Submitted,"Feedback Type",Feedback,"Suggestions for improvement","How difficult is reading characters on the screen?"')
        ->and($csv)->toContain("'=HYPERLINK")
        ->and($csv)->toContain('"Somewhat Hard"')
        ->and($csv)->toContain('"4 of 5"')
        ->and($csv)->not->toContain('Out of reach.')
        ->and(ActivityLog::query()->where('action', 'exported')->where('module', 'site-feedback')->count())->toBe(1);
});

test('admins delete feedback within reach, and the deletion is logged', function () {
    $own = storedFeedback(['survey_region_id' => $this->region->id]);
    $elsewhere = storedFeedback(['survey_region_id' => $this->otherRegion->id]);
    $admin = feedbackStaff('admin', $this->region);

    $this->actingAs($admin)->delete(route('admin.feedback.destroy', $elsewhere))->assertNotFound();
    $this->actingAs(feedbackStaff('gad-focal-person', $this->region))->delete(route('admin.feedback.destroy', $own))->assertForbidden();
    $this->actingAs($admin)->delete(route('admin.feedback.destroy', $own))->assertRedirect();

    expect(SiteFeedback::query()->pluck('id')->all())->toBe([$elsewhere->id])
        ->and(ActivityLog::query()->where('action', 'deleted')->where('module', 'site-feedback')->sole()->subject_label)
        ->toBe('“The dashboard is easy to read.”');
});
