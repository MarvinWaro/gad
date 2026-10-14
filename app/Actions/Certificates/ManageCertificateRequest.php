<?php

namespace App\Actions\Certificates;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Enums\CertificateRequestStatus;
use App\Models\CertificateRequest;
use App\Models\GadEventCertificate;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Certificates for people who missed a day of an event (docs/certificates.md):
 * they ask for one of its released certificates with a reason, and its
 * office approves, which gives it to them, or declines with a note. Both
 * sides are told.
 */
final class ManageCertificateRequest
{
    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
        private readonly ManageEventCertificate $certificates,
    ) {}

    /**
     * Once per certificate, by someone who joined and was checked in on at
     * least one day but doesn't hold it, after it went out.
     *
     * @throws ValidationException
     */
    public function request(User $person, GadEventCertificate $use, string $reason): CertificateRequest
    {
        $use->loadMissing(['event', 'design']);
        $event = $use->event;
        $problem = match (true) {
            $event->isCancelled() => __(':event was cancelled, so it gives no certificates.', ['event' => $event->title]),
            ! $use->isReleased() => __('Certificates for :event go out when it ends. Ask after that if yours is missing.', ['event' => $event->title]),
            ! $event->checkIns()->where('user_id', $person->id)->exists() => __('You weren\'t checked in to :event, so there is no attendance to certify.', ['event' => $event->title]),
            $use->certificates()->where('user_id', $person->id)->exists() => __('You already have this certificate.'),
            $use->certificateRequests()->where('user_id', $person->id)->exists() => __('You already asked for this certificate.'),
            default => null,
        };

        if ($problem !== null) {
            throw ValidationException::withMessages(['certificate' => $problem]);
        }

        $request = $use->certificateRequests()->create(['user_id' => $person->id, 'reason' => $reason]);
        $request->setRelation('eventCertificate', $use)->setRelation('user', $person);
        $entry = $this->activity->record(ActivityAction::Requested, ActivityModule::Certificates, $request, actor: $person);
        $this->notifier->certificateRequested($request, $entry);

        return $request;
    }

    /** @throws ValidationException */
    public function approve(User $staff, CertificateRequest $request): void
    {
        $this->ensurePending($request);

        DB::transaction(function () use ($staff, $request): void {
            $this->certificates->issueTo($request->eventCertificate, $request->user);
            $request->update([
                'status' => CertificateRequestStatus::Approved,
                'decided_by' => $staff->id,
                'decided_at' => now(),
            ]);
        });

        $entry = $this->activity->record(ActivityAction::Approved, ActivityModule::Certificates, $request, actor: $staff);
        $this->notifier->certificateReleased($entry, User::query()->whereKey($request->user_id));
    }

    /** @throws ValidationException */
    public function decline(User $staff, CertificateRequest $request, ?string $note): void
    {
        $this->ensurePending($request);

        $request->update([
            'status' => CertificateRequestStatus::Declined,
            'decided_by' => $staff->id,
            'decided_at' => now(),
            'note' => $note,
        ]);

        $entry = $this->activity->record(ActivityAction::Declined, ActivityModule::Certificates, $request,
            properties: $note !== null ? ['note' => $note] : [], actor: $staff);
        $this->notifier->certificateRequestDeclined($request, $entry);
    }

    /** @throws ValidationException */
    private function ensurePending(CertificateRequest $request): void
    {
        if (! $request->isPending()) {
            throw ValidationException::withMessages([
                'request' => __('This request was already answered.'),
            ]);
        }
    }
}
