<?php

namespace App\Models;

use App\Enums\CertificateRequestStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Someone who missed a day of an event asking for one of its certificates,
 * with why (docs/certificates.md). The event's office approves, which gives
 * the certificate, or declines with a note.
 *
 * @property string $id
 * @property string $gad_event_certificate_id The certificate asked for (its kind, at that event).
 * @property int $user_id
 * @property string $reason
 * @property CertificateRequestStatus $status
 * @property int|null $decided_by
 * @property CarbonImmutable|null $decided_at
 * @property string|null $note The office's note when it declines.
 * @property CarbonImmutable $created_at
 */
#[Fillable(['gad_event_certificate_id', 'user_id', 'reason', 'status', 'decided_by', 'decided_at', 'note'])]
class CertificateRequest extends Model
{
    use HasUlids;

    /**
     * Mirror the column default so unsaved models agree with the database.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'pending',
    ];

    protected function casts(): array
    {
        return [
            'status' => CertificateRequestStatus::class,
            'decided_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<GadEventCertificate, $this> */
    public function eventCertificate(): BelongsTo
    {
        return $this->belongsTo(GadEventCertificate::class, 'gad_event_certificate_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<User, $this> */
    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function isPending(): bool
    {
        return $this->status === CertificateRequestStatus::Pending;
    }
}
