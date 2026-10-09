import { usePage } from '@inertiajs/react';
import type { SiteOperator } from '@/types/site';

/**
 * The CHED office running this site (config/phlgadis.php), with its hotline
 * ready as a `tel:` link: the footer and the help pages name it.
 */
export function useOperator(): SiteOperator & { hotlineHref: string } {
    const { operator } = usePage().props;

    return {
        ...operator,
        hotlineHref: `tel:${operator.hotline.replace(/[^\d+]/g, '')}`,
    };
}
