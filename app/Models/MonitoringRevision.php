<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property CarbonImmutable|null $accomplished_on
 * @property CarbonImmutable|null $submitted_at
 * @property array<string, mixed>|null $institution_snapshot
 */
class MonitoringRevision extends Model
{
    use HasUlids;

    protected $guarded = [];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['institution_snapshot' => 'array', 'submitted_at' => 'immutable_datetime', 'accomplished_on' => 'immutable_date', 'number' => 'integer'];
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
}
