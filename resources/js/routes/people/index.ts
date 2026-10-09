import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PersonProfileController::show
 * @see app/Http/Controllers/PersonProfileController.php:25
 * @route '/people/{person}'
 */
export const show = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/people/{person}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PersonProfileController::show
 * @see app/Http/Controllers/PersonProfileController.php:25
 * @route '/people/{person}'
 */
show.url = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { person: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'ulid' in args) {
            args = { person: args.ulid }
        }
    
    if (Array.isArray(args)) {
        args = {
                    person: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        person: typeof args.person === 'object'
                ? args.person.ulid
                : args.person,
                }

    return show.definition.url
            .replace('{person}', parsedArgs.person.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PersonProfileController::show
 * @see app/Http/Controllers/PersonProfileController.php:25
 * @route '/people/{person}'
 */
show.get = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PersonProfileController::show
 * @see app/Http/Controllers/PersonProfileController.php:25
 * @route '/people/{person}'
 */
show.head = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PersonProfileController::show
 * @see app/Http/Controllers/PersonProfileController.php:25
 * @route '/people/{person}'
 */
    const showForm = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PersonProfileController::show
 * @see app/Http/Controllers/PersonProfileController.php:25
 * @route '/people/{person}'
 */
        showForm.get = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PersonProfileController::show
 * @see app/Http/Controllers/PersonProfileController.php:25
 * @route '/people/{person}'
 */
        showForm.head = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PersonProfileController::followers
 * @see app/Http/Controllers/PersonProfileController.php:36
 * @route '/people/{person}/followers'
 */
export const followers = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: followers.url(args, options),
    method: 'get',
})

followers.definition = {
    methods: ["get","head"],
    url: '/people/{person}/followers',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PersonProfileController::followers
 * @see app/Http/Controllers/PersonProfileController.php:36
 * @route '/people/{person}/followers'
 */
followers.url = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { person: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'ulid' in args) {
            args = { person: args.ulid }
        }
    
    if (Array.isArray(args)) {
        args = {
                    person: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        person: typeof args.person === 'object'
                ? args.person.ulid
                : args.person,
                }

    return followers.definition.url
            .replace('{person}', parsedArgs.person.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PersonProfileController::followers
 * @see app/Http/Controllers/PersonProfileController.php:36
 * @route '/people/{person}/followers'
 */
followers.get = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: followers.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PersonProfileController::followers
 * @see app/Http/Controllers/PersonProfileController.php:36
 * @route '/people/{person}/followers'
 */
followers.head = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: followers.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PersonProfileController::followers
 * @see app/Http/Controllers/PersonProfileController.php:36
 * @route '/people/{person}/followers'
 */
    const followersForm = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: followers.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PersonProfileController::followers
 * @see app/Http/Controllers/PersonProfileController.php:36
 * @route '/people/{person}/followers'
 */
        followersForm.get = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: followers.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PersonProfileController::followers
 * @see app/Http/Controllers/PersonProfileController.php:36
 * @route '/people/{person}/followers'
 */
        followersForm.head = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: followers.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    followers.form = followersForm
/**
* @see \App\Http\Controllers\PersonProfileController::following
 * @see app/Http/Controllers/PersonProfileController.php:43
 * @route '/people/{person}/following'
 */
export const following = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: following.url(args, options),
    method: 'get',
})

following.definition = {
    methods: ["get","head"],
    url: '/people/{person}/following',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PersonProfileController::following
 * @see app/Http/Controllers/PersonProfileController.php:43
 * @route '/people/{person}/following'
 */
following.url = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { person: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'ulid' in args) {
            args = { person: args.ulid }
        }
    
    if (Array.isArray(args)) {
        args = {
                    person: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        person: typeof args.person === 'object'
                ? args.person.ulid
                : args.person,
                }

    return following.definition.url
            .replace('{person}', parsedArgs.person.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PersonProfileController::following
 * @see app/Http/Controllers/PersonProfileController.php:43
 * @route '/people/{person}/following'
 */
following.get = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: following.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PersonProfileController::following
 * @see app/Http/Controllers/PersonProfileController.php:43
 * @route '/people/{person}/following'
 */
following.head = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: following.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PersonProfileController::following
 * @see app/Http/Controllers/PersonProfileController.php:43
 * @route '/people/{person}/following'
 */
    const followingForm = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: following.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PersonProfileController::following
 * @see app/Http/Controllers/PersonProfileController.php:43
 * @route '/people/{person}/following'
 */
        followingForm.get = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: following.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PersonProfileController::following
 * @see app/Http/Controllers/PersonProfileController.php:43
 * @route '/people/{person}/following'
 */
        followingForm.head = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: following.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    following.form = followingForm
/**
* @see \App\Http\Controllers\FollowController::follow
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
export const follow = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: follow.url(args, options),
    method: 'post',
})

follow.definition = {
    methods: ["post"],
    url: '/people/{person}/follow',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FollowController::follow
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
follow.url = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { person: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'ulid' in args) {
            args = { person: args.ulid }
        }
    
    if (Array.isArray(args)) {
        args = {
                    person: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        person: typeof args.person === 'object'
                ? args.person.ulid
                : args.person,
                }

    return follow.definition.url
            .replace('{person}', parsedArgs.person.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FollowController::follow
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
follow.post = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: follow.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\FollowController::follow
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
    const followForm = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: follow.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FollowController::follow
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
        followForm.post = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: follow.url(args, options),
            method: 'post',
        })
    
    follow.form = followForm
/**
* @see \App\Http\Controllers\FollowController::unfollow
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
export const unfollow = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: unfollow.url(args, options),
    method: 'delete',
})

unfollow.definition = {
    methods: ["delete"],
    url: '/people/{person}/follow',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\FollowController::unfollow
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
unfollow.url = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { person: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'ulid' in args) {
            args = { person: args.ulid }
        }
    
    if (Array.isArray(args)) {
        args = {
                    person: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        person: typeof args.person === 'object'
                ? args.person.ulid
                : args.person,
                }

    return unfollow.definition.url
            .replace('{person}', parsedArgs.person.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FollowController::unfollow
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
unfollow.delete = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: unfollow.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\FollowController::unfollow
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
    const unfollowForm = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: unfollow.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FollowController::unfollow
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
        unfollowForm.delete = (args: { person: string | { ulid: string } } | [person: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: unfollow.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    unfollow.form = unfollowForm
const people = {
    show: Object.assign(show, show),
followers: Object.assign(followers, followers),
following: Object.assign(following, following),
follow: Object.assign(follow, follow),
unfollow: Object.assign(unfollow, unfollow),
}

export default people