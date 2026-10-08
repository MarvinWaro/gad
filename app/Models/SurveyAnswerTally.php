<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * How many responses gave one answer, on one day, from one place, respondent
 * group and sex. A survey's Summary reads these instead of the responses, so
 * its charts survive when responses are deleted at the end of their
 * retention period, as SurveyResponseTally does for the totals.
 *
 * Questions are stable codes:
 *
 * - `experiences`: each experience chosen, or `none`
 * - `perpetrators`: an experience (`answer`) and who was responsible (`detail`)
 * - `selections.{question}`: each choice of a check-all-that-apply question
 * - `answering_for`: RA 9262's "answering for yourself or a minor"
 * - `age_band`: the age, in bands (AGE_BANDS)
 * - `gender_identity`: asked after a Female or Male answer for sex
 * - `sexual_orientation`: optional, and never asked about a minor
 *
 * A response adds itself when created and takes itself back when deleted one
 * by one. The retention prune deletes in bulk, which fires no model events,
 * so its responses stay counted.
 *
 * @property int $id
 * @property string $key
 * @property string $date
 * @property int $survey_id
 * @property int|null $survey_region_id
 * @property int|null $survey_hei_id
 * @property string|null $respondent_group
 * @property string|null $sex
 * @property string $question
 * @property string $answer
 * @property string|null $detail
 * @property int $responses
 */
class SurveyAnswerTally extends Model
{
    /** Age bands, by their youngest age. */
    public const AGE_BANDS = ['under-18' => 0, '18-24' => 18, '25-34' => 25, '35-44' => 35, '45-59' => 45, '60-plus' => 60];

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
        $rows = self::rowsFor($response);

        if ($rows !== []) {
            self::query()->upsert($rows, ['key'], ['responses' => DB::raw('responses + 1')]);
        }
    }

    public static function remove(SurveyResponse $response): void
    {
        $keys = array_column(self::rowsFor($response), 'key');

        if ($keys !== []) {
            self::query()->whereIn('key', $keys)->where('responses', '>', 0)->decrement('responses');
        }
    }

    /** The band an age falls in, or `not-given`. */
    public static function ageBand(?int $age): string
    {
        if ($age === null) {
            return 'not-given';
        }

        $band = 'under-18';
        foreach (self::AGE_BANDS as $name => $from) {
            if ($age >= $from) {
                $band = $name;
            }
        }

        return $band;
    }

    /**
     * One row for each answer the response gave, each counting one.
     *
     * @return list<array<string, mixed>>
     */
    private static function rowsFor(SurveyResponse $response): array
    {
        $dimensions = [
            'date' => ($response->created_at ?? now())->toImmutable()->setTimezone(GadEvent::TIMEZONE)->toDateString(),
            'survey_id' => (int) SurveyVersion::query()->whereKey($response->survey_version_id)->value('survey_id'),
            'survey_region_id' => $response->survey_region_id,
            'survey_hei_id' => $response->survey_hei_id,
            'respondent_group' => $response->respondent_group,
            'sex' => $response->sex,
        ];
        $rows = [];

        foreach (self::answersOf($response) as [$question, $answer, $detail]) {
            $row = [...$dimensions, 'question' => $question, 'answer' => mb_substr($answer, 0, 80), 'detail' => $detail !== null ? mb_substr($detail, 0, 80) : null];
            $key = self::keyFor($row);
            // One answer counts once, so one statement never touches a row twice.
            $rows[$key] = ['key' => $key, ...$row, 'responses' => 1];
        }

        return array_values($rows);
    }

    /**
     * A row's key: a hash of its dimensions, question, answer and detail.
     *
     * @param  array<string, mixed>  $row
     */
    public static function keyFor(array $row): string
    {
        return sha1(json_encode(array_values($row), JSON_THROW_ON_ERROR));
    }

    /**
     * Each answer as [question, answer, detail].
     *
     * @return list<array{0: string, 1: string, 2: string|null}>
     */
    private static function answersOf(SurveyResponse $response): array
    {
        $answers = $response->answers;
        $found = [['age_band', self::ageBand($response->age), null]];

        if (is_string($response->gender_identity) && $response->gender_identity !== '') {
            $found[] = ['gender_identity', $response->gender_identity, null];
        }

        if (is_string($response->sexual_orientation) && $response->sexual_orientation !== '') {
            $found[] = ['sexual_orientation', $response->sexual_orientation, null];
        }

        foreach (self::strings($answers['experiences'] ?? []) as $experience) {
            $found[] = ['experiences', $experience, null];
        }

        foreach (is_array($answers['perpetrators'] ?? null) ? $answers['perpetrators'] : [] as $experience => $perpetrators) {
            foreach (self::strings($perpetrators) as $perpetrator) {
                $found[] = ['perpetrators', (string) $experience, $perpetrator];
            }
        }

        foreach (is_array($answers['selections'] ?? null) ? $answers['selections'] : [] as $question => $choices) {
            foreach (self::strings($choices) as $choice) {
                $found[] = ['selections.'.$question, $choice, null];
            }
        }

        if (is_string($answers['answering_for'] ?? null)) {
            $found[] = ['answering_for', $answers['answering_for'], null];
        }

        return $found;
    }

    /** @return list<string> */
    private static function strings(mixed $values): array
    {
        return is_array($values) ? array_values(array_unique(array_filter($values, is_string(...)))) : [];
    }
}
