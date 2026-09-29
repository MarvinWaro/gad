<?php

namespace App\Actions\Monitoring;

use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;
use App\Models\User;
use App\Support\MonitoringTemplate;
use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

class ManageMonitoringReport
{
    /** @param array<string, mixed> $data */
    public function create(User $user, array $data): MonitoringReport
    {
        Gate::forUser($user)->authorize('create', MonitoringReport::class);

        return DB::transaction(function () use ($user, $data) {
            // Serialize report creation for collaborators from the same HEI.
            $hei = $user->hei()->lockForUpdate()->firstOrFail();
            $report = MonitoringReport::query()->firstOrCreate([
                'survey_hei_id' => $hei->id,
                'academic_year' => $data['academic_year'],
                'semester' => $data['semester'],
            ], [
                'survey_cluster_id' => $hei->survey_cluster_id,
                'survey_region_id' => $hei->cluster->survey_region_id,
                'institution_name' => $hei->name,
                'status' => 'draft',
            ]);
            if ($report->wasRecentlyCreated) {
                $report->revisions()->create([
                    'number' => 1, 'template_version' => MonitoringTemplate::VERSION,
                    'institution_snapshot' => [
                        'name' => $hei->name, 'hei_id' => $hei->id,
                        'cluster' => $hei->cluster->name, 'cluster_id' => $hei->cluster->id,
                        'region' => $hei->cluster->region->name, 'region_id' => $hei->cluster->region->id,
                    ],
                ]);
            }

            return $report;
        });
    }

    /** @param array<string, mixed> $data */
    public function save(User $user, MonitoringReport $report, array $data): void
    {
        $this->mutate($user, $report, $data['lock_version'], 'update', function ($locked, $revision) use ($data) {
            $revision->fill(collect($data)->only(['address', 'accomplished_on', 'president_name', 'focal_person_name'])->all());
            $answers = collect(MonitoringTemplate::keys($revision->template_version))->mapWithKeys(fn ($key) => [$key => trim($data['answers'][$key] ?? '')])->all();
            $before = $revision->answers()->whereIn('requirement_key', array_keys($answers))
                ->pluck('answer', 'requirement_key')->all();
            $changed = $revision->isDirty() || $answers != $before;
            $revision->save();
            foreach ($answers as $key => $value) {
                $revision->answers()->updateOrCreate(['requirement_key' => $key], ['answer' => $value]);
            }
            if ($changed) {
                $this->removeDraftAttachment($revision);
            }
        });
    }

    public function upload(User $user, MonitoringReport $report, int $version, UploadedFile $file): void
    {
        $newPath = null;
        try {
            $this->mutate($user, $report, $version, 'update', function ($locked, $revision) use ($user, $file, &$newPath) {
                $newPath = $file->store('monitoring/'.$locked->id, 'monitoring');
                $this->removeDraftAttachment($revision);
                $revision->attachment()->create([
                    'path' => $newPath,
                    'original_name' => mb_substr(basename($file->getClientOriginalName()), 0, 255),
                    'size' => $file->getSize(),
                    'uploaded_by' => $user->id,
                ]);
            });
        } catch (Throwable $exception) {
            if ($newPath) {
                Storage::disk('monitoring')->delete($newPath);
            }
            throw $exception;
        }
    }

    public function submit(User $user, MonitoringReport $report, int $version): void
    {
        $this->mutate($user, $report, $version, 'update', function ($locked, $revision) use ($user) {
            if (! $revision->attachment()->exists()) {
                throw ValidationException::withMessages(['file' => 'Attach the signed PDF before submitting.']);
            }
            $revision->update([
                'submitted_at' => now(), 'submitted_by' => $user->id,
            ]);
            // The identity printed for signing stays fixed with the report,
            // even if the directory changes before the PDF is submitted.
            $locked->update(['status' => 'submitted']);
        });
    }

    /** @param array<string, mixed> $data */
    public function review(User $user, MonitoringReport $report, array $data): void
    {
        $this->mutate($user, $report, $data['lock_version'], 'review', function ($locked, $revision) use ($user, $data) {
            $revision->reviews()->create([
                'reviewer_id' => $user->id, 'reviewer_name' => $user->name,
                'decision' => $data['decision'], 'comment' => $data['comment'] ?? null,
            ]);
            if ($data['decision'] === 'returned') {
                $next = $revision->replicate(['submitted_at', 'submitted_by']);
                $next->number = $revision->number + 1;
                $next->template_version = MonitoringTemplate::VERSION;
                $next->save();
                foreach ($revision->answers()->get() as $answer) {
                    $next->answers()->create(['requirement_key' => $answer->requirement_key, 'answer' => $answer->answer]);
                }
            }
            $locked->update(['status' => $data['decision']]);
        });
    }

    private function mutate(User $user, MonitoringReport $report, int $version, string $ability, Closure $operation): void
    {
        DB::transaction(function () use ($user, $report, $version, $ability, $operation) {
            // Conditional write also protects SQLite, where row locks are unavailable.
            $claimed = MonitoringReport::query()->whereKey($report->id)->where('lock_version', $version)
                ->update(['lock_version' => $version + 1, 'updated_at' => now()]);
            if (! $claimed) {
                throw ValidationException::withMessages(['lock_version' => 'This report changed in another session. Reload the page before continuing. Your unsaved changes have not been applied.']);
            }
            $locked = $report->fresh();
            Gate::forUser($user)->authorize($ability, $locked);
            $operation($locked, $locked->currentRevision());
        });
    }

    private function removeDraftAttachment(MonitoringRevision $revision): void
    {
        $attachment = $revision->attachment()->first();
        if ($attachment) {
            $path = $attachment->path;
            $attachment->delete();
            DB::afterCommit(function () use ($path): void {
                try {
                    Storage::disk('monitoring')->delete($path);
                } catch (Throwable $exception) {
                    // A cleanup failure must not make a committed replacement
                    // look unsuccessful or delete the new signed document.
                    report($exception);
                }
            });
        }
    }
}
