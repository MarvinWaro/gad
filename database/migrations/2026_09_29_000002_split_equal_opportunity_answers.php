<?php

use App\Support\MonitoringTemplate;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('monitoring_reports')->whereIn('status', ['draft', 'returned'])
            ->orderBy('id')->chunkById(100, function ($reports): void {
                foreach ($reports as $report) {
                    DB::transaction(function () use ($report): void {
                        $revision = DB::table('monitoring_revisions')
                            ->where('monitoring_report_id', $report->id)
                            ->orderByDesc('number')->first();
                        if (! $revision || $revision->submitted_at || ! in_array($revision->template_version, [MonitoringTemplate::LEGACY_VERSION, MonitoringTemplate::PREVIOUS_VERSION], true)) {
                            return;
                        }

                        // Keep every earlier answer. The combined item 4 answer is
                        // displayed as a read-only note beside the new a/b fields.
                        DB::table('monitoring_revisions')->where('id', $revision->id)
                            ->update(['template_version' => MonitoringTemplate::VERSION]);
                        DB::table('monitoring_reports')->where('id', $report->id)
                            ->update(['lock_version' => DB::raw('lock_version + 1'), 'updated_at' => now()]);

                        // A signature on the earlier layout cannot cover the new form.
                        $attachment = DB::table('monitoring_attachments')
                            ->where('monitoring_revision_id', $revision->id)->first();
                        if ($attachment) {
                            DB::table('monitoring_attachments')->where('id', $attachment->id)->delete();
                            DB::afterCommit(function () use ($attachment): void {
                                try {
                                    Storage::disk('monitoring')->delete($attachment->path);
                                } catch (Throwable $exception) {
                                    report($exception);
                                }
                            });
                        }
                    });
                }
            }, 'id');
    }

    public function down(): void
    {
        // Historical template versions and answers must not be rewritten.
    }
};
