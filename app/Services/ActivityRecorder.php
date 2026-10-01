<?php

namespace App\Services;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\ActivityLog;
use App\Models\SurveyCluster;
use App\Models\SurveyHei;
use App\Models\SurveyRegion;
use App\Models\User;
use App\Support\ActivityPlace;
use App\Support\ActivitySubjects;
use App\Support\InstitutionName;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Throwable;

/**
 * Writes the activity log: who did what to which record, where and from
 * which device. The only writer of `activity_logs`, so every module records
 * the same way. Called after the change it records has been made.
 */
class ActivityRecorder
{
    /** Never written to the log, whatever the model shows. */
    private const SKIPPED = ['created_at', 'updated_at', 'lock_version', 'remember_token'];

    /** Place columns, stored by name so the entry reads on its own. */
    private const PLACE_COLUMNS = [
        'survey_region_id' => SurveyRegion::class,
        'survey_cluster_id' => SurveyCluster::class,
        'survey_hei_id' => SurveyHei::class,
    ];

    /** Longest text kept for one value of a change. */
    private const VALUE_LIMIT = 500;

    /**
     * @param  Model|null  $subject  What was acted on; its place, name and page come from ActivitySubjects.
     * @param  array<string, array{0: mixed, 1: mixed}>  $changes  Field => [before, after]; see changesOf().
     * @param  array<string, mixed>  $properties  Anything else worth keeping, as codes and numbers.
     * @param  User|null  $actor  Who acted; the signed-in user when left out.
     * @param  string|null  $label  Names the subject instead of its own name, or names what was acted on when there is no record.
     * @param  ActivityPlace|null  $place  Where it happened, when neither the subject nor the actor says.
     * @param  string|null  $actorName  Who acted when no account is known, such as the email of a failed login.
     */
    public function record(
        ActivityAction $action,
        ActivityModule $module,
        ?Model $subject = null,
        array $changes = [],
        array $properties = [],
        ?User $actor = null,
        ?string $label = null,
        ?ActivityPlace $place = null,
        ?string $actorName = null,
    ): ?ActivityLog {
        try {
            $actor ??= Auth::user();
            $place ??= $this->placeOf($subject) ?? $this->placeOf($actor) ?? new ActivityPlace;
            // A console command has no browser or address to record.
            $request = request()->route() !== null ? request() : null;

            return ActivityLog::query()->create([
                'user_id' => $actor?->getKey(),
                'actor_name' => Str::limit($actor->name ?? $actorName ?? 'System', 250, ''),
                'survey_region_id' => $place->region,
                'survey_cluster_id' => $place->cluster,
                'survey_hei_id' => $place->hei,
                'module' => $module,
                'action' => $action,
                'subject_type' => $subject !== null ? array_search($subject::class, ActivitySubjects::TYPES, true) ?: null : null,
                'subject_id' => $subject?->getKey(),
                'subject_label' => Str::limit($label ?? ($subject !== null ? ActivitySubjects::label($subject) : ''), 250, '…') ?: null,
                'changes' => $changes === [] ? null : $changes,
                'properties' => $properties === [] ? null : $properties,
                'ip_address' => $request?->ip(),
                'user_agent' => Str::limit((string) $request?->userAgent(), 512, '') ?: null,
            ]);
        } catch (Throwable $exception) {
            // The change itself went through; a missing log entry must not undo it.
            report($exception);

            return null;
        }
    }

    /**
     * A record's create or edit, as its last save made it. Switching it on or
     * off is logged as activating or deactivating when that is all that
     * changed; an edit that changed nothing is not logged.
     *
     * @param  list<string>  $except  Attributes left out of the changes, such as file paths.
     * @param  array<string, array{0: mixed, 1: mixed}>  $extra  Changes the model's attributes do not show.
     */
    public function recordSave(ActivityModule $module, Model $model, array $except = [], array $extra = []): ?ActivityLog
    {
        if ($model->wasRecentlyCreated) {
            return $this->record(ActivityAction::Created, $module, $model);
        }

        $changes = [...$this->changesOf($model, $except), ...$extra];

        if ($changes === []) {
            return null;
        }

        $action = match (true) {
            array_keys($changes) !== ['is_active'] => ActivityAction::Updated,
            (bool) $changes['is_active'][1] => ActivityAction::Activated,
            default => ActivityAction::Deactivated,
        };

        return $this->record($action, $module, $model, $changes);
    }

    /**
     * What the model's last save changed, as field => [before, after]. Hidden
     * attributes (passwords, tokens, file paths) and timestamps are left out;
     * places are named and times are ISO 8601 in UTC.
     *
     * Call it right after that save. A save that changed nothing leaves the
     * changes of the one before it in place, so a model saved twice in one
     * request would report its first changes again.
     *
     * @param  list<string>  $except
     * @return array<string, array{0: mixed, 1: mixed}>
     */
    public function changesOf(Model $model, array $except = []): array
    {
        $after = Arr::except($model->getChanges(), [...self::SKIPPED, ...$model->getHidden(), ...$except]);
        $before = $model->getPrevious();
        $changes = [];

        foreach ($after as $key => $value) {
            $changes[$key] = [
                $this->readable($model, $key, $before[$key] ?? null),
                $this->readable($model, $key, $value),
            ];
        }

        return $changes;
    }

    /**
     * A list that changed, such as an account's roles, as one change; null
     * when it is the same either way.
     *
     * @param  array<int, mixed>  $before  Names, as a query plucks them.
     * @param  array<int, mixed>  $after
     * @return array{0: string|null, 1: string|null}|null
     */
    public function listChange(array $before, array $after): ?array
    {
        $names = fn (array $list): array => collect($list)
            ->map(fn (mixed $name): string => is_scalar($name) ? (string) $name : '')
            ->sort()
            ->values()
            ->all();
        $before = $names($before);
        $after = $names($after);

        return $before === $after ? null : [
            $before === [] ? null : implode(', ', $before),
            $after === [] ? null : implode(', ', $after),
        ];
    }

    private function placeOf(?Model $model): ?ActivityPlace
    {
        $place = $model !== null ? ActivitySubjects::place($model) : null;

        return $place === null || $place->isEmpty() ? null : $place;
    }

    private function readable(Model $model, string $key, mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (isset(self::PLACE_COLUMNS[$key])) {
            $name = self::PLACE_COLUMNS[$key]::query()->whereKey($value)->value('name');

            return $name === null ? $value : ($key === 'survey_hei_id' ? InstitutionName::display($name) : $name);
        }

        if ($model->hasCast($key, ['bool', 'boolean'])) {
            return (bool) $value;
        }

        if ($model->hasCast($key, ['date', 'datetime', 'custom_datetime', 'immutable_date', 'immutable_datetime', 'immutable_custom_datetime'])) {
            return CarbonImmutable::parse($value, 'UTC')->toIso8601ZuluString();
        }

        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        }

        return is_string($value) ? Str::limit($value, self::VALUE_LIMIT) : $value;
    }
}
