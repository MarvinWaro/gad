<?php

namespace App\Console\Commands;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Console\Command;

class SetupMonitoring extends Command
{
    protected $signature = 'monitoring:setup';

    protected $description = 'Add monitoring permissions without resetting existing roles or granting geographic access';

    public function handle(): int
    {
        foreach (['view' => 'View monitoring reports', 'review' => 'Review monitoring reports'] as $key => $name) {
            $permission = Permission::query()->firstOrCreate(['slug' => 'monitoring.'.$key], ['name' => $name, 'group' => 'Monitoring']);
            foreach (Role::query()->whereIn('slug', ['admin', 'gad-focal-person'])->get() as $role) {
                $role->permissions()->syncWithoutDetaching([$permission->id]);
            }
        }
        $this->info('Monitoring permissions installed. Assign regional or national monitoring access at /admin/monitoring/access.');

        return self::SUCCESS;
    }
}
