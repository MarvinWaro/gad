<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property int $survey_version_id
 * @property string $public_reference
 * @property int $age
 * @property string $sex
 * @property string $respondent_group
 * @property string|null $respondent_group_other
 * @property string|null $gender_identity
 * @property int|null $survey_region_id Null when the questionnaire made the place optional.
 * @property int|null $survey_cluster_id
 * @property int|null $survey_hei_id
 * @property array<string, mixed> $answers
 * @property Carbon $consent_at
 * @property Carbon|null $guardian_confirmed_at
 * @property Carbon $expires_at
 * @property Carbon|null $created_at
 * @property-read SurveyRegion|null $region Null when the questionnaire made the place optional.
 * @property-read SurveyCluster|null $cluster
 * @property-read SurveyHei|null $hei
 */
#[Fillable([
    'survey_version_id', 'public_reference', 'age', 'sex', 'respondent_group',
    'respondent_group_other', 'gender_identity',
    'survey_region_id', 'survey_cluster_id', 'survey_hei_id',
    'answers', 'consent_at', 'guardian_confirmed_at', 'expires_at',
])]
class SurveyResponse extends Model
{
    use HasUlids;

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'age' => 'integer',
            'consent_at' => 'datetime',
            'guardian_confirmed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SurveyVersion, $this> */
    public function version(): BelongsTo
    {
        return $this->belongsTo(SurveyVersion::class, 'survey_version_id');
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

    /** @return BelongsTo<SurveyHei, $this> */
    public function hei(): BelongsTo
    {
        return $this->belongsTo(SurveyHei::class, 'survey_hei_id');
    }

    /**
     * Answers to the respondent group's follow-up questions.
     *
     * @return HasMany<SurveyGroupAnswer, $this>
     */
    public function groupAnswers(): HasMany
    {
        return $this->hasMany(SurveyGroupAnswer::class);
    }
}
