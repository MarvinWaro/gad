<?php

// This server always creates its own database. Never reuse a development server
// or load cached application configuration for browser tests.
use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\StudentCountKind;
use App\Models\AcademicYear;
use App\Models\DisciplineGroup;
use App\Models\Notification;
use App\Models\Permission;
use App\Models\Post;
use App\Models\Role;
use App\Models\StudentCount;
use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\SurveyResponse;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveyDirectorySeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

require __DIR__.'/../../vendor/autoload.php';

$database = tempnam(sys_get_temp_dir(), 'phlgadis-browser-');
if ($database === false) {
    throw new RuntimeException('Cannot create the isolated browser database.');
}
// Photos uploaded during the run go here, never into storage/app/public.
$uploads = $database.'-uploads';
if (! mkdir($uploads)) {
    throw new RuntimeException('Cannot create the isolated browser uploads folder.');
}

$environment = [
    'APP_ENV' => 'testing', 'APP_DEBUG' => 'true', 'APP_URL' => 'http://127.0.0.1:8016',
    'APP_KEY' => 'base64:'.base64_encode(random_bytes(32)),
    'APP_CONFIG_CACHE' => $database.'-config.php',
    'APP_ROUTES_CACHE' => $database.'-routes.php',
    'DB_CONNECTION' => 'sqlite', 'DB_DATABASE' => $database, 'DB_URL' => '',
    'SESSION_DRIVER' => 'database', 'SESSION_CONNECTION' => 'sqlite',
    'SESSION_DOMAIN' => 'null', 'SESSION_SECURE_COOKIE' => 'false',
    'CACHE_STORE' => 'array', 'QUEUE_CONNECTION' => 'sync', 'MAIL_MAILER' => 'array',
    'BCRYPT_ROUNDS' => '4',
    // Read by router.php: the public disk's root for this run.
    'BROWSER_UPLOADS' => $uploads,
];
foreach ($environment as $key => $value) {
    putenv("{$key}={$value}");
    $_ENV[$key] = $_SERVER[$key] = $value;
}

$app = require __DIR__.'/../../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();
if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== $database) {
    throw new RuntimeException('Browser database isolation failed.');
}
$kernel->call('migrate', ['--force' => true]);
$kernel->call('db:seed', ['--class' => RbacSeeder::class, '--force' => true]);
$kernel->call('db:seed', ['--class' => SurveySeeder::class, '--force' => true]);
$region = SurveyRegion::query()->sole();
$region->update(SurveyDirectorySeeder::REGION_XII_OFFICE);
$cluster = SurveyCluster::query()->create(['name' => 'Browser Test Cluster', 'survey_region_id' => $region->id, 'is_active' => true]);
$hei = SurveyHei::query()->create(['name' => 'Browser Test HEI', 'survey_cluster_id' => $cluster->id, 'is_active' => true]);
foreach (Survey::query()->get() as $survey) {
    $draft = $survey->draftVersion();
    $draft->update(['retention_days' => 365, 'status' => 'published', 'published_at' => now()]);
    $next = $draft->replicate(['published_at', 'published_by']);
    $next->fill(['version' => 2, 'status' => 'draft'])->save();
}
// A regional administrator, so monitoring review runs within one office.
$admin = User::factory()->regionalOffice($region)->create(['email' => 'browser-admin@example.test', 'password' => 'browser-password']);
$admin->assignRole('admin');
$monitoringMember = User::factory()->create(['name' => 'Fictional Monitoring Member', 'email' => 'browser-monitoring@example.test', 'password' => 'browser-password', 'survey_hei_id' => $hei->id]);
// The HEI's focal person, who prepares and submits its monitoring report.
$monitoringMember->assignRole('hei-focal');
// Staff who may read survey drafts but not change them.
$viewerRole = Role::query()->create(['name' => 'Survey Viewer', 'slug' => 'survey-viewer']);
$viewerRole->permissions()->sync(Permission::query()->where('slug', 'surveys.view')->pluck('id'));
$viewer = User::factory()->regionalOffice($region)->create(['email' => 'browser-survey-viewer@example.test', 'password' => 'browser-password']);
$viewer->assignRole('survey-viewer');

// Eleven older posts from an HEI, so the community feed has a second page
// to load. They sit below anything a test posts.
$member = User::factory()->create(['name' => 'Browser Test Member', 'email' => 'browser-member@example.test', 'password' => 'browser-password', 'survey_hei_id' => $hei->id]);
$member->assignRole('hei');
foreach (range(1, 11) as $daysAgo) {
    $postedAt = now()->subDays(30 + $daysAgo);
    Post::query()->forceCreate([
        'user_id' => $member->id,
        'survey_hei_id' => $hei->id,
        'body' => "Browser seed post {$daysAgo}: an earlier GAD activity.",
        'created_at' => $postedAt,
        'updated_at' => $postedAt,
    ]);
}

// The dashboard's figures: the two newest seed posts carry goals, and three
// law-survey answers arrive the same day, 32 days ago. That day's month never
// holds anything another spec posts or answers (they all happen today), so
// tests/browser/dashboard.spec.ts reads its figures in that month alone.
$goalPosts = Post::query()->whereBelongsTo($member, 'author')->latest('created_at')->take(2)->get();
// The newer one moves to a minute after the other, still newer than the
// rest of the seed posts.
$goalPosts[0]->forceFill(['created_at' => $goalPosts[1]->created_at->copy()->addMinute()])->save();
// Each also carries a photo, so the homepage's stories have something to
// show (App\Support\HomepageStories counts photo posts only).
(new Filesystem)->ensureDirectoryExists($uploads.'/posts');
foreach ($goalPosts as $index => $post) {
    $photo = "posts/browser-seed-{$index}.jpg";
    copy(__DIR__.'/../../public/assets/img/ched12_building.jpg', $uploads.'/'.$photo);
    [$width, $height] = getimagesize($uploads.'/'.$photo) ?: [null, null];
    $post->images()->create(['path' => $photo, 'width' => $width, 'height' => $height, 'sort_order' => 0]);
}
foreach ([[[5, 4], ['governance']], [[5, 13], ['governance', 'lifelong-learning']]] as $index => [$goals, $items]) {
    foreach ($goals as $goal) {
        $goalPosts[$index]->sdgs()->create(['sdg' => $goal]);
    }
    foreach ($items as $item) {
        $goalPosts[$index]->achieveItems()->create(['item' => $item]);
    }
}
foreach ([['ra-7877', 'female'], ['ra-7877', 'male'], ['ra-9710', 'female']] as [$slug, $sex]) {
    SurveyResponse::query()->forceCreate([
        'survey_version_id' => Survey::query()->where('slug', $slug)->firstOrFail()->publishedVersion()?->id,
        'public_reference' => Str::random(20),
        'age' => 21,
        'sex' => $sex,
        'respondent_group' => 'student',
        'survey_region_id' => $region->id,
        'survey_cluster_id' => $cluster->id,
        'survey_hei_id' => $hei->id,
        'answers' => [],
        'consent_at' => $goalPosts[1]->created_at,
        'expires_at' => now()->addYear(),
        'created_at' => $goalPosts[1]->created_at,
        'updated_at' => $goalPosts[1]->created_at,
    ]);
}

// Region XII's enrollment and graduates for AY 2025-2026, as if imported in
// Settings → Enrollment & graduates. They add up to the totals the homepage
// and dashboard specs read: 95,737 men and 132,086 women enrolled; 11,800
// men and 20,190 women graduated.
$academicYear = AcademicYear::query()->where('label', '2025-2026')->firstOrFail();
foreach ([
    StudentCountKind::Enrollment->value => [
        'Education Science and Teacher Training' => [17000, 38000],
        'Business Administration and Related' => [18500, 34000],
        'Criminal Justice Education' => [21500, 9000],
        'IT-Related' => [12500, 8000],
        'Medical and Allied' => [3000, 15000],
        'Engineering' => [8500, 4000],
        'Agricultural, Forestry, and Fisheries' => [4800, 5200],
        'Other Disciplines' => [9937, 18886],
    ],
    StudentCountKind::Graduates->value => [
        'Education Science and Teacher Training' => [2500, 6100],
        'Business Administration and Related' => [2000, 4900],
        'Criminal Justice Education' => [2400, 800],
        'IT-Related' => [1400, 700],
        'Medical and Allied' => [500, 2500],
        'Engineering' => [900, 400],
        'Agricultural, Forestry, and Fisheries' => [600, 700],
        'Other Disciplines' => [1500, 4090],
    ],
] as $kind => $groups) {
    foreach ($groups as $name => [$male, $female]) {
        StudentCount::query()->create([
            'kind' => $kind,
            'survey_region_id' => $region->id,
            'academic_year_id' => $academicYear->id,
            'discipline_group_id' => DisciplineGroup::query()->where('name', $name)->value('id'),
            'male' => $male,
            'female' => $female,
        ]);
    }
}

// Six more regions with an HEI each, so a Central Office account's dashboard
// lists more regions than its "Every campus counts" card shows. They are
// inactive, so registration, feedback and the surveys still offer Region XII
// alone.
foreach (['I', 'II', 'III', 'IV', 'V', 'VI'] as $number) {
    $extra = SurveyRegion::query()->create(['name' => "Regional Office {$number}", 'is_active' => false]);
    SurveyHei::query()->create([
        'name' => "Region {$number} Fixture College",
        'survey_cluster_id' => SurveyCluster::holdingFor($extra->id)->id,
        'is_active' => true,
    ]);
}
$national = User::factory()->nationalOffice()->create(['email' => 'browser-national@example.test', 'password' => 'browser-password']);
$national->assignRole('admin');

// Twelve notifications for the member, two of them read: comments on their
// seed posts, written as the app writes them and dated days back, so the
// bell's panel and the Notifications page have more to load.
$seedPosts = Post::query()->whereBelongsTo($member, 'author')->oldest('created_at')->get();
foreach (range(1, 12) as $index) {
    $post = $seedPosts[($index - 1) % $seedPosts->count()];
    $comment = $post->comments()->create(['user_id' => $monitoringMember->id, 'body' => "Seed comment {$index}."]);
    $entry = app(ActivityRecorder::class)->record(ActivityAction::Commented, ActivityModule::Community, $post, properties: ['reply' => false], actor: $monitoringMember);
    app(Notifier::class)->postCommented($post, $comment, $entry);
    $at = now()->subDays(2)->subHours($index);
    $entry?->forceFill(['created_at' => $at])->save();
    Notification::query()->where('activity_log_id', $entry?->id)->update([
        'notified_at' => $at,
        'created_at' => $at,
        'read_at' => $index > 10 ? $at : null,
    ]);
}

$server = new Process([PHP_BINARY, '-S', '127.0.0.1:8016', '-t', 'public', 'tests/browser/router.php'], dirname(__DIR__, 2));
$server->setTimeout(null);
try {
    $server->run(function (string $type, string $buffer): void {
        echo $buffer;
    });
} finally {
    $server->stop();
    // Only files derived from the database created above are eligible for cleanup.
    foreach ([$database, $database.'-wal', $database.'-shm'] as $file) {
        if (is_file($file)) {
            unlink($file);
        }
    }
    if (is_dir($uploads)) {
        (new Filesystem)->deleteDirectory($uploads);
    }
    if (is_dir($uploads.'-private')) {
        (new Filesystem)->deleteDirectory($uploads.'-private');
    }
}
