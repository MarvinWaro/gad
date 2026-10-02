import type { VisitOptions } from '@inertiajs/core';

/**
 * Cross-fade from one page to the next with the browser's View Transitions,
 * set as Inertia's default visit options. Only a move to another page
 * animates: filters, partial reloads, infinite scroll, forms and background
 * refreshes keep the page as it is, so they never flash or block a click.
 * Browsers without View Transitions swap pages as before.
 */
export function pageTransitions(
    _href: string,
    options: VisitOptions,
): VisitOptions {
    const changesPage =
        (options.method ?? 'get') === 'get' &&
        !options.preserveState &&
        !options.async &&
        !options.prefetch &&
        (options.only ?? []).length === 0 &&
        (options.reset ?? []).length === 0;

    return { viewTransition: options.viewTransition || changesPage };
}
