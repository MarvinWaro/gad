<?php

namespace App\Models;

use App\Support\MonitoringDocument;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * One version of a monitoring report's answers: edited, then finalized and
 * printed for signing, then submitted with the signed copy.
 *
 * @property string $id
 * @property string $monitoring_report_id
 * @property int $number
 * @property string $template_version
 * @property string|null $address
 * @property CarbonImmutable|null $accomplished_on
 * @property string|null $president_name
 * @property string|null $focal_person_name
 * @property CarbonImmutable|null $finalized_at
 * @property int|null $finalized_by
 * @property string|null $content_hash
 * @property-read string|null $document_code
 * @property CarbonImmutable|null $submitted_at
 * @property int|null $submitted_by
 */
class MonitoringRevision extends Model
{
    use HasUlids;

    /** The form's fields besides the answers, stored as columns. */
    public const DETAIL_FIELDS = ['address', 'accomplished_on', 'president_name', 'focal_person_name'];

    protected $guarded = [];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'accomplished_on' => 'immutable_date',
            'finalized_at' => 'immutable_datetime',
            'submitted_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<MonitoringReport, $this> */
    public function report(): BelongsTo
    {
        return $this->belongsTo(MonitoringReport::class, 'monitoring_report_id');
    }

    /** @return HasMany<MonitoringAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(MonitoringAnswer::class);
    }

    /** @return HasOne<MonitoringAttachment, $this> */
    public function attachment(): HasOne
    {
        return $this->hasOne(MonitoringAttachment::class);
    }

    /** @return HasMany<MonitoringReview, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(MonitoringReview::class)->orderBy('created_at');
    }

    /** @return BelongsTo<User, $this> */
    public function finalizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    /** @return BelongsTo<User, $this> */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /** Answers can still change: not yet finalized for signing. */
    public function isEditable(): bool
    {
        return $this->finalized_at === null && $this->submitted_at === null;
    }

    /** Finalized and printed for signing, but the signed copy is not in yet. */
    public function isAwaitingSignature(): bool
    {
        return $this->finalized_at !== null && $this->submitted_at === null;
    }

    /**
     * The details as the HEI typed them, blank rather than null.
     *
     * @return array{address: string, accomplished_on: string, president_name: string, focal_person_name: string}
     */
    public function details(): array
    {
        return [
            'address' => (string) $this->address,
            'accomplished_on' => $this->accomplished_on?->format('Y-m-d') ?? '',
            'president_name' => (string) $this->president_name,
            'focal_person_name' => (string) $this->focal_person_name,
        ];
    }

    /** @return Attribute<string|null, never> */
    protected function documentCode(): Attribute
    {
        return Attribute::get(fn (): ?string => $this->content_hash === null
            ? null
            : MonitoringDocument::code($this->content_hash));
    }
}
