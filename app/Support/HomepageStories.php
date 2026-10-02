<?php

namespace App\Support;

use App\Enums\UserStatus;
use App\Http\Resources\HomepageStoryResource;
use App\Models\Post;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

/**
 * The public homepage's "Gender mainstreaming in action": the photo posts
 * the network reacted to most this academic year. Shares never count, and a
 * moderator can keep any post off the homepage. Posts without reactions still
 * fill the places, newest first, so the section is never half empty early in
 * the year. See docs/homepage.md.
 */
class HomepageStories
{
    /** The big card and the two beside it. */
    public const LIMIT = 3;

    private const CACHE_KEY = 'homepage:stories';

    private const CACHE_SECONDS = 600;

    /** @return list<array<string, mixed>> */
    public static function top(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, function (): array {
            [$from, $until] = ReportingPeriod::year(AcademicPeriod::current()['academic_year'])->utcBounds();

            $posts = Post::query()
                ->whereNull('shared_post_id')
                ->whereNull('homepage_hidden_at')
                ->whereHas('images')
                ->whereHas('author', fn (Builder $query) => $query->where('status', UserStatus::Active))
                ->where('created_at', '>=', $from)
                ->where('created_at', '<', $until)
                ->with([
                    'images',
                    'hei:id,name',
                    'author:id,survey_region_id,national_access',
                    'author.officeRegion:id,name',
                    'sdgs',
                    'achieveItems',
                ])
                ->withCount(['reactions', 'comments'])
                ->orderByDesc('reactions_count')
                ->orderByDesc('comments_count')
                ->latest()
                ->latest('id')
                ->limit(self::LIMIT)
                ->get();

            return array_values(HomepageStoryResource::collection($posts)->resolve());
        });
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
