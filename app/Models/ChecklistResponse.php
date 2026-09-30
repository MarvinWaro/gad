<?php

namespace App\Models;

use App\Enums\ChecklistType;
use App\Models\Concerns\BelongsToRegion;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * An HEI's answer to a GAD checklist for one academic year. Submitting again
 * replaces the checked items.
 *
 * @property string $id
 * @property ChecklistType $type
 * @property int $survey_hei_id
 * @property int $survey_cluster_id
 * @property int $survey_region_id
 * @property string $academic_year
 * @property int|null $submitted_by
 * @property CarbonImmutable $submitted_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
class ChecklistResponse extends Model
{
    use BelongsToRegion, HasUlids;

    protected $guarded = [];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => ChecklistType::class,
            'submitted_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /**
     * The checked items, in the checklist's order, which is how they are stored.
     *
     * @return HasMany<ChecklistAnswer, $this>
     */
    public function answers(): HasMany
    {
        return $this->hasMany(ChecklistAnswer::class)->orderBy('id');
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

    /** @return BelongsTo<User, $this> */
    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
