<?php

namespace App\Models;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\Concerns\BelongsToRegion;
use App\Support\PlaceFilters;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * One thing someone did in PHLGADIS. Written only by ActivityRecorder and
 * never edited afterwards.
 *
 * @property string $id
 * @property int|null $user_id
 * @property string $actor_name
 * @property int|null $survey_region_id
 * @property int|null $survey_cluster_id
 * @property int|null $survey_hei_id
 * @property ActivityModule $module
 * @property ActivityAction $action
 * @property string|null $subject_type
 * @property string|null $subject_id
 * @property string|null $subject_label
 * @property array<string, array{0: mixed, 1: mixed}>|null $changes
 * @property array<string, mixed>|null $properties
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property CarbonImmutable $created_at
 */
class ActivityLog extends Model
{
    use BelongsToRegion, HasUlids;

    public const UPDATED_AT = null;

    protected $guarded = [];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'module' => ActivityModule::class,
            'action' => ActivityAction::class,
            'changes' => 'array',
            'properties' => 'array',
            'created_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return MorphTo<Model, $this> */
    public function subject(): MorphTo
    {
        return $this->morphTo();
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
     * The list's filters: search, module, action, actor, Philippine-time
     * dates (`from`, `to`, both whole days) and place.
     *
     * @param  Builder<ActivityLog>  $query
     * @param  array<string, mixed>  $filters
     */
    public function scopeFilter(Builder $query, array $filters): void
    {
        $search = trim((string) ($filters['search'] ?? ''));

        $query
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $query) => $query
                ->where('actor_name', 'like', "%{$search}%")
                ->orWhere('subject_label', 'like', "%{$search}%")
                ->orWhere('ip_address', 'like', "{$search}%")))
            ->when($filters['module'] ?? null, fn (Builder $query, string $module) => $query->where('module', $module))
            ->when($filters['action'] ?? null, fn (Builder $query, string $action) => $query->where('action', $action))
            ->when($filters['user'] ?? null, fn (Builder $query, int|string $user) => $query->where('user_id', $user))
            ->when($filters['from'] ?? null, fn (Builder $query, string $from) => $query->where(
                'created_at', '>=', CarbonImmutable::parse($from, 'Asia/Manila')->startOfDay()->utc(),
            ))
            ->when($filters['to'] ?? null, fn (Builder $query, string $to) => $query->where(
                'created_at', '<', CarbonImmutable::parse($to, 'Asia/Manila')->addDay()->startOfDay()->utc(),
            ));

        PlaceFilters::apply($query, $filters);
    }
}
