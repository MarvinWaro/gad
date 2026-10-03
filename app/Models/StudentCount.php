<?php

namespace App\Models;

use App\Enums\StudentCountKind;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * How many women and men a region enrolled, or saw graduate, in one discipline
 * group in one academic year. Imported from the regional office's statistics
 * until CHED's enrollment API exists (docs/enrollment-and-graduates.md).
 *
 * @property int $id
 * @property StudentCountKind $kind
 * @property int $survey_region_id
 * @property string $academic_year_id
 * @property int $discipline_group_id
 * @property int $male
 * @property int $female
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['kind', 'survey_region_id', 'academic_year_id', 'discipline_group_id', 'male', 'female'])]
class StudentCount extends Model
{
    protected function casts(): array
    {
        return [
            'kind' => StudentCountKind::class,
            'male' => 'integer',
            'female' => 'integer',
        ];
    }

    /** @return BelongsTo<SurveyRegion, $this> */
    public function region(): BelongsTo
    {
        return $this->belongsTo(SurveyRegion::class, 'survey_region_id');
    }

    /** @return BelongsTo<AcademicYear, $this> */
    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    /** @return BelongsTo<DisciplineGroup, $this> */
    public function disciplineGroup(): BelongsTo
    {
        return $this->belongsTo(DisciplineGroup::class);
    }
}
