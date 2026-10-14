<?php

use App\Models\Post;
use App\Models\User;
use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Common\Mode;
use BaconQrCode\Encoder\Encoder;
use Database\Seeders\RbacSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

const PARTICIPANT_CODE = '/^GAD-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/';

beforeEach(function () {
    $this->seed(RbacSeeder::class);
    $this->hei = createSurveyHei(['name' => 'Fictional Virtual ID College']);
});

test('every new account gets its own random participant code', function () {
    $codes = User::factory()->count(20)->create()->pluck('participant_code');

    expect($codes->every(fn (string $code): bool => (bool) preg_match(PARTICIPANT_CODE, $code)))->toBeTrue()
        ->and($codes->unique())->toHaveCount(20);
});

test('the Virtual ID shows who you are, where you belong, your code and its QR', function () {
    $member = User::factory()->create(['name' => 'Ana Dela Cruz', 'survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');

    $this->actingAs($member)->get(route('virtual-id.show'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/virtual-id')
            ->where('card.name', 'Ana Dela Cruz')
            ->where('card.affiliation', 'Fictional Virtual ID College')
            ->where('card.photo', null)
            ->where('card.code', $member->participant_code)
            // The QR's 21 × 21 modules, for the card to draw.
            ->has('card.qr', 21)
            ->where('card.qr.0', fn (string $row): bool => (bool) preg_match('/^[01]{21}$/', $row)));
});

test('CHED staff get one too, naming their office', function () {
    $staff = User::factory()->regionalOffice($this->hei->cluster->region)->create();
    $staff->assignRole('ched-focal');

    $this->actingAs($staff)->get(route('virtual-id.show'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('card.affiliation', 'CHED '.$this->hei->cluster->region->name)
            ->where('card.code', $staff->participant_code));
});

test('the code reaches only its owner\'s Virtual ID page', function () {
    $member = User::factory()->create(['name' => 'Ana Searchable', 'survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');
    $reader = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $reader->assignRole('hei');

    expect($member->toArray())->not->toHaveKey('participant_code');

    $this->actingAs($reader)->get(route('virtual-id.show'))
        ->assertInertia(fn (Assert $page) => $page->missing('auth.user.participant_code'));
    $this->actingAs($reader)->getJson(route('search.people', ['q' => 'Ana Searchable']))
        ->assertOk()
        ->assertJsonMissingPath('data.0.participant_code');
});

test('guests are sent to sign in', function () {
    $this->get(route('virtual-id.show'))->assertRedirect(route('login'));
    $this->get(route('virtual-id.photo'))->assertRedirect(route('login'));
});

test('the photo on the card comes from this site, so the card can be saved as an image', function () {
    Storage::fake('public');
    $member = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    $member->assignRole('hei');

    $this->actingAs($member)->get(route('virtual-id.photo'))->assertNotFound();

    Storage::disk('public')->put('avatars/ana.jpg', 'a photo');
    $member->forceFill(['avatar_path' => 'avatars/ana.jpg'])->save();

    $this->actingAs($member)->get(route('virtual-id.show'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('card.photo', fn (string $url): bool => str_starts_with($url, route('virtual-id.photo'))));
    expect($this->actingAs($member)->get(route('virtual-id.photo'))->assertOk()->streamedContent())->toBe('a photo');
});

test('the QR is the smallest there is, even with error correction for glare', function () {
    $code = User::factory()->create()->participant_code;
    $qr = Encoder::encode($code, ErrorCorrectionLevel::Q(), Encoder::DEFAULT_BYTE_MODE_ENCODING);

    expect($qr->getVersion()->getVersionNumber())->toBe(1)
        ->and($qr->getMode())->toBe(Mode::ALPHANUMERIC());
});

test('the migration gives every existing account its own code, leaving ids and posts alone', function () {
    $author = User::factory()->create(['survey_hei_id' => $this->hei->id]);
    User::factory()->count(3)->create();
    Post::query()->create(['user_id' => $author->id, 'survey_hei_id' => $this->hei->id, 'body' => 'Kept']);
    $ids = User::query()->orderBy('id')->pluck('id')->all();
    $migration = require database_path('migrations/2026_10_19_000000_add_participant_code_to_users_table.php');

    $migration->down();
    $migration->up();

    $codes = DB::table('users')->orderBy('id')->pluck('participant_code', 'id');
    expect($codes->keys()->all())->toBe($ids)
        ->and($codes->unique()->count())->toBe(count($ids))
        ->and($codes->every(fn (string $code): bool => (bool) preg_match(PARTICIPANT_CODE, $code)))->toBeTrue()
        ->and(Post::query()->where('user_id', $author->id)->exists())->toBeTrue();
});
