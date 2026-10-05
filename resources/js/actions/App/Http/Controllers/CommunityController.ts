import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CommunityController::__invoke
 * @see app/Http/Controllers/CommunityController.php:15
 * @route '/community'
 */
const CommunityController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: CommunityController.url(options),
    method: 'get',
})

CommunityController.definition = {
    methods: ["get","head"],
    url: '/community',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CommunityController::__invoke
 * @see app/Http/Controllers/CommunityController.php:15
 * @route '/community'
 */
CommunityController.url = (options?: RouteQueryOptions) => {
    return CommunityController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CommunityController::__invoke
 * @see app/Http/Controllers/CommunityController.php:15
 * @route '/community'
 */
CommunityController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: CommunityController.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CommunityController::__invoke
 * @see app/Http/Controllers/CommunityController.php:15
 * @route '/community'
 */
CommunityController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: CommunityController.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CommunityController::__invoke
 * @see app/Http/Controllers/CommunityController.php:15
 * @route '/community'
 */
    const CommunityControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: CommunityController.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CommunityController::__invoke
 * @see app/Http/Controllers/CommunityController.php:15
 * @route '/community'
 */
        CommunityControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: CommunityController.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CommunityController::__invoke
 * @see app/Http/Controllers/CommunityController.php:15
 * @route '/community'
 */
        CommunityControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: CommunityController.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    CommunityController.form = CommunityControllerForm
export default CommunityController