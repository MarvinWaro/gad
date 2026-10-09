<?php

use App\Enums\AchieveItem;
use App\Enums\PostFeeling;
use App\Enums\PostReactionType;
use App\Enums\SustainableDevelopmentGoal;
use App\Models\Post;
use App\Models\PostAchieveItem;
use App\Models\PostComment;
use App\Models\PostReaction;
use App\Models\PostSdg;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\CommunityFeed;
use App\Support\InstitutionName;
use Database\Seeders\RbacSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('public');
});

function communityMember(): User
{
    $user = User::factory()->create(['survey_hei_id' => createSurveyHei(['name' => fake()->unique()->company()])->id]);
    $user->assignRole('hei');

    return $user;
}

function communityModerator(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

function communityPost(User $author, array $attributes = []): Post
{
    return Post::query()->create([
        'user_id' => $author->id,
        'survey_hei_id' => $author->survey_hei_id,
        'body' => 'Orientation on the Safe Spaces Act for first-year students.',
        ...$attributes,
    ]);
}

test('HEI users share a post with photos, tagged with their institution', function () {
    $user = communityMember();

    $this->actingAs($user)
        ->post(route('posts.store'), [
            'body' => '18-Day Campaign culmination at the convention center.',
            'images' => [
                UploadedFile::fake()->image('stage.jpg', 1200, 800),
                UploadedFile::fake()->image('group.png', 800, 800),
            ],
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $post = Post::query()->with('images')->sole();

    expect($post->user_id)->toBe($user->id)
        ->and($post->survey_hei_id)->toBe($user->survey_hei_id)
        ->and($post->images)->toHaveCount(2)
        ->and($post->images->pluck('sort_order')->all())->toBe([0, 1]);
    Storage::disk('public')->assertExists($post->images->pluck('path')->all());

    // Each photo's size goes out with it, so the feed can shape its frame
    // before the photo loads.
    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.images.0.width', 1200)
            ->where('posts.data.0.images.0.height', 800)
            ->where('posts.data.0.images.1.width', 800)
            ->where('posts.data.0.images.1.height', 800)));
});

test('a phone photo turned by its Exif tag is stored with its upright size', function () {
    $path = exifJpeg(1200, 800, 6);

    $this->actingAs(communityMember())
        ->post(route('posts.store'), [
            'images' => [new UploadedFile($path, 'portrait.jpg', 'image/jpeg', null, true)],
        ])
        ->assertSessionHasNoErrors();

    $image = Post::query()->with('images')->sole()->images->sole();

    expect([$image->width, $image->height])->toBe([800, 1200]);

    unlink($path);
});

test('a post can be text only or photo only', function () {
    $user = communityMember();

    $this->actingAs($user)
        ->post(route('posts.store'), ['body' => 'Text only'])
        ->assertSessionHasNoErrors();

    $this->actingAs($user)
        ->post(route('posts.store'), ['images' => [UploadedFile::fake()->image('only.jpg')]])
        ->assertSessionHasNoErrors();

    expect(Post::query()->count())->toBe(2);
});

test('posts are validated', function (array $payload, string $field) {
    $this->actingAs(communityMember())
        ->post(route('posts.store'), $payload)
        ->assertSessionHasErrors($field);

    expect(Post::query()->count())->toBe(0);
})->with([
    'empty' => [['body' => ''], 'body'],
    'too many photos' => [['images' => array_map(fn () => UploadedFile::fake()->image('p.jpg'), range(1, Post::MAX_IMAGES + 1))], 'images'],
    'not a photo' => [['images' => [UploadedFile::fake()->create('report.pdf', 10, 'application/pdf')]], 'images.0'],
]);

test('a photo the server turned away for its size says so plainly', function () {
    $path = exifJpeg(1200, 800, 1);

    $this->actingAs(communityMember())
        ->post(route('posts.store'), [
            'images' => [new UploadedFile($path, 'phone.jpg', 'image/jpeg', UPLOAD_ERR_INI_SIZE, true)],
        ])
        ->assertSessionHasErrors(['images.0' => 'A photo did not finish uploading. Try again, or choose a smaller photo.']);

    expect(Post::query()->count())->toBe(0);

    unlink($path);
});

test('a post holds up to ten photos, kept in order', function () {
    $this->actingAs(communityMember())
        ->post(route('posts.store'), [
            'images' => array_map(fn (int $n) => UploadedFile::fake()->image("p{$n}.jpg"), range(1, Post::MAX_IMAGES)),
        ])
        ->assertSessionHasNoErrors();

    $post = Post::query()->with('images')->sole();

    expect($post->images)->toHaveCount(10)
        ->and($post->images->pluck('sort_order')->all())->toBe(range(0, 9));
});

test('authors add a feeling and tag active people, and the feed shows both', function () {
    $author = communityMember();
    $colleague = communityMember();
    $colleague->update(['name' => 'Ana Cruz']);
    $staff = communityModerator();
    $staff->update(['name' => 'Ben Reyes']);

    $this->actingAs($author)
        ->post(route('posts.store'), [
            'body' => 'Gender sensitivity training with our partners.',
            'feeling' => 'proud',
            'tags' => [$staff->id, $colleague->id],
        ])
        ->assertSessionHasNoErrors();

    $post = Post::query()->with('tags')->sole();

    expect($post->feeling)->toBe(PostFeeling::Proud)
        ->and($post->tags->pluck('id')->all())->toBe([$colleague->id, $staff->id]);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.feeling', ['value' => 'proud', 'label' => 'proud', 'emoji' => '🏅'])
            ->has('posts.data.0.tags', 2)
            ->where('posts.data.0.tags.0.name', 'Ana Cruz')
            ->where('posts.data.0.tags.0.affiliation', InstitutionName::display($colleague->hei->name))
            ->where('posts.data.0.tags.1.name', 'Ben Reyes')
            ->where('posts.data.0.tags.1.affiliation', 'CHED Central Office')));
});

test('a post without a feeling or tags shows neither', function () {
    $author = communityMember();
    communityPost($author);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.feeling', null)
            ->has('posts.data.0.tags', 0)));
});

test('feelings and tags are validated', function () {
    $author = communityMember();
    $active = communityMember();
    $pending = User::factory()->pending()->create();
    $inactive = User::factory()->inactive()->create();

    $cases = [
        [['feeling' => 'angry'], 'feeling'],
        [['tags' => [$pending->id]], 'tags.0'],
        [['tags' => [$inactive->id]], 'tags.0'],
        [['tags' => [$author->id]], 'tags.0'],
        [['tags' => [$active->id, $active->id]], 'tags.0'],
        [['tags' => [999999]], 'tags.0'],
    ];

    foreach ($cases as [$payload, $field]) {
        $this->actingAs($author)
            ->post(route('posts.store'), ['body' => 'Activity report', ...$payload])
            ->assertSessionHasErrors($field);
    }

    expect(Post::query()->count())->toBe(0);
});

test('authors say which SDGs and A.C.H.I.E.V.E. items a post supports, and the feed lists them in order', function () {
    $author = communityMember();

    // The composer sends multipart form data, so numbers arrive as strings.
    $this->actingAs($author)
        ->post(route('posts.store'), [
            'body' => 'Research colloquium on gender-responsive curricula.',
            'sdgs' => ['5', '4'],
            'achieve_items' => ['research-innovation', 'lifelong-learning'],
        ])
        ->assertSessionHasNoErrors();

    $post = Post::query()->with(['sdgs', 'achieveItems'])->sole();

    expect($post->sdgs->pluck('sdg')->all())
        ->toBe([SustainableDevelopmentGoal::QualityEducation, SustainableDevelopmentGoal::GenderEquality])
        ->and($post->achieveItems->pluck('item')->all())
        ->toEqualCanonicalizing([AchieveItem::ResearchInnovation, AchieveItem::LifelongLearning]);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.sdgs', [4, 5])
            ->where('posts.data.0.achieve_items', ['lifelong-learning', 'research-innovation'])));
});

test('a post without SDGs or A.C.H.I.E.V.E. items lists none', function () {
    $author = communityMember();
    communityPost($author);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->has('posts.data.0.sdgs', 0)
            ->has('posts.data.0.achieve_items', 0)));
});

test('SDGs and A.C.H.I.E.V.E. items are validated', function (array $payload, string $field) {
    $this->actingAs(communityMember())
        ->post(route('posts.store'), ['body' => 'Activity report', ...$payload])
        ->assertSessionHasErrors($field);

    expect(Post::query()->count())->toBe(0);
})->with([
    'more than three SDGs' => [['sdgs' => [1, 4, 5, 10]], 'sdgs'],
    'goal 0' => [['sdgs' => [0]], 'sdgs.0'],
    'goal 18' => [['sdgs' => [18]], 'sdgs.0'],
    'not a number' => [['sdgs' => ['five']], 'sdgs.0'],
    'the same goal twice' => [['sdgs' => [5, 5]], 'sdgs.0'],
    'more than three agenda items' => [['achieve_items' => ['lifelong-learning', 'human-capital', 'governance', 'public-service']], 'achieve_items'],
    'an unknown agenda item' => [['achieve_items' => ['excellence']], 'achieve_items.0'],
    'the same agenda item twice' => [['achieve_items' => ['governance', 'governance']], 'achieve_items.0'],
]);

test('a share carries its original\'s SDGs and A.C.H.I.E.V.E. items, not its own', function () {
    $original = communityPost(communityMember());
    $original->sdgs()->create(['sdg' => 5]);
    $original->achieveItems()->create(['item' => 'governance']);
    $sharer = communityMember();

    $this->actingAs($sharer)->post(route('posts.share', $original))->assertSessionHasNoErrors();

    $this->actingAs($sharer)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->has('posts.data.0.sdgs', 0)
            ->where('posts.data.0.shared_post.sdgs', [5])
            ->where('posts.data.0.shared_post.achieve_items', ['governance'])));
});

test('removing a post removes its SDGs and A.C.H.I.E.V.E. items', function () {
    $author = communityMember();

    $this->actingAs($author)->post(route('posts.store'), [
        'body' => 'Tree planting with the student council.',
        'sdgs' => [13, 15],
        'achieve_items' => ['public-service'],
    ]);

    $this->actingAs($author)->delete(route('posts.destroy', Post::query()->sole()))->assertRedirect();

    expect(PostSdg::query()->count())->toBe(0)
        ->and(PostAchieveItem::query()->count())->toBe(0);
});

test('SDG numbers and A.C.H.I.E.V.E. codes stay stable', function () {
    expect(array_map(fn (SustainableDevelopmentGoal $goal): int => $goal->value, SustainableDevelopmentGoal::cases()))
        ->toBe(range(1, 17))
        ->and(array_map(fn (AchieveItem $item): string => $item->value, AchieveItem::cases()))
        ->toBe([
            'lifelong-learning',
            'human-capital',
            'research-innovation',
            'internationalization',
            'data-analytics',
            'governance',
            'public-service',
        ]);
});

test('members give one reaction per post, change it, and take it back', function () {
    $post = communityPost(communityMember());
    $reader = communityMember();
    $summary = fn (array $counts, int $total, ?string $mine) => [
        'total' => $total,
        'counts' => $counts,
        'mine' => $mine,
        'recent' => $mine === null ? [] : [['id' => $reader->id, 'name' => $reader->name, 'type' => $mine]],
    ];

    $this->actingAs($reader)->putJson(route('posts.reaction.update', $post), ['type' => 'heart'])
        ->assertExactJson($summary(['heart' => 1, 'care' => 0, 'clap' => 0], 1, 'heart'));
    $this->actingAs($reader)->putJson(route('posts.reaction.update', $post), ['type' => 'heart'])
        ->assertExactJson($summary(['heart' => 1, 'care' => 0, 'clap' => 0], 1, 'heart'));
    $this->actingAs($reader)->putJson(route('posts.reaction.update', $post), ['type' => 'clap'])
        ->assertExactJson($summary(['heart' => 0, 'care' => 0, 'clap' => 1], 1, 'clap'));
    $this->actingAs($reader)->deleteJson(route('posts.reaction.destroy', $post))
        ->assertExactJson($summary(['heart' => 0, 'care' => 0, 'clap' => 0], 0, null));

    expect(PostReaction::query()->count())->toBe(0);
});

test('reactions are validated', function () {
    $post = communityPost(communityMember());

    $this->actingAs(communityMember())
        ->putJson(route('posts.reaction.update', $post), ['type' => 'like'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('type');

    $this->actingAs(communityMember())
        ->getJson(route('posts.reactions.index', ['post' => $post, 'type' => 'angry']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('type');
});

test('the feed sums reactions and names the latest ten reactors', function () {
    $author = communityMember();
    $post = communityPost($author);
    $reactors = User::factory()->count(11)->create();
    $reactors->each(fn (User $user, int $index) => $post->reactions()->create([
        'user_id' => $user->id,
        'type' => $index < 6 ? PostReactionType::Heart : PostReactionType::Care,
    ]));
    $post->reactions()->create(['user_id' => $author->id, 'type' => PostReactionType::Clap]);

    $this->actingAs($author)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.reactions.total', 12)
            ->where('posts.data.0.reactions.counts', ['heart' => 6, 'care' => 5, 'clap' => 1])
            ->where('posts.data.0.reactions.mine', 'clap')
            ->has('posts.data.0.reactions.recent', CommunityFeed::REACTORS_SHOWN)
            ->where('posts.data.0.reactions.recent.0', ['id' => $author->id, 'name' => $author->name, 'type' => 'clap'])
            ->where('posts.data.0.can_edit', true)
            ->where('posts.data.0.can_delete', true)));

    $this->actingAs(communityMember())
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.reactions.mine', null)
            ->where('posts.data.0.can_edit', false)
            ->where('posts.data.0.can_delete', false)));
});

test('the reactions list pages newest first, filters by reaction, and shares no private details', function () {
    $post = communityPost(communityMember());
    $member = communityMember();
    User::factory()->count(24)->create()->each(fn (User $user, int $index) => $post->reactions()->create([
        'user_id' => $user->id,
        'type' => $index % 3 === 0 ? PostReactionType::Clap : PostReactionType::Heart,
    ]));
    $post->reactions()->create(['user_id' => $member->id, 'type' => PostReactionType::Care]);

    $first = $this->actingAs($member)->getJson(route('posts.reactions.index', $post))->assertOk();

    expect($first->json('data'))->toHaveCount(20)
        ->and($first->json('data.0'))->toBe([
            'id' => $member->id,
            'ulid' => $member->ulid,
            'name' => $member->name,
            'avatar' => null,
            'affiliation' => InstitutionName::display($member->hei->name),
            'type' => 'care',
        ])
        ->and($first->json('meta.next_cursor'))->not->toBeNull();

    $second = $this->actingAs($member)
        ->getJson(route('posts.reactions.index', ['post' => $post, 'cursor' => $first->json('meta.next_cursor')]))
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.next_cursor', null);

    // The two pages together list everyone exactly once.
    expect(collect([...$first->json('data'), ...$second->json('data')])->pluck('id')->unique())->toHaveCount(25);

    $claps = $this->actingAs($member)->getJson(route('posts.reactions.index', ['post' => $post, 'type' => 'clap']));

    expect(collect($claps->json('data'))->pluck('type')->unique()->all())->toBe(['clap'])
        ->and($claps->json('data'))->toHaveCount(8);
});

test('removing a post removes its reactions', function () {
    $author = communityMember();
    $post = communityPost($author);
    $post->reactions()->create(['user_id' => communityMember()->id, 'type' => PostReactionType::Heart]);

    $this->actingAs($author)->delete(route('posts.destroy', $post))->assertRedirect();

    expect(PostReaction::query()->count())->toBe(0);
});

test('a returning reader learns how many posts are newer than the ones they have', function () {
    $reader = communityMember();
    $seen = communityPost(communityMember());
    // Posted within the same second: the id breaks the tie.
    communityPost(communityMember());
    $share = Post::query()->create([
        'user_id' => $reader->id,
        'survey_hei_id' => $reader->survey_hei_id,
        'shared_post_id' => $seen->id,
    ]);
    // Carried over with its original date: a newer id, but an older post.
    Post::query()->forceCreate([
        'user_id' => $reader->id,
        'survey_hei_id' => $reader->survey_hei_id,
        'body' => 'Imported from the old system.',
        'created_at' => now()->subYear(),
        'updated_at' => now()->subYear(),
    ]);

    $this->actingAs($reader)
        ->getJson(route('posts.newer', ['after' => $seen->id, 'at' => $seen->created_at?->toIso8601String()]))
        ->assertExactJson(['count' => 2]);
    // Any offset works; ids may come in either case.
    $this->actingAs($reader)
        ->getJson(route('posts.newer', [
            'after' => strtoupper($share->id),
            'at' => $share->created_at?->setTimezone('Asia/Manila')->toIso8601String(),
        ]))
        ->assertExactJson(['count' => 0]);
});

test('checking for newer posts needs a post, its time, and a signed-in member', function () {
    $post = communityPost(communityMember());
    $at = $post->created_at?->toIso8601String();

    $this->actingAs(communityMember())
        ->getJson(route('posts.newer', ['after' => 'not-a-post', 'at' => $at]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('after');
    $this->actingAs(communityMember())
        ->getJson(route('posts.newer', ['after' => $post->id, 'at' => 'yesterday-ish']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('at');
    $this->actingAs(communityMember())
        ->getJson(route('posts.newer'))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['after', 'at']);

    auth()->logout();
    $this->getJson(route('posts.newer', ['after' => $post->id, 'at' => $at]))->assertUnauthorized();
});

test('guests can neither react nor see who reacted', function () {
    $post = communityPost(communityMember());

    $this->putJson(route('posts.reaction.update', $post), ['type' => 'heart'])->assertUnauthorized();
    $this->deleteJson(route('posts.reaction.destroy', $post))->assertUnauthorized();
    $this->getJson(route('posts.reactions.index', $post))->assertUnauthorized();
});

test('members comment, and remove only their own comments', function () {
    $post = communityPost(communityMember());
    $commenter = communityMember();

    $this->actingAs($commenter)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Congratulations!'])
        ->assertCreated()
        ->assertJsonPath('comment.body', 'Congratulations!')
        ->assertJsonPath('comment.can_delete', true)
        ->assertJsonPath('comments_count', 1);

    $this->actingAs($commenter)
        ->postJson(route('posts.comments.store', $post), ['body' => ''])
        ->assertUnprocessable();

    $comment = PostComment::query()->sole();

    $this->actingAs(communityMember())
        ->deleteJson(route('comments.destroy', $comment))
        ->assertForbidden();

    $this->actingAs($commenter)
        ->deleteJson(route('comments.destroy', $comment))
        ->assertOk()
        ->assertJsonPath('comments_count', 0);
});

test('authors edit and delete their own posts, and photos are removed', function () {
    $author = communityMember();

    $this->actingAs($author)->post(route('posts.store'), [
        'body' => 'Original',
        'images' => [UploadedFile::fake()->image('one.jpg')],
    ]);
    $post = Post::query()->with('images')->sole();
    $path = $post->images->first()->path;

    $this->actingAs($author)
        ->put(route('posts.update', $post), ['body' => 'Edited'])
        ->assertSessionHasNoErrors();
    expect($post->fresh()->body)->toBe('Edited');

    $this->actingAs(communityMember())
        ->put(route('posts.update', $post), ['body' => 'Hijacked'])
        ->assertForbidden();
    $this->actingAs(communityMember())
        ->delete(route('posts.destroy', $post))
        ->assertForbidden();

    $this->actingAs($author)->delete(route('posts.destroy', $post))->assertRedirect();

    expect(Post::query()->exists())->toBeFalse();
    Storage::disk('public')->assertMissing($path);
});

test('a post without photos cannot be edited to empty', function () {
    $author = communityMember();
    $post = communityPost($author);

    $this->actingAs($author)
        ->put(route('posts.update', $post), ['body' => ''])
        ->assertSessionHasErrors('body');
});

test('moderators remove any post or comment', function () {
    $post = communityPost(communityMember());
    $comment = $post->comments()->create(['user_id' => communityMember()->id, 'body' => 'Spam']);
    $moderator = communityModerator();

    $this->actingAs($moderator)->deleteJson(route('comments.destroy', $comment))->assertOk();
    $this->actingAs($moderator)->delete(route('posts.destroy', $post))->assertRedirect();

    expect(Post::query()->exists())->toBeFalse();
});

test('the community page is for CHED staff, and only moderators remove others\' posts', function () {
    $post = communityPost(communityMember());

    $this->actingAs(communityModerator())
        ->get(route('community'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('community/index')
            // The feed loads just after the page, behind its skeleton.
            ->missing('posts')
            ->loadDeferredProps(fn (Assert $reload) => $reload
                ->has('posts.data', 1)
                ->where('posts.data.0.can_delete', true)));

    // CHED employees read and post in Gender Mainstreaming without moderating it.
    $employee = User::factory()->create();
    $employee->assignRole('ched-employee');
    $this->actingAs($employee)
        ->get(route('community'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.can_delete', false)));
    $this->delete(route('posts.destroy', $post))->assertForbidden();
    $this->post(route('posts.store'), ['body' => 'An announcement from the regional office.'])->assertSessionHasNoErrors();
    expect(Post::query()->where('user_id', $employee->id)->exists())->toBeTrue();
    $this->get(route('posts.show', $post))->assertInertia(fn (Assert $page) => $page->where('feedUrl', route('community')));

    $this->actingAs(communityMember())->get(route('community'))->assertForbidden();
});

test('a CHED post speaks for the office of its author, never one fixed region', function () {
    $region = SurveyRegion::query()->create(['name' => 'Regional Office IV', 'is_active' => true]);
    $regional = User::factory()->regionalOffice($region)->create();
    $regional->assignRole('ched-employee');
    $central = User::factory()->nationalOffice()->create();
    $central->assignRole('admin');
    $school = communityMember();
    communityPost($school, ['body' => 'From a school.']);
    communityPost($regional, ['body' => 'From Region IV.', 'survey_hei_id' => null]);
    communityPost($central, ['body' => 'From the Central Office.', 'survey_hei_id' => null]);
    // Tagging the regional staff member names their office too.
    Post::query()->where('body', 'From a school.')->sole()->tags()->attach($regional->id);

    $this->actingAs($central)->get(route('community'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data', function ($posts) use ($school) {
                $by = collect($posts)->keyBy('body');

                return $by['From Region IV.']['office'] === 'CHED Regional Office IV'
                    && $by['From the Central Office.']['office'] === 'CHED Central Office'
                    && $by['From a school.']['office'] === null
                    && $by['From a school.']['hei']['display_name'] === InstitutionName::display($school->hei->name)
                    && $by['From a school.']['tags'][0]['affiliation'] === 'CHED Regional Office IV';
            })));

    // The staff composer is labelled with the viewer's own office.
    $this->actingAs($regional)->get(route('community'))
        ->assertInertia(fn (Assert $page) => $page->where('auth.affiliation', 'CHED Regional Office IV'));
});

test('the feed names CHED offices without a query per post', function () {
    $viewer = communityModerator();
    $count = function () use ($viewer): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        CommunityFeed::page($viewer);
        $queries = count(DB::getQueryLog());
        DB::disableQueryLog();

        return $queries;
    };
    $staffPost = function (): void {
        $author = User::factory()->regionalOffice(SurveyRegion::query()->create(['name' => 'Regional Office '.Str::random(4), 'is_active' => true]))->create();
        $tagged = User::factory()->regionalOffice(SurveyRegion::query()->create(['name' => 'Regional Office '.Str::random(4), 'is_active' => true]))->create();
        communityPost($author, ['survey_hei_id' => null])->tags()->attach($tagged->id);
    };

    $staffPost();
    // The first read also loads the viewer's roles, once.
    $count();
    $one = $count();
    foreach (range(1, 4) as $index) {
        $staffPost();
    }

    expect($count())->toBe($one);
});

test('accounts awaiting approval cannot post', function () {
    $pending = User::factory()->pending()->create();

    $this->actingAs($pending)
        ->post(route('posts.store'), ['body' => 'Hello'])
        ->assertRedirect(route('login'));

    expect(Post::query()->exists())->toBeFalse();
});

test('members share a post to the feed with an optional message', function () {
    $author = communityMember();
    $original = communityPost($author, ['feeling' => 'proud']);
    $sharer = communityMember();

    $this->actingAs($sharer)
        ->post(route('posts.share', $original), ['body' => 'Worth a read, fellow focal persons.'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $share = Post::query()->whereKeyNot($original->id)->sole();

    expect($share->user_id)->toBe($sharer->id)
        ->and($share->survey_hei_id)->toBe($sharer->survey_hei_id)
        ->and($share->shared_post_id)->toBe($original->id)
        ->and($share->body)->toBe('Worth a read, fellow focal persons.');

    $this->actingAs($sharer)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->where('posts.data.0.id', $share->id)
            ->where('posts.data.0.shared_post.id', $original->id)
            ->where('posts.data.0.shared_post.author.name', $author->name)
            ->where('posts.data.0.shared_post.feeling.value', 'proud')
            ->where('posts.data.1.id', $original->id)
            ->where('posts.data.1.shares_count', 1)
            ->where('posts.data.1.shared_post', null)));
});

test('a share can have no message of its own, and keeps it empty when edited', function () {
    $original = communityPost(communityMember());
    $sharer = communityMember();

    $this->actingAs($sharer)->post(route('posts.share', $original))->assertSessionHasNoErrors();
    $share = Post::query()->where('shared_post_id', $original->id)->sole();

    expect($share->body)->toBeNull();

    $this->actingAs($sharer)
        ->put(route('posts.update', $share), ['body' => ''])
        ->assertSessionHasNoErrors();
});

test('sharing a share passes along the original', function () {
    $original = communityPost(communityMember());
    $first = communityMember();
    $this->actingAs($first)->post(route('posts.share', $original));
    $share = Post::query()->where('user_id', $first->id)->sole();

    $second = communityMember();
    $this->actingAs($second)->post(route('posts.share', $share))->assertSessionHasNoErrors();

    expect(Post::query()->where('user_id', $second->id)->sole()->shared_post_id)->toBe($original->id);
});

test('removing a post removes its shares', function () {
    $author = communityMember();
    $original = communityPost($author);
    $this->actingAs(communityMember())->post(route('posts.share', $original));

    $this->actingAs($author)->delete(route('posts.destroy', $original))->assertRedirect();

    expect(Post::query()->count())->toBe(0);
});

test('share messages are validated and guests cannot share', function () {
    $original = communityPost(communityMember());

    $this->actingAs(communityMember())
        ->post(route('posts.share', $original), ['body' => str_repeat('a', 5001)])
        ->assertSessionHasErrors('body');

    auth()->logout();
    $this->post(route('posts.share', $original))->assertRedirect(route('login'));

    expect(Post::query()->count())->toBe(1);
});

test('a post has its own page for members, linking back to their feed', function () {
    $post = communityPost(communityMember());

    $this->actingAs(communityMember())
        ->get(route('posts.show', $post))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('posts/show')
            ->where('post.id', $post->id)
            ->where('feedUrl', route('dashboard')));

    $this->actingAs(communityModerator())
        ->get(route('posts.show', $post))
        ->assertInertia(fn (Assert $page) => $page->where('feedUrl', route('community')));
});

test('post pages are for signed-in members only', function () {
    $post = communityPost(communityMember());

    $this->get(route('posts.show', $post))->assertRedirect(route('login'));
    $this->actingAs(communityMember())->get('/posts/999999')->assertNotFound();
    $this->actingAs(communityMember())->get('/posts/'.Str::ulid())->assertNotFound();
});

test('removing a post from its own page returns to the feed', function () {
    $author = communityMember();
    $post = communityPost($author);

    $this->actingAs($author)
        ->from(route('posts.show', $post))
        ->delete(route('posts.destroy', $post))
        ->assertRedirect(route('dashboard'));

    $other = communityPost($author);

    $this->actingAs($author)
        ->from(route('dashboard'))
        ->delete(route('posts.destroy', $other))
        ->assertRedirect(route('dashboard'));
});

test('replies thread one level deep and name whom they answer', function () {
    $author = communityMember();
    $post = communityPost($author);
    $ana = communityMember();
    $ben = communityMember();

    $top = $this->actingAs($ana)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Congratulations!'])
        ->assertCreated()
        ->assertJsonPath('comment.parent_id', null)
        ->assertJsonPath('comment.reply_to', null)
        ->json('comment.id');

    $reply = $this->actingAs($ben)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Agreed.', 'parent_id' => $top])
        ->assertCreated()
        ->assertJsonPath('comment.parent_id', $top)
        ->assertJsonPath('comment.reply_to.id', $ana->id)
        ->json('comment.id');

    // A reply to a reply joins the same thread and names that reply's author.
    $this->actingAs($author)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Thank you both!', 'parent_id' => $reply])
        ->assertCreated()
        ->assertJsonPath('comment.parent_id', $top)
        ->assertJsonPath('comment.reply_to.id', $ben->id)
        ->assertJsonPath('comment.is_post_author', true)
        ->assertJsonPath('comments_count', 3);

    // Answering yourself names no one.
    $this->actingAs($ana)
        ->postJson(route('posts.comments.store', $post), ['body' => 'Also, see you there.', 'parent_id' => $top])
        ->assertJsonPath('comment.reply_to', null);
});

test('the feed nests replies under their comment', function () {
    $author = communityMember();
    $post = communityPost($author);
    $ana = communityMember();
    $top = $post->comments()->create(['user_id' => $ana->id, 'body' => 'Great work!']);
    $post->comments()->create(['user_id' => $author->id, 'parent_id' => $top->id, 'reply_to_user_id' => $ana->id, 'body' => 'Thank you!']);

    $this->actingAs($ana)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page->loadDeferredProps(fn (Assert $reload) => $reload
            ->has('posts.data.0.comments', 1)
            ->where('posts.data.0.comments_count', 2)
            ->where('posts.data.0.has_more_comments', false)
            ->where('posts.data.0.comments.0.is_post_author', false)
            ->has('posts.data.0.comments.0.replies', 1)
            ->where('posts.data.0.comments.0.replies.0.body', 'Thank you!')
            ->where('posts.data.0.comments.0.replies.0.is_post_author', true)
            ->where('posts.data.0.comments.0.replies.0.reply_to.name', $ana->name)));
});

test('replies must answer a comment on the same post', function () {
    $other = communityPost(communityMember());
    $elsewhere = $other->comments()->create(['user_id' => communityMember()->id, 'body' => 'Hello']);
    $post = communityPost(communityMember());

    $this->actingAs(communityMember())
        ->postJson(route('posts.comments.store', $post), ['body' => 'Hi', 'parent_id' => $elsewhere->id])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('parent_id');
});

test('removing a comment removes its replies', function () {
    $post = communityPost(communityMember());
    $commenter = communityMember();
    $top = $post->comments()->create(['user_id' => $commenter->id, 'body' => 'First']);
    $post->comments()->create(['user_id' => communityMember()->id, 'parent_id' => $top->id, 'body' => 'Reply']);

    $this->actingAs($commenter)
        ->deleteJson(route('comments.destroy', $top))
        ->assertOk()
        ->assertJsonPath('comments_count', 0);

    expect(PostComment::query()->count())->toBe(0);
});
