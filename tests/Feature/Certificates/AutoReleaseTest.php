<?php

use App\Console\Commands\ReleaseDueCertificates;
use App\Enums\NotificationKind;
use App\Models\Certificate;
use App\Models\GadEventCertificate;
use App\Models\GadEventGuest;
use App\Models\Notification;
use App\Models\SurveyRegion;
use Carbon\CarbonImmutable;
use Database\Seeders\RbacSeeder;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    Storage::fake('certificates');
    $this->xii = SurveyRegion::query()->create(['name' => 'Regional Office XII', 'is_active' => true, 'office_city' => 'Koronadal City']);
    $this->signatory = certificateSignatory($this->xii);
    // October 14, 8:00 AM, to October 15, 5:00 PM.
    $this->event = certificateEvent('GAD Orientation', $this->xii);
    $this->use = GadEventCertificate::query()->create([
        'gad_event_id' => $this->event->id,
        'certificate_design_id' => certificateDesign($this->xii, [$this->signatory])->id,
    ]);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('certificates go out by themselves when the event ends, to everyone present every day, and they are told', function () {
    $everyDay = certificateGuest($this->xii, ['name' => 'Every Day']);
    $oneDay = certificateGuest($this->xii, ['name' => 'One Day']);
    attendEveryDay($this->event, $everyDay);
    certificateCheckIn($this->event, $oneDay, '2026-10-14');
    $guest = GadEventGuest::query()->create(['gad_event_id' => $this->event->id, 'name' => 'Agency Guest', 'organization' => 'DepEd']);
    $guest->days()->createMany([['attended_on' => '2026-10-14'], ['attended_on' => '2026-10-15']]);

    // 4:00 PM on the last day: not yet.
    CarbonImmutable::setTestNow('2026-10-15 08:00:00');
    $this->artisan('certificates:release-due')->assertSuccessful();
    expect(Certificate::query()->exists())->toBeFalse();

    // 5:00 PM: it ended.
    CarbonImmutable::setTestNow('2026-10-15 09:00:00');
    $this->artisan('certificates:release-due')->assertSuccessful()->expectsOutput('Gave 2 certificates.');

    expect(Certificate::query()->orderBy('name')->pluck('name')->all())->toBe(['Agency Guest', 'Every Day'])
        ->and($this->use->refresh()->released_at)->not->toBeNull()
        ->and($this->use->released_by)->toBeNull()
        ->and(Notification::query()->pluck('kind')->all())->toBe([NotificationKind::CertificateReady])
        ->and(Notification::query()->sole()->user_id)->toBe($everyDay->id);
    $this->assertDatabaseHas('activity_logs', ['action' => 'released', 'actor_name' => 'System', 'user_id' => null]);

    // The notice speaks to them, and opens their certificates.
    $this->actingAs($everyDay)->getJson(route('notifications.recent'))
        ->assertJsonPath('data.0.actor', null)
        ->assertJsonPath('data.0.sentence.before', 'Your')
        ->assertJsonPath('data.0.sentence.after', 'is ready. Download it from My certificates.');

    // Again: nothing new to give, and someone marked since gets theirs.
    $this->artisan('certificates:release-due')->expectsOutput('Gave 0 certificates.');
    certificateCheckIn($this->event, $oneDay, '2026-10-15');
    $this->artisan('certificates:release-due')->expectsOutput('Gave 1 certificates.');
    expect(Certificate::query()->count())->toBe(3);
});

test('a cancelled event, a deadline, one that can\'t print, or one long over, gives nothing by itself', function () {
    attendEveryDay($this->event, certificateGuest($this->xii));
    CarbonImmutable::setTestNow('2026-10-16 01:00:00');

    $this->event->forceFill(['cancelled_at' => now()])->save();
    $this->artisan('certificates:release-due')->expectsOutput('Gave 0 certificates.');

    $this->event->forceFill(['cancelled_at' => null])->save();
    $this->use->design->signatories()->detach();
    $this->artisan('certificates:release-due')->expectsOutput('Gave 0 certificates.');
    // Its release page says why it waits.
    $this->actingAs(certificateStaff('ched-focal', $this->xii))->get(route('settings.event-certificates.show', $this->use))
        ->assertInertia(fn (Assert $page) => $page
            ->where('problem', 'Add a signatory to Certificate of Participation design first.')
            ->where('goesOutAt', '2026-10-15T17:00:00')
            ->where('ended', true)
            ->where('automatic', true));

    $this->use->design->signatories()->attach($this->signatory->id, ['position' => 1]);
    CarbonImmutable::setTestNow('2026-11-20 01:00:00');
    $this->artisan('certificates:release-due')->expectsOutput('Gave 0 certificates.');
    // Long over, it waits for staff, who are told so.
    $this->actingAs(certificateStaff('ched-focal', $this->xii))->get(route('settings.event-certificates.show', $this->use))
        ->assertInertia(fn (Assert $page) => $page->where('automatic', false)->where('problem', null));

    CarbonImmutable::setTestNow('2026-10-16 01:00:00');
    $this->artisan('certificates:release-due')->expectsOutput('Gave 1 certificates.');
    expect(ReleaseDueCertificates::RECENT_DAYS)->toBe(30);
});

test('the release runs every minute', function () {
    $event = collect(app(Schedule::class)->events())->first(fn ($event) => str_contains((string) $event->command, 'certificates:release-due'));

    expect($event)->not->toBeNull()
        ->and($event->expression)->toBe('* * * * *');
});
