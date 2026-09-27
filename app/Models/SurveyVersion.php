<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $survey_id
 * @property int $version
 * @property string $status
 * @property string $introduction
 * @property string $privacy_notice
 * @property string $consent_text
 * @property int|null $retention_days
 * @property array<string, mixed> $definition
 * @property Carbon|null $published_at
 */
#[Fillable([
    'survey_id', 'version', 'status', 'introduction', 'privacy_notice',
    'consent_text', 'retention_days', 'definition', 'published_at', 'published_by',
])]
class SurveyVersion extends Model
{
    /**
     * How long a response is kept before it is deleted automatically, unless
     * the draft says otherwise: 5 years, to cover several reporting cycles.
     */
    public const DEFAULT_RETENTION_DAYS = 1825;

    protected function casts(): array
    {
        return [
            'definition' => 'array',
            'retention_days' => 'integer',
            'published_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Survey, $this> */
    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    /** @return HasMany<SurveyResponse, $this> */
    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }
}
