import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/definition-of-terms'
 */
export const terms = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: terms.url(options),
    method: 'get',
})

terms.definition = {
    methods: ["get","head"],
    url: '/resources/definition-of-terms',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/definition-of-terms'
 */
terms.url = (options?: RouteQueryOptions) => {
    return terms.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/definition-of-terms'
 */
terms.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: terms.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/definition-of-terms'
 */
terms.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: terms.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/definition-of-terms'
 */
    const termsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: terms.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/definition-of-terms'
 */
        termsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: terms.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/definition-of-terms'
 */
        termsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: terms.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    terms.form = termsForm
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/gad-enabling-republic-acts'
 */
export const acts = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: acts.url(options),
    method: 'get',
})

acts.definition = {
    methods: ["get","head"],
    url: '/resources/gad-enabling-republic-acts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/gad-enabling-republic-acts'
 */
acts.url = (options?: RouteQueryOptions) => {
    return acts.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/gad-enabling-republic-acts'
 */
acts.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: acts.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/gad-enabling-republic-acts'
 */
acts.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: acts.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/gad-enabling-republic-acts'
 */
    const actsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: acts.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/gad-enabling-republic-acts'
 */
        actsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: acts.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/gad-enabling-republic-acts'
 */
        actsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: acts.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    acts.form = actsForm
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/issuances'
 */
export const issuances = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: issuances.url(options),
    method: 'get',
})

issuances.definition = {
    methods: ["get","head"],
    url: '/resources/issuances',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/issuances'
 */
issuances.url = (options?: RouteQueryOptions) => {
    return issuances.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/issuances'
 */
issuances.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: issuances.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/issuances'
 */
issuances.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: issuances.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/issuances'
 */
    const issuancesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: issuances.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/issuances'
 */
        issuancesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: issuances.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/issuances'
 */
        issuancesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: issuances.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    issuances.form = issuancesForm
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/manuals'
 */
export const manuals = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manuals.url(options),
    method: 'get',
})

manuals.definition = {
    methods: ["get","head"],
    url: '/resources/manuals',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/manuals'
 */
manuals.url = (options?: RouteQueryOptions) => {
    return manuals.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/manuals'
 */
manuals.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: manuals.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/manuals'
 */
manuals.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: manuals.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/manuals'
 */
    const manualsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: manuals.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/manuals'
 */
        manualsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manuals.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/resources/manuals'
 */
        manualsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: manuals.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    manuals.form = manualsForm
const resources = {
    terms: Object.assign(terms, terms),
acts: Object.assign(acts, acts),
issuances: Object.assign(issuances, issuances),
manuals: Object.assign(manuals, manuals),
}

export default resources