<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A certificate design used on a GAD event, one of each kind
 * (docs/certificates.md). Released, its snapshot holds what its certificates
 * print, as it was then: later changes to the design, its signatories or the
 * event reach them only when staff update the released certificates.
 *
 * @phpstan-type CertificateSnapshot array{
 *     kind: string,
 *     background: string,
 *     body: string,
 *     logo_paths: list<string>,
 *     signatories: list<array{name: string, position: string, signature_path: string}>,
 *     office: array{name: string, city: string|null}|null,
 *     event: array{title: string, starts_at: string, ends_at: string|null, is_all_day: bool, location: string|null},
 * }
 *
 * @property string $id
 * @property int $gad_event_id
 * @property string $certificate_design_id
 * @property CarbonImmutable|null $released_at
 * @property int|null $released_by
 * @property CertificateSnapshot|null $snapshot
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['gad_event_id', 'certificate_design_id', 'released_at', 'released_by', 'snapshot'])]
class GadEventCertificate extends Model
{
    use HasUlids;

    protected function casts(): array
    {
        return [
            'released_at' => 'datetime',
            'snapshot' => 'array',
        ];
    }

    /** @return BelongsTo<GadEvent, $this> */
    public function event(): BelongsTo
    {
        return $this->belongsTo(GadEvent::class, 'gad_event_id');
    }

    /** @return BelongsTo<CertificateDesign, $this> */
    public function design(): BelongsTo
    {
        return $this->belongsTo(CertificateDesign::class, 'certificate_design_id');
    }

    /** @return BelongsTo<User, $this> */
    public function releaser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    /** @return HasMany<Certificate, $this> */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function isReleased(): bool
    {
        return $this->released_at !== null;
    }

    /**
     * The CHED office that gave the certificate, as User::chedOffice names
     * offices: a snapshot's regional office, or the Central Office.
     *
     * @param  array{name: string, city: string|null}|null  $office
     */
    public static function officeName(?array $office): string
    {
        return $office !== null ? 'CHED '.$office['name'] : 'CHED Central Office';
    }

    /**
     * The check-ins of people who joined the event: its attendance
     * (docs/event-registration.md). Who earns its certificates is
     * eligibleUsers.
     *
     * @return Builder<GadEventCheckIn>
     */
    public static function earningCheckIns(): Builder
    {
        return GadEventCheckIn::query()->whereExists(fn ($query) => $query
            ->selectRaw('1')
            ->from('gad_event_registrations')
            ->whereColumn('gad_event_registrations.gad_event_id', 'gad_event_check_ins.gad_event_id')
            ->whereColumn('gad_event_registrations.user_id', 'gad_event_check_ins.user_id'));
    }

    /**
     * Who earns this certificate (docs/certificates.md, decided 2026-10-14):
     * people who joined and were checked in on every one of the event's
     * days. Anyone who missed a day asks for it (CertificateRequest).
     *
     * @return Builder<User>
     */
    public function eligibleUsers(): Builder
    {
        $days = $this->event->days();

        return User::query()->whereIn('id', self::earningCheckIns()
            ->select('gad_event_check_ins.user_id')
            ->where('gad_event_check_ins.gad_event_id', $this->gad_event_id)
            ->whereIn('gad_event_check_ins.attended_on', $days)
            ->groupBy('gad_event_check_ins.user_id')
            ->havingRaw('count(distinct gad_event_check_ins.attended_on) >= ?', [count($days)]));
    }

    /**
     * The event's guests who earn it, by the same rule: present every day.
     *
     * @return Builder<GadEventGuest>
     */
    public function eligibleGuests(): Builder
    {
        $days = $this->event->days();

        return GadEventGuest::query()
            ->where('gad_event_id', $this->gad_event_id)
            ->whereIn('id', GadEventGuestDay::query()
                ->select('gad_event_guest_id')
                ->whereIn('attended_on', $days)
                ->groupBy('gad_event_guest_id')
                ->havingRaw('count(*) >= ?', [count($days)]));
    }

    /**
     * People who earn it but haven't been given it yet: everyone at the
     * first release, latecomers after it.
     *
     * @return Builder<User>
     */
    public function awaitingUsers(): Builder
    {
        // Never a NOT IN over a null: guests' certificates have no account.
        return $this->eligibleUsers()->whereNotIn('id', Certificate::query()
            ->select('user_id')
            ->where('gad_event_certificate_id', $this->id)
            ->whereNotNull('user_id'));
    }

    /**
     * Guests who earn it but haven't been given it yet.
     *
     * @return Builder<GadEventGuest>
     */
    public function awaitingGuests(): Builder
    {
        return $this->eligibleGuests()->whereNotIn('id', Certificate::query()
            ->select('gad_event_guest_id')
            ->where('gad_event_certificate_id', $this->id)
            ->whereNotNull('gad_event_guest_id'));
    }

    /**
     * Requests for it from people who missed a day.
     *
     * @return HasMany<CertificateRequest, $this>
     */
    public function certificateRequests(): HasMany
    {
        return $this->hasMany(CertificateRequest::class);
    }
}
