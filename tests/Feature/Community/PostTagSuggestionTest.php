<?php

use App\Models\SurveyHei;
use App\Models\User;
use App\Support\InstitutionName;
use Database\Seeders\RbacSeeder;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

function taggableMember(string $name, SurveyHei $hei): User
{
    $user = User::factory()->create(['name' => $name, 'survey_hei_id' => $hei->id]);
    $user->assignRole('hei');

    return $user;
}

test('suggestions list active accounts with their school, never the viewer', function () {
    $school = createSurveyHei(['name' => 'Notre Dame of Marbel University']);
    $viewer = taggableMember('Viewer Person', $school);
    $colleague = taggableMember('Ana Cruz', $school);
    $staff = User::factory()->create(['name' => 'Ben Reyes']);
    $staff->assignRole('admin');
    User::factory()->pending()->create(['name' => 'Pending Person']);
    User::factory()->inactive()->create(['name' => 'Inactive Person']);

    $this->actingAs($viewer)
        ->getJson(route('posts.tag-suggestions'))
        ->assertOk()
        ->assertExactJson([
            ['id' => $colleague->id, 'name' => 'Ana Cruz', 'avatar' => null, 'affiliation' => InstitutionName::display($school->name)],
            // CHED staff are named by their office.
            ['id' => $staff->id, 'name' => 'Ben Reyes', 'avatar' => null, 'affiliation' => 'CHED Central Office'],
        ]);
});

test('suggestions match by name or by school', function () {
    $viewer = taggableMember('Viewer Person', createSurveyHei(['name' => 'Notre Dame of Marbel University']));
    $koronadal = createSurveyHei(['name' => 'Koronadal National Comprehensive High School']);
    $maria = taggableMember('Maria Santos', $koronadal);
    $jose = taggableMember('Jose Rizal', createSurveyHei(['name' => 'Mindanao State University']));

    $this->actingAs($viewer)
        ->getJson(route('posts.tag-suggestions', ['q' => 'santos']))
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $maria->id);

    $this->actingAs($viewer)
        ->getJson(route('posts.tag-suggestions', ['q' => 'Mindanao']))
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $jose->id);
});

test('the viewer\'s own school comes first', function () {
    $home = createSurveyHei(['name' => 'Notre Dame of Marbel University']);
    $viewer = taggableMember('Viewer Person', $home);
    taggableMember('Aaron Abad', createSurveyHei(['name' => 'Mindanao State University']));
    $colleague = taggableMember('Zeny Zamora', $home);

    $this->actingAs($viewer)
        ->getJson(route('posts.tag-suggestions'))
        ->assertJsonPath('0.id', $colleague->id);
});

test('typed wildcards match literally', function () {
    $viewer = taggableMember('Viewer Person', createSurveyHei());
    taggableMember('Ana Cruz', createSurveyHei(['name' => 'Mindanao State University']));

    $this->actingAs($viewer)
        ->getJson(route('posts.tag-suggestions', ['q' => '%']))
        ->assertJsonCount(0);
});

test('guests cannot search for people', function () {
    $this->getJson(route('posts.tag-suggestions'))->assertUnauthorized();
});
