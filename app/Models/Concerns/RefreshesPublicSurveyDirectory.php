<?php

namespace App\Models\Concerns;

use App\Support\PublicSurveyDirectory;

/**
 * For the directory's regions, clusters and HEIs: any change shows in the
 * public surveys' cached region and HEI lists (PublicSurveyDirectory) at once.
 */
trait RefreshesPublicSurveyDirectory
{
    public static function bootRefreshesPublicSurveyDirectory(): void
    {
        static::created(fn () => PublicSurveyDirectory::forget());
        static::updated(fn () => PublicSurveyDirectory::forget());
        static::deleted(fn () => PublicSurveyDirectory::forget());
    }
}
