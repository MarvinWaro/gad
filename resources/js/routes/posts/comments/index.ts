import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PostCommentController::store
 * @see app/Http/Controllers/PostCommentController.php:21
 * @route '/posts/{post}/comments'
 */
export const store = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/posts/{post}/comments',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PostCommentController::store
 * @see app/Http/Controllers/PostCommentController.php:21
 * @route '/posts/{post}/comments'
 */
store.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostCommentController::store
 * @see app/Http/Controllers/PostCommentController.php:21
 * @route '/posts/{post}/comments'
 */
store.post = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PostCommentController::store
 * @see app/Http/Controllers/PostCommentController.php:21
 * @route '/posts/{post}/comments'
 */
    const storeForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostCommentController::store
 * @see app/Http/Controllers/PostCommentController.php:21
 * @route '/posts/{post}/comments'
 */
        storeForm.post = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const comments = {
    store: Object.assign(store, store),
}

export default comments