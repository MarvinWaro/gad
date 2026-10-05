import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PostController::store
 * @see app/Http/Controllers/PostController.php:38
 * @route '/posts'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/posts',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PostController::store
 * @see app/Http/Controllers/PostController.php:38
 * @route '/posts'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostController::store
 * @see app/Http/Controllers/PostController.php:38
 * @route '/posts'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PostController::store
 * @see app/Http/Controllers/PostController.php:38
 * @route '/posts'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostController::store
 * @see app/Http/Controllers/PostController.php:38
 * @route '/posts'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PostController::show
 * @see app/Http/Controllers/PostController.php:27
 * @route '/posts/{post}'
 */
export const show = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/posts/{post}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PostController::show
 * @see app/Http/Controllers/PostController.php:27
 * @route '/posts/{post}'
 */
show.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostController::show
 * @see app/Http/Controllers/PostController.php:27
 * @route '/posts/{post}'
 */
show.get = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PostController::show
 * @see app/Http/Controllers/PostController.php:27
 * @route '/posts/{post}'
 */
show.head = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PostController::show
 * @see app/Http/Controllers/PostController.php:27
 * @route '/posts/{post}'
 */
    const showForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PostController::show
 * @see app/Http/Controllers/PostController.php:27
 * @route '/posts/{post}'
 */
        showForm.get = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PostController::show
 * @see app/Http/Controllers/PostController.php:27
 * @route '/posts/{post}'
 */
        showForm.head = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\PostController::update
 * @see app/Http/Controllers/PostController.php:58
 * @route '/posts/{post}'
 */
export const update = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/posts/{post}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\PostController::update
 * @see app/Http/Controllers/PostController.php:58
 * @route '/posts/{post}'
 */
update.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostController::update
 * @see app/Http/Controllers/PostController.php:58
 * @route '/posts/{post}'
 */
update.put = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\PostController::update
 * @see app/Http/Controllers/PostController.php:58
 * @route '/posts/{post}'
 */
    const updateForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostController::update
 * @see app/Http/Controllers/PostController.php:58
 * @route '/posts/{post}'
 */
        updateForm.put = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\PostController::destroy
 * @see app/Http/Controllers/PostController.php:84
 * @route '/posts/{post}'
 */
export const destroy = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/posts/{post}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PostController::destroy
 * @see app/Http/Controllers/PostController.php:84
 * @route '/posts/{post}'
 */
destroy.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostController::destroy
 * @see app/Http/Controllers/PostController.php:84
 * @route '/posts/{post}'
 */
destroy.delete = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\PostController::destroy
 * @see app/Http/Controllers/PostController.php:84
 * @route '/posts/{post}'
 */
    const destroyForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostController::destroy
 * @see app/Http/Controllers/PostController.php:84
 * @route '/posts/{post}'
 */
        destroyForm.delete = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const PostController = { store, show, update, destroy }

export default PostController