<?php

namespace App\Actions\Monitoring;

use App\Enums\ActivityAction;
use App\Enums\ActivityModule;
use App\Models\MonitoringAnswer;
use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Models\User;
use App\Services\ActivityRecorder;
use App\Services\Notifier;
use App\Support\MonitoringDocument;
use App\Support\MonitoringTemplate;
use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use LogicException;
use RuntimeException;
use Throwable;

/**
 * The monitoring report's workflow. An HEI fills in a draft, finalizes it for
 * signing, and submits the signed copy; CHED marks it reviewed or returns it
 * for correction, which opens the next revision.
 *
 * Every change holds the report while it runs, so colleagues working on the
 * same report never overwrite each other unseen.
 */
class ManageMonitoringReport
{
    public function __construct(
        private readonly ActivityRecorder $activity,
        private readonly Notifier $notifier,
    ) {}

    /**
     * Open the HEI's report for a period, starting it if no colleague has.
     *
     * @param  array{academic_year: string, semester: int}  $period
     */
    public function open(User $user, array $period): MonitoringReport
    {
        Gate::forUser($user)->authorize('create', MonitoringReport::class);

        return DB::transaction(function () use ($user, $period): MonitoringReport {
            // Serialize report creation for colleagues at the same HEI.
            $hei = $user->hei()->with('cluster')->lockForUpdate()->firstOrFail();
            $report = MonitoringReport::query()->firstOrCreate([
                'survey_hei_id' => $hei->id,
                'academic_year' => $period['academic_year'],
                'semester' => $period['semester'],
            ], [
                'survey_cluster_id' => $hei->survey_cluster_id,
                'survey_region_id' => $hei->cluster->survey_region_id,
                'institution_name' => $hei->name,
                'status' => 'draft',
            ]);

            if ($report->wasRecentlyCreated) {
                $this->startRevision($report, 1);
                $this->activity->record(ActivityAction::Created, ActivityModule::Monitoring, $report, actor: $user);
            }

            return $report;
        });
    }

    /**
     * Save the fields someone changed. A field is written only if it still
     * holds the value they started from; otherwise it comes back as a
     * conflict with its current value, and nothing they typed is lost.
     *
     * @param  array{details?: array<string, array{base: string|null, value: string|null}>, answers?: array<string, array{base: string|null, value: string|null}>}  $changes
     * @return array{lock_version: int, saved_at: string, conflicts: array{details: array<string, string>, answers: array<string, string>}}
     */
    public function saveDraft(User $user, MonitoringReport $report, array $changes): array
    {
        return $this->locked($user, $report, null, 'edit', function (MonitoringReport $report, MonitoringRevision $revision) use ($user, $changes): array {
            $this->ensureEditable($report, $revision);
            $conflicts = ['details' => [], 'answers' => []];
            $saved = ['details' => [], 'answers' => []];
            $details = $revision->details();

            foreach ($changes['details'] ?? [] as $field => $change) {
                if ($details[$field] !== self::text($change['base'])) {
                    $conflicts['details'][$field] = $details[$field];

                    continue;
                }

                $revision->{$field} = self::text($change['value']) === '' ? null : self::text($change['value']);
                $saved['details'][] = $field;
            }

            $revision->save();

            $answers = $revision->answers()
                ->whereIn('requirement_key', array_keys($changes['answers'] ?? []))
                ->get()
                ->keyBy('requirement_key');

            foreach ($changes['answers'] ?? [] as $key => $change) {
                $answer = $answers->get($key);
                $current = (string) $answer?->answer;

                if ($current !== self::text($change['base'])) {
                    $conflicts['answers'][$key] = $current;

                    continue;
                }

                $revision->answers()->updateOrCreate(['requirement_key' => $key], ['answer' => self::text($change['value'])]);
                $saved['answers'][] = $key;
            }

            // Which fields were saved, never what was typed in them.
            if ($saved['details'] !== [] || $saved['answers'] !== []) {
                $this->activity->record(ActivityAction::DraftSaved, ActivityModule::Monitoring, $report, actor: $user, properties: [
                    'revision' => $revision->number,
                    'details' => $saved['details'],
                    'requirements' => $saved['answers'],
                    'conflicts' => count($conflicts['details']) + count($conflicts['answers']),
                ]);
            }

            return [
                'lock_version' => $report->lock_version,
                'saved_at' => $report->updated_at?->toIso8601String() ?? now()->toIso8601String(),
                'conflicts' => $conflicts,
            ];
        });
    }

    /** Lock the answers for signing, and fingerprint them for the document code. */
    public function finalize(User $user, MonitoringReport $report, int $version): void
    {
        $this->locked($user, $report, $version, 'edit', function (MonitoringReport $report, MonitoringRevision $revision) use ($user): void {
            $this->ensureEditable($report, $revision);
            $revision->load('answers');
            $revision->forceFill([
                'finalized_at' => now(),
                'finalized_by' => $user->id,
                'content_hash' => MonitoringDocument::contentHash($report, $revision),
            ])->save();
            $this->activity->record(ActivityAction::Finalized, ActivityModule::Monitoring, $report, actor: $user, properties: [
                'revision' => $revision->number,
            ]);
        });
    }

    /** Unlock the answers again. Copies already printed no longer match. */
    public function reopen(User $user, MonitoringReport $report, int $version): void
    {
        $this->locked($user, $report, $version, 'edit', function (MonitoringReport $report, MonitoringRevision $revision) use ($user): void {
            $this->ensureAwaitingSignature($report, $revision);
            $revision->forceFill(['finalized_at' => null, 'finalized_by' => null, 'content_hash' => null])->save();
            $this->activity->record(ActivityAction::Reopened, ActivityModule::Monitoring, $report, actor: $user, properties: [
                'revision' => $revision->number,
            ]);
        });
    }

    /** File the signed copy and send the finalized revision to CHED. */
    public function submit(User $user, MonitoringReport $report, int $version, UploadedFile $file): void
    {
        $path = $file->store('monitoring/'.$report->id, 'monitoring');

        if ($path === false) {
            throw new RuntimeException('The signed copy could not be stored.');
        }

        try {
            $this->locked($user, $report, $version, 'edit', function (MonitoringReport $report, MonitoringRevision $revision) use ($user, $file, $path): void {
                $this->ensureAwaitingSignature($report, $revision);
                $revision->attachment()->create([
                    'path' => $path,
                    'original_name' => mb_substr(basename($file->getClientOriginalName()), 0, 255),
                    'size' => $file->getSize(),
                    'uploaded_by' => $user->id,
                ]);
                $revision->forceFill(['submitted_at' => now(), 'submitted_by' => $user->id])->save();
                $report->update(['status' => 'submitted']);
                $entry = $this->activity->record(ActivityAction::Submitted, ActivityModule::Monitoring, $report, actor: $user, properties: [
                    'revision' => $revision->number,
                    'file' => mb_substr(basename($file->getClientOriginalName()), 0, 255),
                ]);
                $this->notifier->reportSubmitted($report, $entry);
            });
        } catch (Throwable $exception) {
            // A refused submission must not leave its upload behind.
            Storage::disk('monitoring')->delete($path);

            throw $exception;
        }
    }

    /**
     * Record CHED's review. Returning the report opens the next revision
     * with the same answers, for the HEI to correct and sign again.
     *
     * @param  array{lock_version: int, decision: string, comment?: string|null}  $data
     */
    public function review(User $user, MonitoringReport $report, array $data): void
    {
        $this->locked($user, $report, (int) $data['lock_version'], 'review', function (MonitoringReport $report, MonitoringRevision $revision) use ($user, $data): void {
            if ($report->status !== 'submitted') {
                throw ValidationException::withMessages(['report' => __('Only a submitted report can be reviewed.')]);
            }

            $revision->reviews()->create([
                'reviewer_id' => $user->id,
                'reviewer_name' => $user->name,
                'decision' => $data['decision'],
                'comment' => $data['comment'] ?? null,
            ]);

            if ($data['decision'] === 'returned') {
                $revision->load('answers');
                $this->startRevision($report, $revision->number + 1, $revision);
            }

            $report->update(['status' => $data['decision']]);
            $entry = $this->activity->record(
                $data['decision'] === 'returned' ? ActivityAction::Returned : ActivityAction::Reviewed,
                ActivityModule::Monitoring,
                $report,
                actor: $user,
                properties: array_filter([
                    'revision' => $revision->number,
                    'comment' => $data['comment'] ?? null,
                ]),
            );
            $this->notifier->reportReviewed($report, $entry);
        });
    }

    /**
     * Run a change while holding the report. Claiming it with an update takes
     * the row lock in MySQL and the write lock in SQLite. A version, when
     * given, must still be the one the person saw.
     *
     * @template TResult
     *
     * @param  Closure(MonitoringReport, MonitoringRevision): TResult  $change
     * @return TResult
     */
    private function locked(User $user, MonitoringReport $report, ?int $version, string $ability, Closure $change): mixed
    {
        return DB::transaction(function () use ($user, $report, $version, $ability, $change): mixed {
            $claimed = MonitoringReport::query()
                ->whereKey($report->getKey())
                ->when($version !== null, fn ($query) => $query->where('lock_version', $version))
                ->update(['lock_version' => DB::raw('lock_version + 1'), 'updated_at' => now()]);

            if ($claimed === 0) {
                throw ValidationException::withMessages([
                    'lock_version' => __('This report changed in another session. Reload it to see the latest before you continue.'),
                ]);
            }

            $current = MonitoringReport::query()->with('currentRevision')->whereKey($report->getKey())->firstOrFail();
            Gate::forUser($user)->authorize($ability, $current);

            return $change($current, $current->currentRevision ?? throw new LogicException('A report always has a revision.'));
        });
    }

    private function ensureEditable(MonitoringReport $report, MonitoringRevision $revision): void
    {
        if (! $report->isOpen() || ! $revision->isEditable()) {
            throw ValidationException::withMessages([
                'report' => __('This report is finalized or submitted, so its answers can no longer change.'),
            ]);
        }
    }

    private function ensureAwaitingSignature(MonitoringReport $report, MonitoringRevision $revision): void
    {
        if (! $report->isOpen() || ! $revision->isAwaitingSignature()) {
            throw ValidationException::withMessages([
                'report' => $revision->submitted_at !== null
                    ? __('This report has already been submitted.')
                    : __('Finalize the report for signing first.'),
            ]);
        }
    }

    /** A revision with one answer row per requirement, blank or carried over. */
    private function startRevision(MonitoringReport $report, int $number, ?MonitoringRevision $from = null): void
    {
        $revision = $report->revisions()->create([
            'number' => $number,
            'template_version' => MonitoringTemplate::VERSION,
            'address' => $from?->address,
            'accomplished_on' => $from?->accomplished_on,
            'president_name' => $from?->president_name,
            'focal_person_name' => $from?->focal_person_name,
        ]);
        $previous = $from?->answers->pluck('answer', 'requirement_key') ?? collect();

        MonitoringAnswer::query()->insert(array_map(fn (string $key): array => [
            'monitoring_revision_id' => $revision->id,
            'requirement_key' => $key,
            'answer' => (string) ($previous[$key] ?? ''),
        ], MonitoringTemplate::keys()));
    }

    /** Text as stored: never null, with the browser's line endings. */
    private static function text(?string $value): string
    {
        return str_replace("\r\n", "\n", (string) $value);
    }
}
