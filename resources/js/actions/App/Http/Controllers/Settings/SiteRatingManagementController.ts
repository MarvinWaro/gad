import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::index
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:26
 * @route '/settings/ratings'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/ratings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::index
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:26
 * @route '/settings/ratings'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::index
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:26
 * @route '/settings/ratings'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::index
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:26
 * @route '/settings/ratings'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::index
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:26
 * @route '/settings/ratings'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::index
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:26
 * @route '/settings/ratings'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::index
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:26
 * @route '/settings/ratings'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::exportMethod
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:67
 * @route '/settings/ratings/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/settings/ratings/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::exportMethod
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:67
 * @route '/settings/ratings/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::exportMethod
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:67
 * @route '/settings/ratings/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::exportMethod
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:67
 * @route '/settings/ratings/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::exportMethod
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:67
 * @route '/settings/ratings/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::exportMethod
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:67
 * @route '/settings/ratings/export'
 */
        exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::exportMethod
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:67
 * @route '/settings/ratings/export'
 */
        exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportMethod.form = exportMethodForm
/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::updateButton
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:109
 * @route '/settings/ratings/button'
 */
export const updateButton = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateButton.url(options),
    method: 'put',
})

updateButton.definition = {
    methods: ["put"],
    url: '/settings/ratings/button',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::updateButton
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:109
 * @route '/settings/ratings/button'
 */
updateButton.url = (options?: RouteQueryOptions) => {
    return updateButton.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::updateButton
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:109
 * @route '/settings/ratings/button'
 */
updateButton.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateButton.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::updateButton
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:109
 * @route '/settings/ratings/button'
 */
    const updateButtonForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateButton.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::updateButton
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:109
 * @route '/settings/ratings/button'
 */
        updateButtonForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateButton.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateButton.form = updateButtonForm
/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::destroy
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:96
 * @route '/settings/ratings/{siteRating}'
 */
export const destroy = (args: { siteRating: string | { id: string } } | [siteRating: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/ratings/{siteRating}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::destroy
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:96
 * @route '/settings/ratings/{siteRating}'
 */
destroy.url = (args: { siteRating: string | { id: string } } | [siteRating: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { siteRating: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { siteRating: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    siteRating: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        siteRating: typeof args.siteRating === 'object'
                ? args.siteRating.id
                : args.siteRating,
                }

    return destroy.definition.url
            .replace('{siteRating}', parsedArgs.siteRating.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::destroy
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:96
 * @route '/settings/ratings/{siteRating}'
 */
destroy.delete = (args: { siteRating: string | { id: string } } | [siteRating: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::destroy
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:96
 * @route '/settings/ratings/{siteRating}'
 */
    const destroyForm = (args: { siteRating: string | { id: string } } | [siteRating: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SiteRatingManagementController::destroy
 * @see app/Http/Controllers/Settings/SiteRatingManagementController.php:96
 * @route '/settings/ratings/{siteRating}'
 */
        destroyForm.delete = (args: { siteRating: string | { id: string } } | [siteRating: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const SiteRatingManagementController = { index, exportMethod, updateButton, destroy, export: exportMethod }

export default SiteRatingManagementController