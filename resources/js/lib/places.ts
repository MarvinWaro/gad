/**
 * The holding cluster for institutions whose province is not known yet
 * (`App\Models\SurveyCluster::UNASSIGNED`). It is not a place, so it is never
 * shown as one.
 */
export const UNASSIGNED_CLUSTER = 'Unassigned';

/** "Cluster · Region", leaving out the holding cluster. */
export function placeLine(
    cluster?: string | null,
    region?: string | null,
): string {
    return [cluster === UNASSIGNED_CLUSTER ? null : cluster, region]
        .filter(Boolean)
        .join(' · ');
}
