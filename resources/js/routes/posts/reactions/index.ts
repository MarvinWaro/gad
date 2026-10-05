import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PostReactionController::index
 * @see app/Http/Controllers/PostReactionController.php:26
 * @route '/posts/{post}/reactions'
 */
export const index = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/posts/{post}/reactions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PostReactionController::index
 * @see app/Http/Controllers/PostReactionController.php:26
 * @route '/posts/{post}/reactions'
 */
index.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return index.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostReactionController::index
 * @see app/Http/Controllers/PostReactionController.php:26
 * @route '/posts/{post}/reactions'
 */
index.get = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PostReactionController::index
 * @see app/Http/Controllers/PostReactionController.php:26
 * @route '/posts/{post}/reactions'
 */
index.head = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PostReactionController::index
 * @see app/Http/Controllers/PostReactionController.php:26
 * @route '/posts/{post}/reactions'
 */
    const indexForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PostReactionController::index
 * @see app/Http/Controllers/PostReactionController.php:26
 * @route '/posts/{post}/reactions'
 */
        indexForm.get = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PostReactionController::index
 * @see app/Http/Controllers/PostReactionController.php:26
 * @route '/posts/{post}/reactions'
 */
        indexForm.head = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
const reactions = {
    index: Object.assign(index, index),
}

export default reactions