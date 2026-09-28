<?php

use App\Models\SiteRating;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

function ratingsUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('visitors can rate PHLGADIS anonymously', function () {
    $this->from('/')
        ->post(route('ratings.store'), [
            'rating' => 4,
            'suggestion' => "  Add more GAD resources.  \n",
        ])
        ->assertRedirect('/');

    $rating = SiteRating::query()->sole();
    expect($rating->rating)->toBe(4)
        ->and($rating->suggestion)->toBe('Add more GAD resources.')
        // Nothing that could identify the visitor is even a column.
        ->and(Schema::getColumnListing('site_ratings'))
        ->toEqualCanonicalizing(['id', 'rating', 'suggestion', 'created_at', 'updated_at']);

    $this->post(route('ratings.store'), ['rating' => 5, 'suggestion' => '   '])
        ->assertSessionHasNoErrors();
    expect(SiteRating::query()->where('rating', 5)->sole()->suggestion)->toBeNull();
});

test('a rating must be one to five stars and a suggestion at most 1000 characters', function (array $input, string $field) {
    $this->post(route('ratings.store'), $input)->assertSessionHasErrors($field);

    expect(SiteRating::query()->count())->toBe(0);
})->with([
    'missing' => [[], 'rating'],
    'zero' => [['rating' => 0], 'rating'],
    'six' => [['rating' => 6], 'rating'],
    'not a number' => [['rating' => 'five'], 'rating'],
    'long suggestion' => [['rating' => 3, 'suggestion' => str_repeat('a', 1001)], 'suggestion'],
]);

test('a bot that fills the hidden field is thanked but not stored', function () {
    $this->from('/')
        ->post(route('ratings.store'), ['rating' => 1, 'website' => 'https://spam.test'])
        ->assertRedirect('/')
        ->assertSessionHasNoErrors();

    expect(SiteRating::query()->count())->toBe(0);
});

test('switching the button off hides it and refuses ratings', function () {
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('ratingButton', true));

    $this->actingAs(ratingsUser('admin'))
        ->put(route('settings.ratings.button'), ['enabled' => false])
        ->assertRedirect();
    auth()->logout();

    expect(SiteSetting::ratingButtonEnabled())->toBeFalse();
    $this->get('/')->assertInertia(fn (Assert $page) => $page->where('ratingButton', false));
    $this->post(route('ratings.store'), ['rating' => 5])->assertNotFound();
    expect(SiteRating::query()->count())->toBe(0);
});

test('the ratings page needs the view permission, and actions their own', function () {
    $this->get(route('settings.ratings.index'))->assertRedirect(route('login'));

    $this->actingAs(ratingsUser('hei'))
        ->get(route('settings.ratings.index'))
        ->assertForbidden();

    $focal = ratingsUser('gad-focal-person');
    $rating = SiteRating::query()->create(['rating' => 2]);
    $this->actingAs($focal)
        ->get(route('settings.ratings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/ratings')
            ->where('permissions.export', false)
            ->where('permissions.delete', false)
            ->where('permissions.update', false));
    $this->actingAs($focal)->get(route('settings.ratings.export'))->assertForbidden();
    $this->actingAs($focal)->delete(route('settings.ratings.destroy', $rating))->assertForbidden();
    $this->actingAs($focal)->put(route('settings.ratings.button'), ['enabled' => false])->assertForbidden();
});

test('the ratings page summarises and filters the ratings', function () {
    foreach ([5, 5, 4, 3, 1] as $stars) {
        SiteRating::query()->create(['rating' => $stars, 'suggestion' => $stars === 1 ? 'Too slow.' : null]);
    }

    $admin = ratingsUser('admin');
    $this->actingAs($admin)
        ->get(route('settings.ratings.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.total', 5)
            ->where('summary.average', 3.6)
            ->where('summary.withSuggestions', 1)
            ->where('summary.distribution', [
                ['rating' => 5, 'count' => 2],
                ['rating' => 4, 'count' => 1],
                ['rating' => 3, 'count' => 1],
                ['rating' => 2, 'count' => 0],
                ['rating' => 1, 'count' => 1],
            ])
            ->where('ratings.total', 5)
            ->where('buttonEnabled', true)
            ->where('permissions.export', true));

    $this->actingAs($admin)
        ->get(route('settings.ratings.index', ['rating' => 5]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.rating', 5)
            ->where('ratings.total', 2)
            // The summary always covers every rating.
            ->where('summary.total', 5));

    $this->actingAs($admin)
        ->get(route('settings.ratings.index', ['rating' => 9]))
        ->assertInertia(fn (Assert $page) => $page->where('filters.rating', null));
});

test('admins can export ratings as CSV, with formula-like suggestions made safe', function () {
    SiteRating::query()->create(['rating' => 2, 'suggestion' => '=HYPERLINK("http://evil.test")']);
    SiteRating::query()->create(['rating' => 5, 'suggestion' => 'Great, thank you']);

    $csv = $this->actingAs(ratingsUser('admin'))
        ->get(route('settings.ratings.export'))
        ->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8')
        ->streamedContent();

    expect($csv)->toContain('Submitted,Rating,Suggestion')
        ->and($csv)->toContain("\"'=HYPERLINK(\"\"http://evil.test\"\")\"")
        ->and($csv)->toContain('"Great, thank you"');

    $filtered = $this->actingAs(ratingsUser('admin'))
        ->get(route('settings.ratings.export', ['rating' => 5]))
        ->streamedContent();
    expect($filtered)->toContain('Great, thank you')->not->toContain('HYPERLINK');
});

test('admins can delete a rating', function () {
    $rating = SiteRating::query()->create(['rating' => 1, 'suggestion' => 'Spam']);

    $this->actingAs(ratingsUser('admin'))
        ->from(route('settings.ratings.index'))
        ->delete(route('settings.ratings.destroy', $rating))
        ->assertRedirect(route('settings.ratings.index'));

    expect(SiteRating::query()->count())->toBe(0);
});
