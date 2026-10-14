<?php

namespace App\Actions\Certificates;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\CertificateKind;
use App\Models\Certificate;
use App\Models\CertificateDesign;
use App\Models\CertificateSignatory;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\GadEventGuest;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use App\Support\CertificateNumber;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * An event's certificates (docs/certificates.md): using a design on the
 * event, one of each kind; releasing it to everyone present on every day,
 * guests too, by itself when the event ends (`certificates:release-due`) or
 * by staff before, and again to those who earn it since; giving it to one
 * person or guest; updating what released certificates print; and
 * withdrawing one given by mistake. Released, a certificate keeps the
 * design, signatories, office and event as they were, until staff update it.
 *
 * @phpstan-import-type CertificateSnapshot from GadEventCertificate
 */
final class ManageEventCertificate
{
    /** Certificates written per insert. */
    private const CHUNK = 500;

    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    public function attach(CertificateDesign $design, GadEvent $event): GadEventCertificate
    {
        $problem = match (true) {
            $event->category === 'deadline' => __('Deadlines have no one checked in, so they give no certificates.'),
            $event->survey_region_id !== $design->survey_region_id => __('Use a design of the event\'s own office on it.'),
            $event->certificates()->where('certificate_design_id', $design->id)->exists() => __('This design is already used on :event.', ['event' => $event->title]),
            $event->certificates()->whereHas('design', fn (Builder $query) => $query->where('kind', $design->kind))->exists() => __(':event already gives a :kind. Remove that one first.', ['event' => $event->title, 'kind' => $design->kind->title()]),
            default => null,
        };

        if ($problem !== null) {
            throw ValidationException::withMessages(['event' => $problem]);
        }

        $use = GadEventCertificate::query()->create([
            'gad_event_id' => $event->id,
            'certificate_design_id' => $design->id,
        ]);
        $use->setRelation('event', $event)->setRelation('design', $design);
        $this->activity->record(ActivityAction::Created, ActivityModule::Certificates, $use);

        return $use;
    }

    /**
     * Uses the design on the event with its pair, the other kind
     * (CertificateDesign::partner), unless the event gives that kind already:
     * the two are chosen together (decided 2026-10-14).
     *
     * @throws ValidationException
     */
    public function attachWithPair(CertificateDesign $design, GadEvent $event): GadEventCertificate
    {
        return DB::transaction(function () use ($design, $event): GadEventCertificate {
            $use = $this->attach($design, $event);
            $partner = $design->partner();

            if ($partner !== null && $this->kindsGiven($event)->doesntContain($partner->kind)) {
                $this->attach($partner, $event);
            }

            return $use;
        });
    }

    /** Only before release: released certificates stay valid. Its pair comes off with it. */
    public function detach(GadEventCertificate $use): void
    {
        if ($use->isReleased()) {
            throw ValidationException::withMessages([
                'certificate' => __('These certificates were released, so they stay. Withdraw any given by mistake instead.'),
            ]);
        }

        $use->loadMissing(['event', 'design']);
        $partner = $use->design->partner();
        $paired = $partner === null ? null : $use->event->certificates()
            ->where('certificate_design_id', $partner->id)
            ->whereNull('released_at')
            ->first();

        foreach (array_filter([$use, $paired]) as $each) {
            $each->loadMissing(['event', 'design']);
            $each->delete();
            $this->activity->record(ActivityAction::Deleted, ActivityModule::Certificates, $each);
        }
    }

    /**
     * Gives the certificate to everyone present on every day who doesn't
     * have it yet, guests included, and tells those with an account. The
     * first release freezes what it prints. Without `$staff` it is the
     * automatic release at the event's end.
     *
     * @return int How many were given.
     */
    public function release(?User $staff, GadEventCertificate $use): int
    {
        $use->loadMissing(['event.region', 'design.signatories']);
        $this->ensurePrintable($use);

        if ($use->event->isCancelled()) {
            throw ValidationException::withMessages([
                'certificate' => __(':event was cancelled, so it gives no certificates.', ['event' => $use->event->title]),
            ]);
        }

        if ($use->awaitingUsers()->doesntExist() && $use->awaitingGuests()->doesntExist()) {
            throw ValidationException::withMessages([
                'certificate' => $use->isReleased()
                    ? __('Everyone present on every day already has this certificate.')
                    : __('No one has been present on every day of this event yet.'),
            ]);
        }

        // The second, so the new holders can be found by it.
        $now = CarbonImmutable::now()->startOfSecond();
        $issued = DB::transaction(function () use ($staff, $use, $now): int {
            if (! $use->isReleased()) {
                $use->update([
                    'released_at' => $now,
                    'released_by' => $staff?->id,
                    'snapshot' => $this->snapshot($use->design, $use->event),
                ]);
            }

            return $this->issue($use, $now) + $this->issueToGuests($use, $now);
        });

        $entry = $this->activity->record(ActivityAction::Released, ActivityModule::Certificates, $use, properties: ['people' => $issued], actor: $staff);
        $holders = User::query()->whereIn('id', Certificate::query()
            ->select('user_id')
            ->where('gad_event_certificate_id', $use->id)
            ->where('issued_at', $now)
            ->whereNotNull('user_id'));
        $staff !== null
            ? $this->notifier->certificateReleased($entry, $holders)
            : $this->notifier->certificateReady($entry, $holders);

        return $issued;
    }

    /**
     * Staff releasing an event's certificates: every kind it gives, at once,
     * each to everyone who earns it (decided 2026-10-14). Refused unless all
     * of them can print.
     *
     * @return int How many certificates were given, of every kind.
     *
     * @throws ValidationException
     */
    public function releaseTogether(User $staff, GadEventCertificate $use): int
    {
        $uses = $use->event->certificates()->with(['event.region', 'design.signatories'])->get();
        $uses->each(fn (GadEventCertificate $each) => $this->ensurePrintable($each));
        $ready = $uses->filter(fn (GadEventCertificate $each): bool => $each->awaitingUsers()->exists() || $each->awaitingGuests()->exists());

        if ($ready->isEmpty()) {
            // Says why: nobody present every day yet, or everyone has it.
            return $this->release($staff, $use);
        }

        return $ready->sum(fn (GadEventCertificate $each): int => $this->release($staff, $each));
    }

    /**
     * Gives the released certificate to one person or guest, whatever their
     * attendance: an approved request (ManageCertificateRequest), or a guest
     * staff give it to. The caller logs it and tells them.
     */
    public function issueTo(GadEventCertificate $use, User|GadEventGuest $holder): Certificate
    {
        if (! $use->isReleased()) {
            throw ValidationException::withMessages([
                'certificate' => __('This certificate goes out when the event ends. Give it after that.'),
            ]);
        }

        $key = $holder instanceof User ? 'user_id' : 'gad_event_guest_id';
        if ($use->certificates()->where($key, $holder->getKey())->exists()) {
            throw ValidationException::withMessages([
                'certificate' => __(':name already has this certificate.', ['name' => $holder->name]),
            ]);
        }

        return Certificate::query()->create([
            'gad_event_certificate_id' => $use->id,
            $key => $holder->getKey(),
            'number' => CertificateNumber::unique(),
            ...$this->holderDetails($holder),
        ]);
    }

    /**
     * Staff give the released certificate to a guest who missed a day, as
     * people without an account can't ask for it.
     *
     * @throws ValidationException
     */
    public function giveToGuest(User $staff, GadEventCertificate $use, GadEventGuest $guest): Certificate
    {
        if ((int) $guest->gad_event_id !== (int) $use->gad_event_id) {
            throw ValidationException::withMessages(['guest' => __('That guest is not at this event.')]);
        }

        $certificate = $this->issueTo($use, $guest);
        $certificate->setRelation('eventCertificate', $use);
        $this->activity->record(ActivityAction::Released, ActivityModule::Certificates, $certificate, actor: $staff);

        return $certificate;
    }

    /**
     * Released certificates print the design, signatories and event as they
     * are now, and their holders' names and affiliations as their accounts
     * have them now: for corrections, such as a misspelt name.
     *
     * @return int How many holders' names or affiliations changed.
     */
    public function refresh(GadEventCertificate $use): int
    {
        if (! $use->isReleased()) {
            throw ValidationException::withMessages([
                'certificate' => __('Release these certificates first.'),
            ]);
        }

        $use->loadMissing(['event.region', 'design.signatories']);
        $this->ensurePrintable($use);
        $use->update(['snapshot' => $this->snapshot($use->design, $use->event)]);
        $renamed = 0;

        $use->certificates()
            ->with(['user:id,name,survey_hei_id,survey_region_id', 'user.hei:id,name,survey_cluster_id', 'user.hei.cluster:id,survey_region_id', 'user.officeRegion:id,name', 'guest'])
            ->chunkById(self::CHUNK, function (Collection $certificates) use (&$renamed): void {
                $certificates->each(function (Certificate $certificate) use (&$renamed): void {
                    $holder = $certificate->user ?? $certificate->guest;
                    if ($holder === null) {
                        return;
                    }
                    $current = $this->holderDetails($holder);

                    if (array_diff_assoc($current, $certificate->only(array_keys($current))) !== []) {
                        $certificate->update($current);
                        $renamed++;
                    }
                });
            });

        $this->activity->record(ActivityAction::Updated, ActivityModule::Certificates, $use, properties: ['people' => $renamed]);

        return $renamed;
    }

    public function withdraw(User $staff, Certificate $certificate): void
    {
        if ($certificate->isWithdrawn()) {
            return;
        }

        $certificate->update(['withdrawn_at' => now(), 'withdrawn_by' => $staff->id]);
        $this->activity->record(ActivityAction::Withdrawn, ActivityModule::Certificates, $certificate);
    }

    public function restore(Certificate $certificate): void
    {
        if (! $certificate->isWithdrawn()) {
            return;
        }

        $certificate->update(['withdrawn_at' => null, 'withdrawn_by' => null]);
        $this->activity->record(ActivityAction::Restored, ActivityModule::Certificates, $certificate);
    }

    /**
     * What keeps the certificate from printing, or null when it can. The
     * release page shows it, as the automatic release skips such a
     * certificate.
     */
    public function printProblem(GadEventCertificate $use): ?string
    {
        try {
            $this->ensurePrintable($use);

            return null;
        } catch (ValidationException $problem) {
            return $problem->getMessage();
        }
    }

    /**
     * Whether the certificate can print: someone signs it, and its blanks
     * have something to say.
     *
     * @throws ValidationException
     */
    private function ensurePrintable(GadEventCertificate $use): void
    {
        $use->loadMissing(['event', 'design.signatories']);
        $design = $use->design;
        $event = $use->event;
        $problem = match (true) {
            $design->signatories->isEmpty() => __('Add a signatory to :name first.', ['name' => $design->name]),
            in_array('venue', CertificateDesign::blanksIn($design->body), true) && blank($event->location) => __('The wording says where the event was held ({venue}), but :event has no venue. Add one to the event, or take {venue} out of the wording.', ['event' => $event->title]),
            default => null,
        };

        if ($problem !== null) {
            throw ValidationException::withMessages(['certificate' => $problem]);
        }
    }

    /**
     * The kinds the event gives already.
     *
     * @return SupportCollection<int, CertificateKind>
     */
    private function kindsGiven(GadEvent $event): SupportCollection
    {
        return $event->certificates()->with('design:id,kind')->get()->map(fn (GadEventCertificate $each): CertificateKind => $each->design->kind);
    }

    /**
     * What a certificate keeps of its holder, as they are now: an account's
     * name, affiliation and place, or a guest's name and organization.
     *
     * @return array{name: string, affiliation: string|null, survey_region_id: int|null, survey_hei_id: int|null}
     */
    private function holderDetails(User|GadEventGuest $holder): array
    {
        if ($holder instanceof GadEventGuest) {
            return ['name' => $holder->name, 'affiliation' => $holder->affiliation(), 'survey_region_id' => null, 'survey_hei_id' => null];
        }

        $holder->loadMissing(['hei:id,name,survey_cluster_id', 'hei.cluster:id,survey_region_id', 'officeRegion:id,name']);

        return [
            'name' => $holder->name,
            'affiliation' => $holder->affiliation(),
            'survey_region_id' => $holder->regionId(),
            'survey_hei_id' => $holder->survey_hei_id,
        ];
    }

    /**
     * What the certificates print, as it is now.
     *
     * @return CertificateSnapshot
     */
    private function snapshot(CertificateDesign $design, GadEvent $event): array
    {
        $office = $event->region;

        return [
            'kind' => $design->kind->value,
            'background' => $design->background,
            'body' => $design->body,
            'logo_paths' => $design->logo_paths,
            'signatories' => array_values($design->signatories->map(fn (CertificateSignatory $signatory): array => [
                'name' => $signatory->name,
                'position' => $signatory->position,
                'signature_path' => $signatory->signature_path,
            ])->all()),
            'office' => $office !== null ? ['name' => $office->name, 'city' => $office->office_city] : null,
            'event' => [
                'title' => $event->title,
                'starts_at' => $event->starts_at->format('Y-m-d\TH:i:s'),
                'ends_at' => $event->ends_at?->format('Y-m-d\TH:i:s'),
                'is_all_day' => $event->is_all_day,
                'location' => $event->location,
            ],
        ];
    }

    /**
     * One certificate each for those still waiting, with the name,
     * affiliation and place they have now. Safe to run twice at once: the
     * unique keys drop a repeat, and a number already taken (one in about a
     * trillion) is drawn again on the next pass.
     */
    private function issue(GadEventCertificate $use, CarbonImmutable $now): int
    {
        $issued = 0;

        for ($pass = 0; $pass < 3 && $use->awaitingUsers()->exists(); $pass++) {
            $use->awaitingUsers()
                ->select(['id', 'name', 'survey_hei_id', 'survey_region_id'])
                ->with(['hei:id,name,survey_cluster_id', 'hei.cluster:id,survey_region_id', 'officeRegion:id,name'])
                ->chunkById(self::CHUNK, function (Collection $holders) use ($use, $now, &$issued): void {
                    $issued += Certificate::query()->insertOrIgnore($holders->map(fn (User $holder): array => [
                        'id' => strtolower((string) Str::ulid()),
                        'gad_event_certificate_id' => $use->id,
                        'user_id' => $holder->id,
                        'number' => CertificateNumber::generate(),
                        'name' => $holder->name,
                        'affiliation' => $holder->affiliation(),
                        'survey_region_id' => $holder->regionId(),
                        'survey_hei_id' => $holder->survey_hei_id,
                        'issued_at' => $now,
                    ])->values()->all());
                });
        }

        return $issued;
    }

    /** One certificate each for the guests still waiting, as issue() does for accounts. */
    private function issueToGuests(GadEventCertificate $use, CarbonImmutable $now): int
    {
        $issued = 0;

        for ($pass = 0; $pass < 3 && $use->awaitingGuests()->exists(); $pass++) {
            $use->awaitingGuests()
                ->chunkById(self::CHUNK, function (Collection $guests) use ($use, $now, &$issued): void {
                    $issued += Certificate::query()->insertOrIgnore($guests->map(fn (GadEventGuest $guest): array => [
                        'id' => strtolower((string) Str::ulid()),
                        'gad_event_certificate_id' => $use->id,
                        'gad_event_guest_id' => $guest->id,
                        'number' => CertificateNumber::generate(),
                        ...$this->holderDetails($guest),
                        'issued_at' => $now,
                    ])->values()->all());
                });
        }

        return $issued;
    }
}
