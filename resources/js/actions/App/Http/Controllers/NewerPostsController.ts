import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
const NewerPostsController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: NewerPostsController.url(options),
    method: 'get',
})

NewerPostsController.definition = {
    methods: ["get","head"],
    url: '/posts/newer',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
NewerPostsController.url = (options?: RouteQueryOptions) => {
    return NewerPostsController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
NewerPostsController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: NewerPostsController.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
NewerPostsController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: NewerPostsController.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
    const NewerPostsControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: NewerPostsController.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
        NewerPostsControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: NewerPostsController.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
        NewerPostsControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: NewerPostsController.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    NewerPostsController.form = NewerPostsControllerForm
export default NewerPostsController