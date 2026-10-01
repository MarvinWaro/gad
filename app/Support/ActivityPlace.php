<?php

namespace App\Support;

use App\Models\SurveyHei;

/**
 * Where an activity happened, as region → cluster → HEI. Any part may be
 * missing: a regional office's own work has a region only, and the Central
 * Office's none.
 */
final readonly class ActivityPlace
{
    public function __construct(
        public ?int $region = null,
        public ?int $cluster = null,
        public ?int $hei = null,
    ) {}

    /** An institution with the cluster and region it sits in. */
    public static function ofHei(?int $heiId): ?self
    {
        if ($heiId === null) {
            return null;
        }

        $place = SurveyHei::query()
            ->join('survey_clusters', 'survey_clusters.id', '=', 'survey_heis.survey_cluster_id')
            ->whereKey($heiId)
            ->first(['survey_heis.survey_cluster_id', 'survey_clusters.survey_region_id']);

        return new self(
            $place !== null ? (int) $place->getAttribute('survey_region_id') : null,
            $place !== null ? (int) $place->getAttribute('survey_cluster_id') : null,
            $heiId,
        );
    }

    public function isEmpty(): bool
    {
        return $this->region === null && $this->cluster === null && $this->hei === null;
    }
}
