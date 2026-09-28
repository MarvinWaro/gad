<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** @var array<int, array{name: string, slug: string, group: string}> */
    private array $permissions = [
        ['name' => 'View site ratings', 'slug' => 'site-ratings.view', 'group' => 'Site ratings'],
        ['name' => 'Export site ratings', 'slug' => 'site-ratings.export', 'group' => 'Site ratings'],
        ['name' => 'Delete site ratings', 'slug' => 'site-ratings.delete', 'group' => 'Site ratings'],
        ['name' => 'Manage the rating button', 'slug' => 'site-ratings.update', 'group' => 'Site ratings'],
    ];

    /** @var array<string, array<int, string>> */
    private array $grants = [
        'admin' => ['site-ratings.view', 'site-ratings.export', 'site-ratings.delete', 'site-ratings.update'],
        'gad-focal-person' => ['site-ratings.view'],
    ];

    public function up(): void
    {
        // Anonymous "Rate PHLGADIS" answers from the homepage: the stars, an
        // optional suggestion and the time. Nothing identifies the visitor.
        Schema::create('site_ratings', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->unsignedTinyInteger('rating');
            $table->text('suggestion')->nullable();
            $table->timestamps();

            $table->index('rating');
            $table->index('created_at');
        });

        // Small switches the admin pages flip without a deploy, by key.
        Schema::create('site_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->json('value');
            $table->timestamps();
        });

        $now = now();

        foreach ($this->permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission['slug']],
                [...$permission, 'created_at' => $now, 'updated_at' => $now],
            );
        }

        foreach ($this->grants as $roleSlug => $slugs) {
            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');

            if ($roleId === null) {
                continue;
            }

            foreach (DB::table('permissions')->whereIn('slug', $slugs)->pluck('id') as $permissionId) {
                DB::table('permission_role')->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $roleId,
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('permissions')
            ->whereIn('slug', array_column($this->permissions, 'slug'))
            ->delete();

        Schema::dropIfExists('site_settings');
        Schema::dropIfExists('site_ratings');
    }
};
