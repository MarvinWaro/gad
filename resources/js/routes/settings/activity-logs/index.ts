import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\ActivityLogController::index
 * @see app/Http/Controllers/Settings/ActivityLogController.php:22
 * @route '/settings/activity-logs'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/activity-logs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\ActivityLogController::index
 * @see app/Http/Controllers/Settings/ActivityLogController.php:22
 * @route '/settings/activity-logs'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\ActivityLogController::index
 * @see app/Http/Controllers/Settings/ActivityLogController.php:22
 * @route '/settings/activity-logs'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\ActivityLogController::index
 * @see app/Http/Controllers/Settings/ActivityLogController.php:22
 * @route '/settings/activity-logs'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\ActivityLogController::index
 * @see app/Http/Controllers/Settings/ActivityLogController.php:22
 * @route '/settings/activity-logs'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\ActivityLogController::index
 * @see app/Http/Controllers/Settings/ActivityLogController.php:22
 * @route '/settings/activity-logs'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\ActivityLogController::index
 * @see app/Http/Controllers/Settings/ActivityLogController.php:22
 * @route '/settings/activity-logs'
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
const activityLogs = {
    index: Object.assign(index, index),
}

export default activityLogs