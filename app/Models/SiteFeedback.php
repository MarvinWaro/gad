<?php

namespace App\Models;

use App\Enums\FeedbackType;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A visitor's answer to the public website feedback form. The scores are
 * the columns App\Support\FeedbackQuestions lists; everything but the type
 * and the feedback is optional.
 *
 * @property string $id
 * @property FeedbackType $type
 * @property string $feedback
 * @property string|null $suggestions
 * @property int|null $reading_ease
 * @property int|null $information_clarity
 * @property int|null $terms_consistent
 * @property int|null $messages_consistent
 * @property int|null $prompts_clear
 * @property int|null $progress_informed
 * @property int|null $aesthetically_pleasing
 * @property int|null $navigation_ease
 * @property int|null $exploring_ease
 * @property int|null $user_friendliness
 * @property string|null $email
 * @property string|null $name
 * @property int|null $survey_region_id
 * @property int|null $survey_cluster_id
 * @property int|null $survey_hei_id
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read SurveyRegion|null $region
 * @property-read SurveyCluster|null $cluster
 * @property-read SurveyHei|null $hei
 */
class SiteFeedback extends Model
{
    use HasUlids;

    protected $table = 'site_feedback';

    protected $guarded = [];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => FeedbackType::class,
            'reading_ease' => 'integer',
            'information_clarity' => 'integer',
            'terms_consistent' => 'integer',
            'messages_consistent' => 'integer',
            'prompts_clear' => 'integer',
            'progress_informed' => 'integer',
            'aesthetically_pleasing' => 'integer',
            'navigation_ease' => 'integer',
            'exploring_ease' => 'integer',
            'user_friendliness' => 'integer',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
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
     * Feedback the staff account may read. Feedback that names a region
     * belongs to that region's office and the Central Office; feedback that
     * names none is about the system as a whole, so every office sees it.
     *
     * @param  Builder<SiteFeedback>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        if ($user->national_access) {
            return;
        }

        $query->where(fn (Builder $query) => $query
            ->whereNull($this->qualifyColumn('survey_region_id'))
            ->when($user->survey_region_id !== null, fn (Builder $query) => $query
                ->orWhere($this->qualifyColumn('survey_region_id'), $user->survey_region_id)));
    }
}
