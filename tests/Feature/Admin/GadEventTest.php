<?php

use App\Models\GadEvent;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
});

function eventStaff(string $role): User
{
    $user = User::factory()->create();
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
    $hei = eventStaff('hei');

    $this->actingAs($hei)->get(route('admin.events.index'))->assertForbidden();
    $this->actingAs($hei)->post(route('admin.events.store'), eventPayload())->assertForbidden();
    $this->actingAs($hei)->get(route('events.index'))->assertOk();
});
