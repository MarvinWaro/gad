<?php

namespace App\Support;

use App\Models\MonitoringReport;
use App\Models\MonitoringRevision;

/**
 * The fingerprint of a finalized monitoring report. Its short form, the
 * document code, is printed on every page of the copy the HEI signs, so a
 * reviewer can tell that an uploaded scan matches the answers on record.
 */
class MonitoringDocument
{
    /** A SHA-256 of everything the signers put their names to. */
    public static function contentHash(MonitoringReport $report, MonitoringRevision $revision): string
    {
        $answers = $revision->answers->pluck('answer', 'requirement_key');
        $content = [
            'template' => $revision->template_version,
            'report' => $report->id,
            'revision' => $revision->number,
            'institution' => $report->institution_name,
            'period' => [$report->academic_year, $report->semester],
            'details' => $revision->details(),
            'answers' => array_map(
                fn (string $key): string => (string) ($answers[$key] ?? ''),
                MonitoringTemplate::keys($revision->template_version),
            ),
        ];

        return hash('sha256', json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
    }

    /** "7f3a91c2…" → "7F3A-91C2" */
    public static function code(string $hash): string
    {
        $head = strtoupper(substr($hash, 0, 8));

        return substr($head, 0, 4).'-'.substr($head, 4, 4);
    }
}
