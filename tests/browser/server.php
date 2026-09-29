<?php

// This server always creates its own database. Never reuse a development server
// or load cached application configuration for browser tests.
use App\Models\Post;
use App\Models\Survey;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use Database\Seeders\RbacSeeder;
use Database\Seeders\SurveyDirectorySeeder;
use Database\Seeders\SurveySeeder;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Filesystem\Filesystem;
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
$monitoringMember->assignRole('hei');

// Eleven older posts from an HEI, so the community feed has a second page
// to load. They sit below anything a test posts.
$member = User::factory()->create(['name' => 'Browser Test Member', 'survey_hei_id' => $hei->id]);
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
