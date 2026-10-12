<?php

namespace App\Actions\Certificates;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Certificate;
use App\Models\CertificateDesign;
use App\Models\CertificateSignatory;
use App\Models\GadEvent;
use App\Models\GadEventCertificate;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use App\Support\CertificateNumber;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * An event's certificates (docs/certificates.md): using a design on the
 * event, one of each kind; releasing it to everyone checked in, and again
 * to those checked in since; updating what released certificates print;
 * and withdrawing one given by mistake. Released, a certificate keeps the
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

    /** Only before release: released certificates stay valid. */
    public function detach(GadEventCertificate $use): void
    {
        if ($use->isReleased()) {
            throw ValidationException::withMessages([
                'certificate' => __('These certificates were released, so they stay. Withdraw any given by mistake instead.'),
            ]);
        }

        $use->loadMissing(['event', 'design']);
        $use->delete();
        $this->activity->record(ActivityAction::Deleted, ActivityModule::Certificates, $use);
    }

    /**
     * Gives the certificate to everyone checked in who doesn't have it yet,
     * and tells them. The first release freezes what it prints.
     *
     * @return int How many were given.
     */
    public function release(User $staff, GadEventCertificate $use): int
    {
        $use->loadMissing(['event.region', 'design.signatories']);
        $this->ensurePrintable($use);

        if ($use->awaitingUsers()->doesntExist()) {
            throw ValidationException::withMessages([
                'certificate' => $use->isReleased()
                    ? __('Everyone checked in already has this certificate.')
                    : __('No one has been checked in to this event yet.'),
            ]);
        }

        // The second, so the new holders can be found by it.
        $now = CarbonImmutable::now()->startOfSecond();
        $issued = DB::transaction(function () use ($staff, $use, $now): int {
            if (! $use->isReleased()) {
                $use->update([
                    'released_at' => $now,
                    'released_by' => $staff->id,
                    'snapshot' => $this->snapshot($use->design, $use->event),
                ]);
            }

            return $this->issue($use, $now);
        });

        $entry = $this->activity->record(ActivityAction::Released, ActivityModule::Certificates, $use, properties: ['people' => $issued]);
        $this->notifier->certificateReleased($entry, User::query()->whereIn('id', Certificate::query()
            ->select('user_id')
            ->where('gad_event_certificate_id', $use->id)
            ->where('issued_at', $now)));

        return $issued;
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
            ->with(['user:id,name,survey_hei_id,survey_region_id', 'user.hei:id,name,survey_cluster_id', 'user.hei.cluster:id,survey_region_id', 'user.officeRegion:id,name'])
            ->chunkById(self::CHUNK, function (Collection $certificates) use (&$renamed): void {
                $certificates->each(function (Certificate $certificate) use (&$renamed): void {
                    $holder = $certificate->user;
                    $current = [
                        'name' => $holder->name,
                        'affiliation' => $holder->affiliation(),
                        'survey_region_id' => $holder->regionId(),
                        'survey_hei_id' => $holder->survey_hei_id,
                    ];

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

    /** Whether the certificate can print: someone signs it, and its blanks have something to say. */
    private function ensurePrintable(GadEventCertificate $use): void
    {
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
}
