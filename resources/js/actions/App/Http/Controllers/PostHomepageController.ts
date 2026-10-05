import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PostHomepageController::__invoke
 * @see app/Http/Controllers/PostHomepageController.php:19
 * @route '/posts/{post}/homepage'
 */
const PostHomepageController = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: PostHomepageController.url(args, options),
    method: 'put',
})

PostHomepageController.definition = {
    methods: ["put"],
    url: '/posts/{post}/homepage',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\PostHomepageController::__invoke
 * @see app/Http/Controllers/PostHomepageController.php:19
 * @route '/posts/{post}/homepage'
 */
PostHomepageController.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { post: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { post: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    post: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        post: typeof args.post === 'object'
                ? args.post.id
                : args.post,
                }

    return PostHomepageController.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostHomepageController::__invoke
 * @see app/Http/Controllers/PostHomepageController.php:19
 * @route '/posts/{post}/homepage'
 */
PostHomepageController.put = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: PostHomepageController.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\PostHomepageController::__invoke
 * @see app/Http/Controllers/PostHomepageController.php:19
 * @route '/posts/{post}/homepage'
 */
    const PostHomepageControllerForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: PostHomepageController.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostHomepageController::__invoke
 * @see app/Http/Controllers/PostHomepageController.php:19
 * @route '/posts/{post}/homepage'
 */
        PostHomepageControllerForm.put = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: PostHomepageController.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    PostHomepageController.form = PostHomepageControllerForm
export default PostHomepageController