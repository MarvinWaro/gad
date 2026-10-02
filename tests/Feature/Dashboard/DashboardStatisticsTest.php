<?php

use App\Models\Post;
use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\DashboardStatistics;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed([RbacSeeder::class, SurveySeeder::class]);
    // AY 2026-2027, first semester.
    $this->travelTo(CarbonImmutable::parse('2026-10-02 10:00:00', 'Asia/Manila'));
});

function statsRegion(string $name): SurveyRegion
{
    return SurveyRegion::query()->firstOrCreate(['name' => $name], ['is_active' => true]);
}

function statsHei(SurveyRegion $region, string $name, string $ownership = 'private'): SurveyHei
{
    $cluster = SurveyCluster::query()->firstOrCreate(['survey_region_id' => $region->id, 'name' => 'Cluster of '.$region->name], ['is_active' => true]);

    return SurveyHei::query()->create(['survey_cluster_id' => $cluster->id, 'name' => $name, 'ownership' => $ownership, 'is_active' => true]);
}

function statsStaff(?SurveyRegion $region = null): User
{
    $user = ($region ? User::factory()->regionalOffice($region) : User::factory()->nationalOffice())->create();
    $user->assignRole('admin');

    return $user;
}

function statsMember(SurveyHei $hei): User
{
    $user = User::factory()->create(['survey_hei_id' => $hei->id]);
    $user->assignRole('hei');

    return $user;
}

/**
 * @param  list<int>  $sdgs
 * @param  list<string>  $items
 */
function statsPost(User $author, array $sdgs = [], array $items = [], ?string $at = null, ?Post $shares = null): Post
{
    $postedAt = CarbonImmutable::parse($at ?? '2026-09-15 09:00:00', 'Asia/Manila')->utc();
    $post = Post::query()->forceCreate([
        'user_id' => $author->id,
        'survey_hei_id' => $author->survey_hei_id,
        'body' => 'A GAD activity.',
        'shared_post_id' => $shares?->id,
        'created_at' => $postedAt,
        'updated_at' => $postedAt,
    ]);
    foreach ($sdgs as $sdg) {
        $post->sdgs()->create(['sdg' => $sdg]);
    }
    foreach ($items as $item) {
        $post->achieveItems()->create(['item' => $item]);
    }

    return $post;
}

function statsResponse(SurveyHei $hei, string $slug = 'ra-7877', string $sex = 'female'): SurveyResponse
{
    return SurveyResponse::query()->create([
        'survey_version_id' => Survey::query()->where('slug', $slug)->firstOrFail()->versions()->firstOrFail()->id,
        'public_reference' => Str::random(20),
        'age' => 20,
        'sex' => $sex,
        'respondent_group' => 'student',
        'survey_region_id' => $hei->cluster->survey_region_id,
        'survey_cluster_id' => $hei->survey_cluster_id,
        'survey_hei_id' => $hei->id,
        'answers' => [],
        'consent_at' => now(),
        'expires_at' => now()->addYear(),
    ]);
}

/**
 * @param  array<string, mixed>  $filters
 * @return array<string, mixed>
 */
function statsFor(User $user, array $filters = []): array
{
    return app(DashboardStatistics::class)->for($user, $filters);
}

/** @param  array<string, mixed>  $figures */
function goalCount(array $figures, string $set, string $code): int
{
    return collect($figures['goals'][$set]['items'])->firstWhere('code', $code)['posts'];
}

test('a regional office sees only its own region', function () {
    $xii = statsRegion('Regional Office XII');
    $xi = statsRegion('Regional Office XI');
    statsPost(statsMember(statsHei($xii, 'Notre Dame of Marbel University')), [5]);
    statsPost(statsMember(statsHei($xi, 'Davao College')), [5, 4]);

    $this->actingAs(statsStaff($xii))
        ->get(route('dashboard', ['region' => $xi->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('scope.label', 'Regional Office XII')
            ->where('kpis.posts.value', 1)
            ->where('goals.sdg.totals.posts', 1)
            ->where('goals.sdg.places.level', 'hei')
            ->where('hasOffice', true));
});

test('the Central Office sees every region, then any one it picks', function () {
    $xii = statsRegion('Regional Office XII');
    $xi = statsRegion('Regional Office XI');
    statsPost(statsMember(statsHei($xii, 'Notre Dame of Marbel University')), [5]);
    statsPost(statsMember(statsHei($xi, 'Davao College')), [5, 4]);
    $central = statsStaff();

    $national = statsFor($central);
    $places = collect($national['goals']['sdg']['places']['rows']);

    expect($national['scope'])->toBe(['label' => 'National overview', 'national' => true])
        ->and(goalCount($national, 'sdg', '5'))->toBe(2)
        ->and($national['goals']['sdg']['places']['level'])->toBe('region')
        ->and($places->firstWhere('name', 'Regional Office XI')['counts'])->toBe(['4' => 1, '5' => 1]);

    $picked = statsFor($central, ['region' => $xi->id]);

    expect($picked['scope']['label'])->toBe('Regional Office XI')
        ->and(goalCount($picked, 'sdg', '5'))->toBe(1)
        ->and($picked['filters']['region'])->toBe((string) $xi->id);
});

test('CHED posts count for their office region but never for a school', function () {
    $xii = statsRegion('Regional Office XII');
    $hei = statsHei($xii, 'Notre Dame of Marbel University');
    statsPost(statsMember($hei), [5]);
    statsPost(statsStaff($xii), [5], ['governance']);
    // The Central Office's own post belongs to no region.
    statsPost(statsStaff(), [5]);

    $regional = statsFor(statsStaff($xii));
    $rows = collect($regional['goals']['sdg']['places']['rows']);

    expect(goalCount($regional, 'sdg', '5'))->toBe(2)
        ->and($rows->pluck('kind')->all())->toBe(['hei', 'office'])
        ->and($rows->firstWhere('kind', 'office')['counts'])->toBe(['5' => 1])
        ->and(collect($regional['goals']['sdg']['top_heis']['5'])->pluck('name')->all())->toBe(['Notre Dame of Marbel University'])
        ->and(goalCount($regional, 'achieve', 'governance'))->toBe(1);

    $national = statsFor(statsStaff());

    expect(goalCount($national, 'sdg', '5'))->toBe(3)
        ->and(collect($national['goals']['sdg']['places']['rows'])->firstWhere('name', 'Regional Office XII')['counts'])->toBe(['5' => 2]);
});

test('shares never count as posts or goals', function () {
    $xii = statsRegion('Regional Office XII');
    $member = statsMember(statsHei($xii, 'Notre Dame of Marbel University'));
    $original = statsPost($member, [5]);
    statsPost(statsMember(statsHei($xii, 'Koronadal College')), shares: $original);

    $figures = statsFor(statsStaff($xii));

    expect($figures['kpis']['posts']['value'])->toBe(1)
        ->and($figures['kpis']['posts']['tagged'])->toBe(1)
        ->and(goalCount($figures, 'sdg', '5'))->toBe(1)
        ->and($figures['community']['shares'])->toBe(1);
});

test('periods follow the academic year in Philippine time', function () {
    $xii = statsRegion('Regional Office XII');
    $member = statsMember(statsHei($xii, 'Notre Dame of Marbel University'));
    statsPost($member, [5], at: '2026-07-31 23:30:00');
    statsPost($member, [4], at: '2026-08-01 00:30:00');
    statsPost($member, [3], at: '2026-09-10 12:00:00');
    $staff = statsStaff($xii);

    $year = statsFor($staff);
    $earlier = statsFor($staff, ['academic_year' => '2025-2026']);
    $august = statsFor($staff, ['view' => 'month', 'month' => 8]);
    $september = statsFor($staff, ['view' => 'month', 'month' => 9]);
    $secondSemester = statsFor($staff, ['academic_year' => '2025-2026', 'view' => 'semester', 'semester' => 2]);

    expect($year['kpis']['posts'])->toBe(['value' => 2, 'previous' => 1, 'tagged' => 2])
        ->and($year['period']['label'])->toBe('AY 2026-2027')
        ->and($year['period']['range'])->toBe('Aug 1, 2026 – Jul 31, 2027')
        ->and($earlier['kpis']['posts']['value'])->toBe(1)
        ->and($august['kpis']['posts']['value'])->toBe(1)
        ->and($september['kpis']['posts'])->toMatchArray(['value' => 1, 'previous' => 1])
        ->and($september['period']['comparison'])->toBe('vs. August')
        ->and(array_column($september['trend'], 'label'))->toBe(['Sep 1–5', 'Sep 6–10', 'Sep 11–15', 'Sep 16–20', 'Sep 21–25', 'Sep 26–30'])
        ->and(array_column($september['trend'], 'posts'))->toBe([0, 1, 0, 0, 0, 0])
        ->and(array_column($year['trend'], 'posts'))->toBe([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        ->and($secondSemester['kpis']['posts']['value'])->toBe(1)
        ->and($secondSemester['period']['label'])->toBe('2nd semester, AY 2025-2026');
});

test('ownership and HEI filters narrow every figure to HEIs', function () {
    $xii = statsRegion('Regional Office XII');
    $public = statsHei($xii, 'Sultan Kudarat State University', 'public');
    $private = statsHei($xii, 'Notre Dame of Marbel University');
    statsPost(statsMember($public), [4]);
    statsPost(statsMember($private), [4]);
    statsPost(statsStaff($xii), [4]);

    $publicOnly = statsFor(statsStaff($xii), ['ownership' => 'public']);
    $oneHei = statsFor(statsStaff($xii), ['hei' => $private->id]);

    expect(goalCount($publicOnly, 'sdg', '4'))->toBe(1)
        ->and($publicOnly['kpis']['accounts']['ched'])->toBe(0)
        ->and($publicOnly['kpis']['participation']['total'])->toBe(1)
        ->and(goalCount($oneHei, 'sdg', '4'))->toBe(1)
        ->and($oneHei['scope']['label'])->toBe('Notre Dame of Marbel University')
        ->and($oneHei['goals']['sdg']['places']['level'])->toBeNull();
});

test('posts are split by who shared them', function () {
    $xii = statsRegion('Regional Office XII');
    statsPost(statsMember(statsHei($xii, 'Sultan Kudarat State University', 'public')));
    statsPost(statsMember(statsHei($xii, 'Notre Dame of Marbel University')));
    statsPost(statsMember(statsHei($xii, 'Koronadal College')));
    statsPost(statsStaff($xii));

    expect(statsFor(statsStaff($xii))['community']['sources'])->toBe([
        ['value' => 'public', 'posts' => 1],
        ['value' => 'private', 'posts' => 2],
        ['value' => 'ched', 'posts' => 1],
    ]);
});

test('the law filter narrows the survey figures only', function () {
    $xii = statsRegion('Regional Office XII');
    $hei = statsHei($xii, 'Notre Dame of Marbel University');
    statsResponse($hei, 'ra-7877');
    statsResponse($hei, 'ra-7877', 'male');
    statsResponse($hei, 'ra-9710');
    statsPost(statsMember($hei), [5]);
    $staff = statsStaff($xii);
    $survey = Survey::query()->where('slug', 'ra-9710')->firstOrFail();

    $all = statsFor($staff);
    $one = statsFor($staff, ['survey' => $survey->id]);

    expect($all['kpis']['responses'])->toBe(['value' => 3, 'previous' => 0])
        ->and(collect($all['laws'])->pluck('responses', 'code')->all())->toMatchArray(['RA 7877' => 2, 'RA 9710' => 1])
        ->and(collect($all['respondents']['sexes'])->pluck('responses', 'label')->all())->toBe(['Female' => 2, 'Male' => 1, 'Intersex' => 0, 'Prefer not to say' => 0])
        ->and($all['kpis']['participation'])->toBe(['participating' => 1, 'total' => 1])
        ->and($one['kpis']['responses']['value'])->toBe(1)
        ->and($one['laws'])->toHaveCount(1)
        ->and($one['kpis']['posts']['value'])->toBe(1);
});

test('HEIs yet to contribute are named for the regional office', function () {
    $xii = statsRegion('Regional Office XII');
    statsResponse(statsHei($xii, 'Notre Dame of Marbel University'));
    statsHei($xii, 'Koronadal College');
    statsHei($xii, 'Sultan Kudarat State University');

    $figures = statsFor(statsStaff($xii));

    expect($figures['reach']['regions'])->toBe([])
        ->and($figures['reach']['waiting']['count'])->toBe(2)
        ->and(collect($figures['reach']['waiting']['heis'])->pluck('name')->all())->toBe(['Koronadal College', 'Sultan Kudarat State University']);

    $national = statsFor(statsStaff());

    expect($national['reach']['regions'])->toBe([[
        'id' => $xii->id, 'name' => 'Regional Office XII', 'participating' => 1, 'total' => 3,
    ]]);
});

test('HEIs rank by their posts on each goal', function () {
    $xii = statsRegion('Regional Office XII');
    foreach (['Koronadal College' => 1, 'Notre Dame of Marbel University' => 3, 'Sultan Kudarat State University' => 2] as $name => $posts) {
        $member = statsMember(statsHei($xii, $name));
        foreach (range(1, $posts) as $index) {
            statsPost($member, [4]);
        }
    }

    $figures = statsFor(statsStaff($xii));

    expect(collect($figures['goals']['sdg']['top_heis']['4'])->pluck('posts', 'name')->all())->toBe([
        'Notre Dame of Marbel University' => 3,
        'Sultan Kudarat State University' => 2,
        'Koronadal College' => 1,
    ])
        ->and($figures['goals']['sdg']['top_heis']['all'][0]['name'])->toBe('Notre Dame of Marbel University')
        ->and($figures['goals']['sdg']['totals'])->toBe(['posts' => 6, 'covered' => 1, 'heis' => 3]);
});

test('accounts count by status, kind and when they joined', function () {
    $xii = statsRegion('Regional Office XII');
    $hei = statsHei($xii, 'Notre Dame of Marbel University');
    statsMember($hei);
    User::factory()->pending()->create(['survey_hei_id' => $hei->id]);
    statsStaff($xii);
    $this->travelTo(CarbonImmutable::parse('2026-06-01 10:00:00', 'Asia/Manila'));
    statsMember($hei);
    $this->travelTo(CarbonImmutable::parse('2026-10-02 10:00:00', 'Asia/Manila'));
    // Another region's people stay out of view.
    statsMember(statsHei(statsRegion('Regional Office XI'), 'Davao College'));

    expect(statsFor(statsStaff($xii))['kpis']['accounts'])->toBe([
        'active' => 4, 'pending' => 1, 'joined' => 4, 'hei' => 2, 'ched' => 2,
    ]);
});

test('staff without an office see empty figures and are told why', function () {
    statsPost(statsMember(statsHei(statsRegion('Regional Office XII'), 'Notre Dame of Marbel University')), [5]);
    $user = User::factory()->create();
    $user->assignRole('admin');

    $this->actingAs($user)->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('hasOffice', false)
            ->where('kpis.posts.value', 0)
            ->where('goals.sdg.totals.posts', 0));
});

test('invalid filters are turned away', function () {
    $this->actingAs(statsStaff(statsRegion('Regional Office XII')))
        ->get(route('dashboard', ['view' => 'week', 'ownership' => 'foreign']))
        ->assertSessionHasErrors(['view', 'ownership']);
});

test('HEI accounts keep their home, whose calendar month is not a dashboard filter', function () {
    $member = statsMember(statsHei(statsRegion('Regional Office XII'), 'Notre Dame of Marbel University'));

    $this->actingAs($member)
        ->get(route('dashboard', ['month' => '2026-11']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('hei/home'));
});
