<?php

namespace App\Models;

use App\Support\PublicUpload;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $post_id
 * @property string $path
 * @property string|null $thumbnail_path The feed's smaller copy (PhotoThumbnail).
 * @property int|null $width As displayed, with EXIF rotation applied.
 * @property int|null $height
 * @property int $sort_order
 */
#[Fillable(['post_id', 'path', 'thumbnail_path', 'width', 'height', 'sort_order'])]
class PostImage extends Model
{
    protected function casts(): array
    {
        return [
            'width' => 'integer',
            'height' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Post, $this> */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function url(): string
    {
        return PublicUpload::url($this->path);
    }

    /**
     * The photo as the feed, a post's page and the homepage send it: the
     * tiles show the thumbnail, the viewer the photo itself.
     *
     * @return array{id: int, url: string, thumbnail_url: string|null, width: int|null, height: int|null}
     */
    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'url' => $this->url(),
            'thumbnail_url' => $this->thumbnail_path !== null ? PublicUpload::url($this->thumbnail_path) : null,
            'width' => $this->width,
            'height' => $this->height,
        ];
    }

    /**
     * Its files on the public disk, to delete with it.
     *
     * @return list<string>
     */
    public function files(): array
    {
        return array_values(array_filter([$this->path, $this->thumbnail_path]));
    }
}
