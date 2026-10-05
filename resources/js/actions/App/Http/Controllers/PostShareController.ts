import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
const PostShareController = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: PostShareController.url(args, options),
    method: 'post',
})

PostShareController.definition = {
    methods: ["post"],
    url: '/posts/{post}/share',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
PostShareController.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return PostShareController.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
PostShareController.post = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: PostShareController.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
    const PostShareControllerForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: PostShareController.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
        PostShareControllerForm.post = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: PostShareController.url(args, options),
            method: 'post',
        })
    
    PostShareController.form = PostShareControllerForm
export default PostShareController