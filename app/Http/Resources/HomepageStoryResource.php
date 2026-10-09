<?php

namespace App\Http\Resources;

use App\Models\Post;
use App\Models\PostAchieveItem;
use App\Models\PostImage;
use App\Models\PostSdg;
use App\Support\InstitutionName;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * A post as the public homepage shows it, to anyone, signed in or not. It
 * names the HEI or CHED office that shared it, never the person, and carries
 * nothing else about the author. Load what HomepageStories::top() loads.
 *
 * @mixin Post
 */
class HomepageStoryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $source = $this->source();
        $body = trim((string) $this->body);

        return [
            'id' => $this->id,
            'url' => route('posts.show', $this->resource),
            'title' => $this->title($body, $source),
            'excerpt' => Str::limit(Str::squish($body), 220),
            'body' => $body,
            'source' => $source,
            'posted_at' => $this->created_at?->toIso8601String(),
            // All of them (ten at most), for the same mosaic and viewer as
            // the feed.
            'images' => $this->images->map(fn (PostImage $image): array => [
                'id' => $image->id,
                'url' => $image->url(),
                'width' => $image->width,
                'height' => $image->height,
            ])->values()->all(),
            'reactions' => (int) ($this->reactions_count ?? 0),
            'comments' => (int) ($this->comments_count ?? 0),
            'sdgs' => $this->sdgs->map(fn (PostSdg $sdg): int => $sdg->sdg->value)->sort()->values()->all(),
            'achieve' => $this->achieveItems->map(fn (PostAchieveItem $item): string => $item->item->value)->values()->all(),
        ];
    }

    /** The HEI, or the CHED office its staff member posted from. */
    private function source(): string
    {
        if ($this->hei !== null) {
            return InstitutionName::display($this->hei->name);
        }

        return $this->author?->chedOffice() ?? 'CHED Central Office';
    }

    /** Posts have no title: the first line or sentence stands in for one. */
    private function title(string $body, string $source): string
    {
        $first = Str::of($body)->before("\n")->squish()->toString();
        if (preg_match('/^(.+?[.!?])(\s|$)/u', $first, $sentence) === 1) {
            $first = $sentence[1];
        }

        return $first === '' ? "A GAD activity from {$source}" : Str::limit($first, 80);
    }
}
