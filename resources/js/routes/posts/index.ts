import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import homepage from './homepage'
import reactions from './reactions'
import reaction from './reaction'
import comments from './comments'
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
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:21
 * @route '/posts/tag-suggestions'
 */
export const tagSuggestions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tagSuggestions.url(options),
    method: 'get',
})

tagSuggestions.definition = {
    methods: ["get","head"],
    url: '/posts/tag-suggestions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:21
 * @route '/posts/tag-suggestions'
 */
tagSuggestions.url = (options?: RouteQueryOptions) => {
    return tagSuggestions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:21
 * @route '/posts/tag-suggestions'
 */
tagSuggestions.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tagSuggestions.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:21
 * @route '/posts/tag-suggestions'
 */
tagSuggestions.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: tagSuggestions.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:21
 * @route '/posts/tag-suggestions'
 */
    const tagSuggestionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: tagSuggestions.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:21
 * @route '/posts/tag-suggestions'
 */
        tagSuggestionsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tagSuggestions.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PostTagSuggestionController::__invoke
 * @see app/Http/Controllers/PostTagSuggestionController.php:21
 * @route '/posts/tag-suggestions'
 */
        tagSuggestionsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tagSuggestions.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    tagSuggestions.form = tagSuggestionsForm
/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
export const newer = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: newer.url(options),
    method: 'get',
})

newer.definition = {
    methods: ["get","head"],
    url: '/posts/newer',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
newer.url = (options?: RouteQueryOptions) => {
    return newer.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
newer.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: newer.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
newer.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: newer.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
    const newerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: newer.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
        newerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: newer.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\NewerPostsController::__invoke
 * @see app/Http/Controllers/NewerPostsController.php:17
 * @route '/posts/newer'
 */
        newerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: newer.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    newer.form = newerForm
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
/**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
export const share = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: share.url(args, options),
    method: 'post',
})

share.definition = {
    methods: ["post"],
    url: '/posts/{post}/share',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
share.url = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return share.definition.url
            .replace('{post}', parsedArgs.post.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
share.post = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: share.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
    const shareForm = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: share.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PostShareController::__invoke
 * @see app/Http/Controllers/PostShareController.php:21
 * @route '/posts/{post}/share'
 */
        shareForm.post = (args: { post: string | { id: string } } | [post: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: share.url(args, options),
            method: 'post',
        })
    
    share.form = shareForm
const posts = {
    store: Object.assign(store, store),
tagSuggestions: Object.assign(tagSuggestions, tagSuggestions),
newer: Object.assign(newer, newer),
show: Object.assign(show, show),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
share: Object.assign(share, share),
homepage: Object.assign(homepage, homepage),
reactions: Object.assign(reactions, reactions),
reaction: Object.assign(reaction, reaction),
comments: Object.assign(comments, comments),
}

export default posts