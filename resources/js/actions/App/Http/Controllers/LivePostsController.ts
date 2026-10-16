import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\LivePostsController::__invoke
 * @see app/Http/Controllers/LivePostsController.php:17
 * @route '/posts/live'
 */
const LivePostsController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: LivePostsController.url(options),
    method: 'get',
})

LivePostsController.definition = {
    methods: ["get","head"],
    url: '/posts/live',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\LivePostsController::__invoke
 * @see app/Http/Controllers/LivePostsController.php:17
 * @route '/posts/live'
 */
LivePostsController.url = (options?: RouteQueryOptions) => {
    return LivePostsController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\LivePostsController::__invoke
 * @see app/Http/Controllers/LivePostsController.php:17
 * @route '/posts/live'
 */
LivePostsController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: LivePostsController.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\LivePostsController::__invoke
 * @see app/Http/Controllers/LivePostsController.php:17
 * @route '/posts/live'
 */
LivePostsController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: LivePostsController.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\LivePostsController::__invoke
 * @see app/Http/Controllers/LivePostsController.php:17
 * @route '/posts/live'
 */
    const LivePostsControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: LivePostsController.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\LivePostsController::__invoke
 * @see app/Http/Controllers/LivePostsController.php:17
 * @route '/posts/live'
 */
        LivePostsControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: LivePostsController.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\LivePostsController::__invoke
 * @see app/Http/Controllers/LivePostsController.php:17
 * @route '/posts/live'
 */
        LivePostsControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: LivePostsController.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    LivePostsController.form = LivePostsControllerForm
export default LivePostsController