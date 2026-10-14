<?php

use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\PeopleSearch;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Search University']);
    $region = SurveyRegion::query()->create(['name' => 'Fictional Other Region', 'is_active' => true]);
    $this->otherHei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $region->id, 'name' => 'Elsewhere', 'is_active' => true])->id,
        'name' => 'Fictional Other College',
        'is_active' => true,
    ]);
    $this->viewer = searchable('Viewer Person', $this->hei);
});

function searchable(string $name, SurveyHei $hei, string $status = 'active'): User
{
    return User::factory()->create(['name' => $name, 'survey_hei_id' => $hei->id, 'status' => $status]);
}

/** @return list<string> The names suggested for a search, in order. */
function suggested(string $search): array
{
    return test()->actingAs(test()->viewer)
        ->getJson(route('search.people', ['q' => $search]))
        ->assertOk()
        ->json('data.*.name') ?? [];
}

test('capitals, accents and punctuation do not matter', function () {
    searchable('Marvin Waro', $this->otherHei);
    searchable('María Peña', $this->otherHei);

    expect(suggested('MARVIN'))->toBe(['Marvin Waro'])
        ->and(suggested('pena'))->toBe(['María Peña'])
        ->and(suggested('maria-PEÑA'))->toBe(['María Peña']);
});

test('every word typed must start a word of the name, in any order', function () {
    searchable('Marvin Waro', $this->otherHei);

    expect(suggested('mar wa'))->toBe(['Marvin Waro'])
        ->and(suggested('waro marv'))->toBe(['Marvin Waro'])
        ->and(suggested('arvin'))->toBe([])
        ->and(suggested('marvin cruz'))->toBe([]);
});

test('names that sound alike are found, as with a slip or a silent h', function () {
    searchable('Marvin Waro', $this->otherHei);
    searchable('John Reyes', $this->otherHei);
    searchable('Reymann Dizon', $this->otherHei);

    expect(suggested('Marven'))->toBe(['Marvin Waro'])
        ->and(suggested('Jhon'))->toBe(['John Reyes'])
        ->and(suggested('Rheyman'))->toBe(['Reymann Dizon']);
});

test('an institution\'s name finds its people', function () {
    searchable('Marvin Waro', $this->otherHei);

    expect(suggested('other college'))->toBe(['Marvin Waro']);
});

test('the best matches come first: exact, then the start, then every word, then by sound', function () {
    foreach (['Anna Lim', 'Lim Ana', 'Ana Limbo', 'Ana Lim'] as $name) {
        searchable($name, $this->otherHei);
    }

    expect(suggested('ana lim'))->toBe(['Ana Lim', 'Ana Limbo', 'Lim Ana', 'Anna Lim']);
});

test('among equal matches, people followed come first, then the searcher\'s own institution', function () {
    $far = searchable('Rosa Diaz', $this->otherHei);
    $near = searchable('Rosa Diaz', $this->hei);
    $followed = searchable('Rosa Diaz', $this->otherHei);
    $this->actingAs($this->viewer)->postJson(route('people.follow', $followed));

    $found = $this->getJson(route('search.people', ['q' => 'rosa diaz']))->json('data');

    expect(array_column($found, 'id'))->toBe([$followed->id, $near->id, $far->id])
        ->and($found[0]['following'])->toBeTrue();
});

test('only active accounts are found, with nothing private', function () {
    searchable('Marvin Waro', $this->otherHei);
    searchable('Marvin Pending', $this->otherHei, 'pending');
    searchable('Marvin Gone', $this->otherHei, 'inactive');

    $this->actingAs($this->viewer)->getJson(route('search.people', ['q' => 'marvin']))
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0', fn (array $person): bool => array_keys($person) === ['id', 'ulid', 'name', 'avatar', 'affiliation', 'following', 'follows_you', 'is_you']);
    expect(suggested('m'))->toBe([]);
});

test('the results page lists everyone found, twenty at a time', function () {
    foreach (range(1, 25) as $number) {
        searchable("Testa Person {$number}", $this->otherHei);
    }

    $this->actingAs($this->viewer)->get(route('search', ['q' => 'testa']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('search/index')
            ->where('query', 'testa')
            ->has('people.data', 20));

    $this->get(route('search'))
        ->assertInertia(fn (Assert $page) => $page->has('people.data', 0));
});

test('a name\'s search keys follow the name', function () {
    $person = searchable('Old Name', $this->otherHei);
    $person->update(['name' => 'Ñino Peñafrancia']);

    expect($person->fresh()->search_name)->toBe('nino penafrancia')
        ->and($person->fresh()->search_sounds)->toBe(PeopleSearch::sound('nino').' '.PeopleSearch::sound('penafrancia'));
});
