<?php

use App\Actions\Quests\ManageQuest;
use App\Actions\Quests\PlayQuest;
use App\Actions\Quests\SaveQuest;
use App\Enums\CertificateKind;
use App\Enums\QuestStatus;
use App\Models\CertificateDesign;
use App\Models\CertificateSignatory;
use App\Models\GadEvent;
use App\Models\GadEventCheckIn;
use App\Models\Quest;
use App\Models\QuestAttempt;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/**
 * Create an institution, with its region and cluster, for tests that link
 * accounts to an HEI.
 *
 * @param  array<string, mixed>  $attributes
 */
function createSurveyHei(array $attributes = []): SurveyHei
{
    $region = SurveyRegion::query()->firstOrCreate(['name' => 'Regional Office XII'], ['is_active' => true]);
    $cluster = SurveyCluster::query()->firstOrCreate(
        ['survey_region_id' => $region->id, 'name' => 'South Cotabato'],
        ['is_active' => true],
    );

    return SurveyHei::query()->create([
        'survey_cluster_id' => $cluster->id,
        'name' => 'Notre Dame of Marbel University',
        'is_active' => true,
        ...$attributes,
    ]);
}

/**
 * Valid answers to every follow-up a survey response can be asked: gender
 * identity (for Female or Male) and the seeded Student and Employee groups'
 * questions. The server keeps only those that apply, so a payload can always
 * carry them.
 *
 * @return array<string, mixed>
 */
function respondentFollowUps(): array
{
    return [
        'gender_identity' => 'cisgender-woman',
        'group_answers' => [
            'student-year' => '2nd-year',
            'scholar' => 'no',
            'unit-division' => 'teaching',
            'employment-status' => 'regular-permanent',
        ],
    ];
}

/**
 * A valid public registration payload.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function registrationPayload(SurveyHei $hei, array $overrides = []): array
{
    return [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'survey_hei_id' => $hei->id,
        'password' => 'password',
        'password_confirmation' => 'password',
        ...$overrides,
    ];
}

/**
 * A real JPEG, saved to a temporary file, whose Exif block holds an
 * orientation tag, as phone cameras write it. Orientations 5 to 8 mean the
 * picture shows a quarter turn from its stored pixels.
 */
function exifJpeg(int $width, int $height, int $orientation, bool $bigEndian = true): string
{
    $image = imagecreatetruecolor($width, $height);
    ob_start();
    imagejpeg($image);
    $jpeg = (string) ob_get_clean();

    [$short, $long, $byteOrder] = $bigEndian ? ['n', 'N', 'MM'] : ['v', 'V', 'II'];
    $tiff = $byteOrder.pack($short, 42).pack($long, 8)
        .pack($short, 1)
        .pack($short, 0x0112).pack($short, 3).pack($long, 1).pack($short, $orientation).pack($short, 0)
        .pack($long, 0);
    $exif = "Exif\0\0".$tiff;

    $path = (string) tempnam(sys_get_temp_dir(), 'exif-');
    file_put_contents($path, "\xFF\xD8\xFF\xE1".pack('n', strlen($exif) + 2).$exif.substr($jpeg, 2));

    return $path;
}

/**
 * A quest's five questions as staff write them, with placeholder wording.
 * The first choice of each question is the correct one.
 *
 * @param  array<string, mixed>  $overrides
 * @return array{title: string, description: string|null, questions: list<array{prompt: string, explanation: string, choices: list<string>, correct: int}>}
 */
function questPayload(array $overrides = []): array
{
    return [
        'title' => 'Placeholder quest',
        'description' => 'Five placeholder questions.',
        'questions' => array_map(fn (int $number): array => [
            'prompt' => "Placeholder question {$number}?",
            'explanation' => "Placeholder explanation {$number}.",
            'choices' => ["Right answer {$number}", "Wrong answer {$number}", "Other wrong answer {$number}"],
            'correct' => 0,
        ], range(1, 5)),
        ...$overrides,
    ];
}

/**
 * A quest for a region (or every region), written and opened as its staff
 * would.
 *
 * @param  array<string, mixed>  $overrides
 */
function createQuest(?SurveyRegion $region, QuestStatus $status = QuestStatus::Open, ?User $author = null, array $overrides = []): Quest
{
    $quest = app(SaveQuest::class)->create($author ?? User::factory()->create(), $region?->id, questPayload($overrides));

    if ($status !== QuestStatus::Draft) {
        app(ManageQuest::class)->open($quest);
    }
    if ($status === QuestStatus::Closed) {
        app(ManageQuest::class)->close($quest);
    }

    return $quest->refresh();
}

/**
 * Plays a quest to the end: the first `$correct` questions right, the rest
 * wrong.
 */
function playQuest(Quest $quest, User $player, int $correct): QuestAttempt
{
    $game = app(PlayQuest::class);
    $attempt = $game->start($quest, $player);

    foreach ($quest->questions()->with('choices')->get()->values() as $index => $question) {
        $choice = $question->choices->first(fn ($choice): bool => $choice->is_correct === ($index < $correct));
        $game->answer($quest, $player, $question->id, $attempt->keyFor($choice->id));
    }

    return $attempt->refresh();
}

/** Staff of a regional office, or of the Central Office with none. */
function certificateStaff(string $role, ?SurveyRegion $region = null): User
{
    $staff = ($region ? User::factory()->regionalOffice($region) : User::factory()->nationalOffice())->create();
    $staff->assignRole($role);

    return $staff;
}

/**
 * Someone at an HEI in the region.
 *
 * @param  array<string, mixed>  $attributes
 */
function certificateGuest(SurveyRegion $region, array $attributes = []): User
{
    $cluster = SurveyCluster::query()->firstOrCreate(
        ['survey_region_id' => $region->id, 'name' => "{$region->name} cluster"],
        ['is_active' => true],
    );
    $hei = SurveyHei::query()->firstOrCreate(
        ['name' => "{$region->name} College"],
        ['survey_cluster_id' => $cluster->id, 'is_active' => true],
    );
    $guest = User::factory()->create(['survey_hei_id' => $hei->id, ...$attributes]);
    $guest->assignRole('hei');

    return $guest;
}

/** A signatory of the office, with an e-signature on the fake certificates disk. */
function certificateSignatory(?SurveyRegion $region, string $name = 'Maria Santos', string $position = 'Regional Director'): CertificateSignatory
{
    return CertificateSignatory::query()->create([
        'survey_region_id' => $region?->id,
        'name' => $name,
        'position' => $position,
        'signature_path' => UploadedFile::fake()->image('signature.png', 600, 200)->store('signatures', 'certificates'),
    ]);
}

/**
 * A design of the office, signed by the given signatories in order.
 *
 * @param  list<CertificateSignatory>  $signatories
 * @param  array<string, mixed>  $attributes
 */
function certificateDesign(?SurveyRegion $region, array $signatories, CertificateKind $kind = CertificateKind::Participation, array $attributes = []): CertificateDesign
{
    $design = CertificateDesign::query()->create([
        'survey_region_id' => $region?->id,
        'kind' => $kind,
        'name' => "{$kind->title()} design",
        'background' => 'frame',
        'body' => $kind->defaultBody(),
        'logo_paths' => [],
        ...$attributes,
    ]);
    foreach (array_values($signatories) as $index => $signatory) {
        $design->signatories()->attach($signatory->id, ['position' => $index + 1]);
    }

    return $design;
}

/** A GAD event in Philippine wall-clock time, with a venue unless told otherwise. */
function certificateEvent(string $title, ?SurveyRegion $region, string $startsAt = '2026-10-14 08:00:00', ?string $endsAt = '2026-10-15 17:00:00', string $category = 'training', ?string $location = 'Koronadal City'): GadEvent
{
    return GadEvent::query()->create([
        'title' => $title,
        'category' => $category,
        'is_all_day' => false,
        'starts_at' => $startsAt,
        'ends_at' => $endsAt,
        'location' => $location,
        'survey_region_id' => $region?->id,
    ]);
}

/** Someone checked in to the event on a Philippine day. */
function certificateCheckIn(GadEvent $event, User $person, string $day = '2026-10-14'): GadEventCheckIn
{
    return GadEventCheckIn::query()->create([
        'gad_event_id' => $event->id,
        'user_id' => $person->id,
        'attended_on' => $day,
        'method' => 'scan',
        'survey_region_id' => $person->regionId(),
        'survey_hei_id' => $person->survey_hei_id,
    ]);
}
