<?php

namespace App\Console\Commands;

use App\Models\PostImage;
use App\Support\PhotoThumbnail;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;

class MakePostThumbnails extends Command
{
    protected $signature = 'posts:thumbnails';

    protected $description = 'Make the feed\'s smaller copies of post photos posted before thumbnails were made (run once after deploying them)';

    public function handle(): int
    {
        if (! extension_loaded('gd')) {
            $this->error('PHP\'s GD extension is missing, so no thumbnails can be made.');

            return self::FAILURE;
        }

        $made = 0;
        $skipped = 0;

        PostImage::query()
            ->whereNull('thumbnail_path')
            ->chunkById(100, function (Collection $images) use (&$made, &$skipped): void {
                foreach ($images as $image) {
                    $thumbnail = PhotoThumbnail::fromStored($image->path);

                    if ($thumbnail === null) {
                        // Already small enough, or unreadable: the feed shows the photo.
                        $skipped++;

                        continue;
                    }

                    $image->forceFill(['thumbnail_path' => $thumbnail])->save();
                    $made++;
                }
            });

        $this->info("Made {$made} thumbnails; {$skipped} photos are shown as they are.");

        return self::SUCCESS;
    }
}
