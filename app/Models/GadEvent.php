<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A regional GAD event that CHED staff publish for HEIs to follow.
 *
 * @property int $id
 * @property string $title
 * @property string|null $description
 * @property string|null $location
 * @property string $category
 * @property Carbon $starts_at
 * @property Carbon|null $ends_at
 * @property bool $is_all_day
 * @property int|null $created_by
 */
#[Fillable(['title', 'description', 'location', 'category', 'starts_at', 'ends_at', 'is_all_day', 'created_by'])]
class GadEvent extends Model
{
    public const CATEGORIES = ['training', 'campaign', 'deadline', 'meeting', 'other'];

    /**
     * Events are regional, so their times are Philippine wall-clock times.
     * They are stored and sent without an offset and read the same everywhere.
     */
    public const TIMEZONE = 'Asia/Manila';

    /** The current Philippine wall-clock time, comparable with stored event times. */
    public static function localNow(): CarbonImmutable
    {
        return CarbonImmutable::parse(CarbonImmutable::now(self::TIMEZONE)->toDateTimeString());
    }

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_all_day' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Events that touch the given range, including multi-day events that
     * started before it and are still running.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeBetween(Builder $query, CarbonInterface $from, CarbonInterface $to): void
    {
        $query
            ->where('starts_at', '<=', $to)
            ->where(fn (Builder $query) => $query
                ->where('starts_at', '>=', $from)
                ->orWhere('ends_at', '>=', $from));
    }

    /** @return array<string, mixed> */
    public function toCalendarArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'category' => $this->category,
            'starts_at' => $this->starts_at->format('Y-m-d\TH:i:s'),
            'ends_at' => $this->ends_at?->format('Y-m-d\TH:i:s'),
            'is_all_day' => $this->is_all_day,
        ];
    }
}
