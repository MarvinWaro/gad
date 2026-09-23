<?php

namespace App\Console\Commands;

use App\Models\SurveyResponse;
use Illuminate\Console\Command;

class PruneExpiredSurveyResponses extends Command
{
    protected $signature = 'surveys:prune-expired';

    protected $description = 'Delete survey responses whose configured retention period has elapsed';

    public function handle(): int
    {
        $deleted = SurveyResponse::query()->where('expires_at', '<=', now())->delete();
        $this->info("Deleted {$deleted} expired survey responses.");

        return self::SUCCESS;
    }
}
