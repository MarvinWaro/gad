<?php

namespace App\Models;

use App\Models\Concerns\BelongsToRegion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * An HEI's GAD monitoring report for one academic year and semester. Each
 * correction CHED asks for adds a revision; earlier ones stay on record.
 *
 * @property string $id
 * @property int $survey_hei_id
 * @property int $survey_cluster_id
 * @property int $survey_region_id
 * @property string $institution_name
 * @property string $academic_year
 * @property int $semester
 * @property string $status
 * @property int $lock_version
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class MonitoringReport extends Model
{
    use BelongsToRegion, HasUlids;

    /** Stable status codes, sent to the browser and the API as they are. */
    public const STATUSES = ['draft', 'returned', 'submitted', 'reviewed'];

    protected $guarded = [];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'semester' => 'integer',
            'lock_version' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** @return HasMany<MonitoringRevision, $this> */
    public function revisions(): HasMany
    {
        return $this->hasMany(MonitoringRevision::class)->orderByDesc('number');
    }

    /**
     * The revision being worked on or, once submitted, the latest on record.
     *
     * @return HasOne<MonitoringRevision, $this>
     */
    public function currentRevision(): HasOne
    {
        return $this->hasOne(MonitoringRevision::class)->latestOfMany('number');
    }

    /** @return BelongsTo<SurveyHei, $this> */
    public function hei(): BelongsTo
    {
        return $this->belongsTo(SurveyHei::class, 'survey_hei_id');
    }

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** @return BelongsTo<SurveyCluster, $this> */
    public function cluster(): BelongsTo
    {
        return $this->belongsTo(SurveyCluster::class, 'survey_cluster_id');
    }

    /** Whether the HEI can still change the report: a draft, or returned for correction. */
    public function isOpen(): bool
    {
        return in_array($this->status, ['draft', 'returned'], true);
    }
}
