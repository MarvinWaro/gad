import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:20
 * @route '/posts/tag-suggestions'
 */
const PostTagSuggestionController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: PostTagSuggestionController.url(options),
    method: 'get',
})

PostTagSuggestionController.definition = {
    methods: ["get","head"],
    url: '/posts/tag-suggestions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:20
 * @route '/posts/tag-suggestions'
 */
PostTagSuggestionController.url = (options?: RouteQueryOptions) => {
    return PostTagSuggestionController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:20
 * @route '/posts/tag-suggestions'
 */
PostTagSuggestionController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: PostTagSuggestionController.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:20
 * @route '/posts/tag-suggestions'
 */
PostTagSuggestionController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: PostTagSuggestionController.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:20
 * @route '/posts/tag-suggestions'
 */
    const PostTagSuggestionControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: PostTagSuggestionController.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:20
 * @route '/posts/tag-suggestions'
 */
        PostTagSuggestionControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: PostTagSuggestionController.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:20
 * @route '/posts/tag-suggestions'
 */
        PostTagSuggestionControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: PostTagSuggestionController.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    PostTagSuggestionController.form = PostTagSuggestionControllerForm
export default PostTagSuggestionController