<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A GAD event that CHED staff publish for HEIs to follow: for one region's
 * HEIs, or every region's.
 *
 * @property int $id
 * @property int|null $survey_region_id Null: for every region.
 * @property string $title
 * @property string|null $description
 * @property string|null $location
 * @property string $category
 * @property Carbon $starts_at
 * @property Carbon|null $ends_at
 * @property bool $is_all_day
 * @property int|null $created_by
 */
#[Fillable(['survey_region_id', 'title', 'description', 'location', 'category', 'starts_at', 'ends_at', 'is_all_day', 'created_by'])]
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

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /**
     * Who came, a row per person per day (docs/event-check-in.md).
     *
     * @return HasMany<GadEventCheckIn, $this>
     */
    public function checkIns(): HasMany
    {
        return $this->hasMany(GadEventCheckIn::class);
    }

    /**
     * The certificate designs used on it, one of each kind
     * (docs/certificates.md).
     *
     * @return HasMany<GadEventCertificate, $this>
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(GadEventCertificate::class);
    }

    /**
     * Events an account sees: every one for the Central Office; otherwise
     * those for every region and its own region's (an HEI account's through
     * its HEI, staff by their office).
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->national_access) {
            return;
        }

        $regionId = $user->regionId();

        $query->where(fn (Builder $query) => $query
            ->whereNull('survey_region_id')
            ->when($regionId !== null, fn (Builder $query) => $query->orWhere('survey_region_id', $regionId)));
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

    /**
     * Events people can be checked in to on `$now`'s Philippine day: those
     * running that day, multi-day ones included, but never a deadline,
     * which nobody attends. The scanner's list and the check-in itself
     * both ask this.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeOpenForCheckIn(Builder $query, CarbonImmutable $now): void
    {
        $query
            ->where('category', '!=', 'deadline')
            ->between($now->startOfDay(), $now->endOfDay());
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
