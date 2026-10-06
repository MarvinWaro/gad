<?php

use App\Models\GadEvent;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

/** Staff in a regional office, or the Central Office with none. */
function eventStaff(string $role, ?SurveyRegion $region = null): User
{
    $user = ($region ? User::factory()->regionalOffice($region) : User::factory()->nationalOffice())->create();
    $user->assignRole($role);

    return $user;
}

function eventPayload(array $overrides = []): array
{
    return [
        'title' => 'Regional GAD Focal Persons Training',
        'category' => 'training',
        'is_all_day' => false,
        'starts_at' => '2026-10-02T09:00',
        'ends_at' => '2026-10-02T16:00',
        'location' => 'CHED RO XII, Koronadal City',
        'description' => 'Orientation on the GAD planning and budgeting cycle.',
        ...$overrides,
    ];
}

function eventRegion(string $name): SurveyRegion
{
    return SurveyRegion::query()->create(['name' => $name, 'is_active' => true]);
}

/** An HEI account at an institution in the region. */
function eventMember(SurveyRegion $region): User
{
    $hei = SurveyHei::query()->create([
        'survey_cluster_id' => SurveyCluster::query()->create(['survey_region_id' => $region->id, 'name' => "{$region->name} cluster", 'is_active' => true])->id,
        'name' => "{$region->name} College",
        'is_active' => true,
    ]);
    $member = User::factory()->create(['survey_hei_id' => $hei->id]);
    $member->assignRole('hei');

    return $member;
}

function regionEvent(string $title, ?SurveyRegion $region): GadEvent
{
    return GadEvent::query()->create([
        'title' => $title, 'category' => 'training', 'is_all_day' => false,
        'starts_at' => '2026-10-15 09:00:00', 'survey_region_id' => $region?->id,
    ]);
}

test('administrators create, update, and delete events', function () {
    $admin = eventStaff('admin');

    $this->actingAs($admin)
        ->post(route('admin.events.store'), eventPayload())
        ->assertRedirect(route('admin.events.index'))
        ->assertSessionHasNoErrors();

    $event = GadEvent::query()->sole();
    expect($event->starts_at->format('Y-m-d H:i'))->toBe('2026-10-02 09:00')
        ->and($event->created_by)->toBe($admin->id);

    $this->actingAs($admin)
        ->put(route('admin.events.update', $event), eventPayload(['title' => 'Updated']))
        ->assertSessionHasNoErrors();
    expect($event->fresh()->title)->toBe('Updated');

    $this->actingAs($admin)
        ->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/events/index')
            ->has('events.data', 1)
            ->where('permissions.delete', true));

    $this->actingAs($admin)->delete(route('admin.events.destroy', $event))->assertRedirect();
    expect(GadEvent::query()->exists())->toBeFalse();
});

test('all-day events span whole days', function () {
    $this->actingAs(eventStaff('admin'))->post(route('admin.events.store'), eventPayload([
        'is_all_day' => true,
        'starts_at' => '2026-11-25',
        'ends_at' => '2026-12-12',
    ]));

    $event = GadEvent::query()->sole();
    expect($event->starts_at->format('Y-m-d H:i:s'))->toBe('2026-11-25 00:00:00')
        ->and($event->ends_at?->format('Y-m-d H:i:s'))->toBe('2026-12-12 23:59:59');
});

test('events are validated', function (array $overrides, string $field) {
    $this->actingAs(eventStaff('admin'))
        ->post(route('admin.events.store'), eventPayload($overrides))
        ->assertSessionHasErrors($field);
})->with([
    'missing title' => [['title' => ''], 'title'],
    'unknown category' => [['category' => 'party'], 'category'],
    'ends before it starts' => [['ends_at' => '2026-10-01T09:00'], 'ends_at'],
    'unknown region' => [['region' => 999], 'region'],
]);

test('GAD focal persons create and update events but cannot delete them', function () {
    $focal = eventStaff('gad-focal-person');

    $this->actingAs($focal)->post(route('admin.events.store'), eventPayload())->assertSessionHasNoErrors();
    $event = GadEvent::query()->sole();

    $this->actingAs($focal)
        ->put(route('admin.events.update', $event), eventPayload(['title' => 'Moved']))
        ->assertSessionHasNoErrors();
    $this->actingAs($focal)->delete(route('admin.events.destroy', $event))->assertForbidden();
});

test('HEI users view events but cannot manage them', function () {
    $hei = User::factory()->create();
    $hei->assignRole('hei');

    $this->actingAs($hei)->get(route('admin.events.index'))->assertForbidden();
    $this->actingAs($hei)->post(route('admin.events.store'), eventPayload())->assertForbidden();
    $this->actingAs($hei)->get(route('events.index'))->assertOk();
});

test('a regional office\'s event is for its own region; the Central Office picks one or every region', function () {
    $xii = eventRegion('Regional Office XII');
    $ix = eventRegion('Regional Office IX');

    $this->actingAs(eventStaff('gad-focal-person', $xii))
        ->post(route('admin.events.store'), eventPayload(['title' => 'Regional', 'region' => $ix->id]))
        ->assertSessionHasNoErrors();
    expect(GadEvent::query()->where('title', 'Regional')->sole()->survey_region_id)->toBe($xii->id);

    $admin = eventStaff('admin');
    $this->actingAs($admin)->post(route('admin.events.store'), eventPayload(['title' => 'For IX', 'region' => $ix->id]));
    $this->actingAs($admin)->post(route('admin.events.store'), eventPayload(['title' => 'National']));

    expect(GadEvent::query()->where('title', 'For IX')->sole()->survey_region_id)->toBe($ix->id)
        ->and(GadEvent::query()->where('title', 'National')->sole()->survey_region_id)->toBeNull();
});

test('HEI users see their own region\'s events and those for every region, never another region\'s', function () {
    CarbonImmutable::setTestNow('2026-10-01 04:00:00');
    $xii = eventRegion('Regional Office XII');
    $ix = eventRegion('Regional Office IX');
    $regional = regionEvent('Region XII training', $xii);
    $national = regionEvent('National campaign', null);
    $ixMember = eventMember($ix);
    $xiiMember = eventMember($xii);

    foreach (['calendar.events', 'upcoming'] as $prop) {
        $this->actingAs($ixMember)->get(route('dashboard', ['month' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page->where($prop, fn ($events) => collect($events)->pluck('id')->all() === [$national->id]));
        $this->actingAs($xiiMember)->get(route('dashboard', ['month' => '2026-10']))
            ->assertInertia(fn (Assert $page) => $page->where($prop, fn ($events) => collect($events)->pluck('id')->sort()->values()->all() === [$regional->id, $national->id]));
    }

    $this->actingAs($ixMember)->get(route('events.index', ['month' => '2026-10']))
        ->assertInertia(fn (Assert $page) => $page->where('calendar.events', fn ($events) => collect($events)->pluck('id')->all() === [$national->id]));

    CarbonImmutable::setTestNow();
});

test('regional staff list their region\'s events and every region\'s, and change only their own', function () {
    $xii = eventRegion('Regional Office XII');
    $ix = eventRegion('Regional Office IX');
    $ours = regionEvent('Ours', $xii);
    $national = regionEvent('National', null);
    $theirs = regionEvent('Theirs', $ix);
    $focal = eventStaff('admin', $xii);

    $this->actingAs($focal)->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('events.data', 2)
            ->where('events.data', fn ($events) => collect($events)->mapWithKeys(fn (array $event): array => [
                $event['title'] => [$event['region']['name'] ?? 'All regions', $event['can']['update'], $event['can']['delete']],
            ])->sortKeys()->all() === [
                'National' => ['All regions', false, false],
                'Ours' => ['Regional Office XII', true, true],
            ])
            ->where('nationalAccess', false)
            ->has('regions', 1));

    foreach ([$national, $theirs] as $event) {
        $this->actingAs($focal)->put(route('admin.events.update', $event), eventPayload(['title' => 'Taken']))->assertForbidden();
        $this->actingAs($focal)->delete(route('admin.events.destroy', $event))->assertForbidden();
    }
    $this->actingAs($focal)->put(route('admin.events.update', $ours), eventPayload(['title' => 'Ours, moved']))->assertSessionHasNoErrors();

    expect($national->fresh()->title)->toBe('National')
        ->and($theirs->fresh()->title)->toBe('Theirs')
        ->and($ours->fresh()->title)->toBe('Ours, moved');

    $this->actingAs(eventStaff('admin'))->get(route('admin.events.index'))
        ->assertInertia(fn (Assert $page) => $page->has('events.data', 3)->where('nationalAccess', true));
});

test('staff without an office cannot add events', function () {
    $officeless = User::factory()->create();
    $officeless->assignRole('gad-focal-person');

    $this->actingAs($officeless)->post(route('admin.events.store'), eventPayload())->assertForbidden();

    expect(GadEvent::query()->exists())->toBeFalse();
});

test('existing events take their author\'s regional office; the Central Office\'s stay for every region', function () {
    $xii = eventRegion('Regional Office XII');
    $regionalAuthor = eventStaff('gad-focal-person', $xii);
    $centralAuthor = eventStaff('admin');
    $migration = require database_path('migrations/2026_10_15_000000_add_region_to_gad_events_table.php');
    $migration->down();

    DB::table('gad_events')->insert([
        ['title' => 'Regional', 'category' => 'training', 'starts_at' => '2026-10-15 09:00:00', 'is_all_day' => false, 'created_by' => $regionalAuthor->id],
        ['title' => 'Central', 'category' => 'training', 'starts_at' => '2026-10-15 09:00:00', 'is_all_day' => false, 'created_by' => $centralAuthor->id],
    ]);
    $migration->up();

    expect(GadEvent::query()->where('title', 'Regional')->sole()->survey_region_id)->toBe($xii->id)
        ->and(GadEvent::query()->where('title', 'Central')->sole()->survey_region_id)->toBeNull();
});
