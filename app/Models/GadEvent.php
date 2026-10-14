<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A GAD event that CHED staff publish for HEIs to follow and join: for one
 * region's HEIs, or every region's.
 *
 * @property int $id
 * @property string $ulid Public: the event page's address (/events/{ulid}).
 * @property int|null $survey_region_id Null: for every region.
 * @property string $title
 * @property string|null $description
 * @property string|null $location
 * @property string $category
 * @property bool $is_public Shown on the public website (scopeOnPublicSite); staff may keep it off.
 * @property Carbon $starts_at
 * @property Carbon|null $ends_at
 * @property CarbonImmutable|null $registration_closes_at When joining stops; null: when the event ends.
 * @property bool $is_all_day
 * @property int|null $created_by
 * @property CarbonImmutable|null $cancelled_at When staff cancelled it (UTC); null while it is on.
 */
#[Fillable(['survey_region_id', 'title', 'description', 'location', 'category', 'is_public', 'starts_at', 'ends_at', 'registration_closes_at', 'is_all_day', 'created_by'])]
class GadEvent extends Model
{
    use HasUlids;

    public const CATEGORIES = ['training', 'campaign', 'deadline', 'meeting', 'other'];

    /** Where an event stands (statusAt): codes sent as they are. */
    public const STATUSES = ['ongoing', 'upcoming', 'ended', 'cancelled'];

    /**
     * Events are regional, so their times are Philippine wall-clock times.
     * They are stored and sent without an offset and read the same everywhere.
     */
    public const TIMEZONE = 'Asia/Manila';

    /**
     * Mirror the column default so unsaved models agree with the database.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_public' => true,
    ];

    /** The current Philippine wall-clock time, comparable with stored event times. */
    public static function localNow(): CarbonImmutable
    {
        return CarbonImmutable::parse(CarbonImmutable::now(self::TIMEZONE)->toDateTimeString());
    }

    /**
     * The public ULID, filled in on creation; the key stays a number.
     *
     * @return list<string>
     */
    public function uniqueIds(): array
    {
        return ['ulid'];
    }

    protected function casts(): array
    {
        return [
            'survey_region_id' => 'integer',
            'is_public' => 'boolean',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'registration_closes_at' => 'datetime',
            'is_all_day' => 'boolean',
            'created_by' => 'integer',
            'cancelled_at' => 'datetime',
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
     * Who joined it before it, once each (docs/event-registration.md).
     *
     * @return HasMany<GadEventRegistration, $this>
     */
    public function registrations(): HasMany
    {
        return $this->hasMany(GadEventRegistration::class);
    }

    /**
     * Its guests without an account, such as people from other agencies.
     *
     * @return HasMany<GadEventGuest, $this>
     */
    public function guests(): HasMany
    {
        return $this->hasMany(GadEventGuest::class);
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
     * Where the event stands at `$now` (Philippine time), as a fixed code:
     * `cancelled` once staff cancelled it, otherwise `upcoming` before it
     * starts, `ongoing` until it is over, then `ended`. scopeInStatus is the
     * same rule for queries.
     */
    public function statusAt(CarbonImmutable $now): string
    {
        return match (true) {
            $this->isCancelled() => 'cancelled',
            $now->lessThan($this->starts_at) => 'upcoming',
            $now->lessThan($this->finishesAt()) => 'ongoing',
            default => 'ended',
        };
    }

    /**
     * Events in one of STATUSES at `$now`, by the rule statusAt() keeps: an
     * event without an end is over with its first day.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeInStatus(Builder $query, string $status, CarbonImmutable $now): void
    {
        if ($status === 'cancelled') {
            $query->whereNotNull('cancelled_at');

            return;
        }

        $today = $now->startOfDay();
        $query->whereNull('cancelled_at');

        // Each written out in full: a NOT over a null end would match nothing.
        match ($status) {
            'upcoming' => $query->where('starts_at', '>', $now),
            'ongoing' => $query->where('starts_at', '<=', $now)->where(fn (Builder $query) => $query
                ->where('ends_at', '>', $now)
                ->orWhere(fn (Builder $query) => $query->whereNull('ends_at')->where('starts_at', '>=', $today))),
            default => $query->where(fn (Builder $query) => $query
                ->where('ends_at', '<=', $now)
                ->orWhere(fn (Builder $query) => $query->whereNull('ends_at')->where('starts_at', '<', $today))),
        };
    }

    /**
     * Events still on at `$now`, happening or upcoming: everything statusAt()
     * doesn't call ended. Oldest start first, that puts those on now ahead of
     * the next ones.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeNotEndedAt(Builder $query, CarbonImmutable $now): void
    {
        $query->where(fn (Builder $query) => $query
            ->where('ends_at', '>', $now)
            ->orWhere(fn (Builder $query) => $query->whereNull('ends_at')->where('starts_at', '>=', $now->startOfDay())));
    }

    /** When the event is over: its end, or the end of its day when it has none. */
    public function finishesAt(): CarbonInterface
    {
        return $this->ends_at ?? $this->starts_at->copy()->endOfDay()->startOfSecond();
    }

    /**
     * The Philippine days it runs on, first to last, as `Y-m-d`: the days
     * people are checked in on, and all of them earn its certificate
     * (GadEventCertificate::eligibleUsers).
     *
     * @return list<string>
     */
    public function days(): array
    {
        $days = [];
        $last = $this->finishesAt()->toDateString();

        for ($day = CarbonImmutable::parse($this->starts_at->toDateString()); $day->toDateString() <= $last; $day = $day->addDay()) {
            $days[] = $day->toDateString();
        }

        return $days;
    }

    public function isCancelled(): bool
    {
        return $this->cancelled_at !== null;
    }

    /** Whether the person joined it or was added to it, whatever their region. */
    public function isRegisteredFor(User $user): bool
    {
        return $this->registrations()->where('user_id', $user->id)->exists();
    }

    /** When joining stops: the time staff set, or the event's end, whichever comes first. */
    public function registrationClosesAt(): CarbonInterface
    {
        $end = $this->finishesAt();
        $closes = $this->registration_closes_at;

        return $closes !== null && $closes->lessThan($end) ? $closes : $end;
    }

    /**
     * Whether people may join, or leave, at `$now` (Philippine time). Never a
     * deadline, which nobody attends, nor a cancelled event.
     */
    public function acceptsRegistrations(CarbonImmutable $now): bool
    {
        return $this->category !== 'deadline' && ! $this->isCancelled() && $now->lessThan($this->registrationClosesAt());
    }

    /**
     * Adds `joined`: whether the viewer joined each event.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeWithJoinedBy(Builder $query, User $viewer): void
    {
        $query->withExists(['registrations as joined' => fn (Builder $query) => $query->where('user_id', $viewer->id)]);
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
     * The events on an account's calendars: those it sees (scopeVisibleTo),
     * and those it joined or was added to from another region, such as an
     * invitee's (docs/event-registration.md). Only the calendars widen;
     * staff work still follows scopeVisibleTo.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeOnCalendarOf(Builder $query, User $user): void
    {
        if ($user->national_access) {
            return;
        }

        $query->where(fn (Builder $query) => $query
            ->visibleTo($user)
            ->orWhereHas('registrations', fn (Builder $query) => $query->where('user_id', $user->id)));
    }

    /** The same rule as scopeVisibleTo, for an event already in hand, without a query. */
    public function isVisibleTo(User $user): bool
    {
        if ($user->national_access || $this->survey_region_id === null) {
            return true;
        }

        $regionId = $user->regionId();

        return $regionId !== null && (int) $regionId === $this->survey_region_id;
    }

    /**
     * Events on the public website (docs/event-registration.md): those staff
     * left public, never a deadline, which is for HEIs alone.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeOnPublicSite(Builder $query): void
    {
        $query->where('is_public', true)->where('category', '!=', 'deadline');
    }

    /** The same rule as scopeOnPublicSite, for an event already in hand. */
    public function isOnPublicSite(): bool
    {
        return $this->is_public && $this->category !== 'deadline';
    }

    /**
     * A region's events and those for every region, as its HEIs see them
     * (scopeVisibleTo); every event without one.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeForRegion(Builder $query, ?int $regionId): void
    {
        $query->when($regionId !== null, fn (Builder $query) => $query->where(fn (Builder $query) => $query
            ->whereNull('survey_region_id')
            ->orWhere('survey_region_id', $regionId)));
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
     * which nobody attends, nor a cancelled one. The scanner's list and the
     * check-in itself both ask this.
     *
     * @param  Builder<GadEvent>  $query
     */
    public function scopeOpenForCheckIn(Builder $query, CarbonImmutable $now): void
    {
        $query
            ->where('category', '!=', 'deadline')
            ->whereNull('cancelled_at')
            ->between($now->startOfDay(), $now->endOfDay());
    }

    /**
     * The event as every calendar, list and page sends it, in wall-clock
     * time. `joined` comes only when asked for (scopeWithJoinedBy).
     *
     * @return array<string, mixed>
     */
    public function toCalendarArray(): array
    {
        return [
            'id' => $this->id,
            'ulid' => $this->ulid,
            'title' => $this->title,
            'description' => $this->description,
            'location' => $this->location,
            'category' => $this->category,
            'starts_at' => $this->starts_at->format('Y-m-d\TH:i:s'),
            'ends_at' => $this->ends_at?->format('Y-m-d\TH:i:s'),
            'registration_closes_at' => $this->registration_closes_at?->format('Y-m-d\TH:i:s'),
            'is_all_day' => $this->is_all_day,
            'cancelled' => $this->isCancelled(),
            ...(array_key_exists('joined', $this->getAttributes()) ? ['joined' => (bool) $this->getAttribute('joined')] : []),
        ];
    }
}
