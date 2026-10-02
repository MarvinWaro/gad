<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * How many responses a survey received on one day, from one place, respondent
 * group and sex. Statistics read these instead of the responses, so totals
 * survive when responses are deleted at the end of their retention period.
 *
 * A response adds itself when created and takes itself back when deleted one
 * by one, such as by an administrator. The retention prune deletes in bulk,
 * which fires no model events, so its responses stay counted.
 *
 * @property int $id
 * @property string $key
 * @property string $date
 * @property int $survey_id
 * @property int|null $survey_region_id
 * @property int|null $survey_cluster_id
 * @property int|null $survey_hei_id
 * @property string|null $respondent_group
 * @property string|null $sex
 * @property int $responses
 */
class SurveyResponseTally extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['responses' => 'integer'];
    }

    /** @return BelongsTo<Survey, $this> */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public static function add(SurveyResponse $response): void
    {
        $dimensions = self::dimensions($response);

        self::query()->upsert(
            [['key' => self::keyFor($dimensions), ...$dimensions, 'responses' => 1]],
            ['key'],
            ['responses' => DB::raw('responses + 1')],
        );
    }

    public static function remove(SurveyResponse $response): void
    {
        self::query()
            ->where('key', self::keyFor(self::dimensions($response)))
            ->where('responses', '>', 0)
            ->decrement('responses');
    }

    /** @return array{date: string, survey_id: int, survey_region_id: int|null, survey_cluster_id: int|null, survey_hei_id: int|null, respondent_group: string|null, sex: string|null} */
    private static function dimensions(SurveyResponse $response): array
    {
        return [
            'date' => ($response->created_at ?? now())->toImmutable()->setTimezone(GadEvent::TIMEZONE)->toDateString(),
            'survey_id' => (int) SurveyVersion::query()->whereKey($response->survey_version_id)->value('survey_id'),
            'survey_region_id' => $response->survey_region_id,
            'survey_cluster_id' => $response->survey_cluster_id,
            'survey_hei_id' => $response->survey_hei_id,
            'respondent_group' => $response->respondent_group,
            'sex' => $response->sex,
        ];
    }

    /** @param  array<string, string|int|null>  $dimensions */
    private static function keyFor(array $dimensions): string
    {
        return sha1(json_encode(array_values($dimensions), JSON_THROW_ON_ERROR));
    }
}
