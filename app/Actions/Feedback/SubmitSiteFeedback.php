<?php

namespace App\Actions\Feedback;

use App\Models\SiteFeedback;
use App\Models\SurveyHei;
use App\Services\Notifier;
use App\Support\FeedbackQuestions;

/**
 * Keep a visitor's website feedback and tell the staff who read it. Only
 * what the visitor typed or chose is kept: no account, IP address or
 * browser details.
 */
class SubmitSiteFeedback
{
    public function __construct(private readonly Notifier $notifier) {}

    /** @param  array<string, mixed>  $answers  validated by StoreSiteFeedbackRequest */
    public function handle(array $answers): SiteFeedback
    {
        // The institution decides the cluster; the request has already
        // checked that it sits in the chosen region.
        $hei = filled($answers['hei_id'] ?? null)
            ? SurveyHei::query()->with('cluster:id,survey_region_id')->whereKey((int) $answers['hei_id'])->first()
            : null;
        $scores = [];
        foreach (array_keys(FeedbackQuestions::columns()) as $column) {
            $scores[$column] = isset($answers[$column]) ? (int) $answers[$column] : null;
        }

        $feedback = SiteFeedback::query()->create([
            'type' => $answers['type'],
            'feedback' => trim((string) $answers['feedback']),
            'suggestions' => self::text($answers['suggestions'] ?? null),
            ...$scores,
            'email' => self::text($answers['email'] ?? null),
            'name' => self::text($answers['name'] ?? null),
            'survey_region_id' => $hei?->cluster->survey_region_id ?? ($answers['region_id'] ?? null),
            'survey_cluster_id' => $hei?->survey_cluster_id,
            'survey_hei_id' => $hei?->id,
        ]);

        $this->notifier->siteFeedbackReceived($feedback);

        return $feedback;
    }

    private static function text(mixed $value): ?string
    {
        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }
}
