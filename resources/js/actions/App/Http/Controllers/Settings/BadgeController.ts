import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\BadgeController::index
 * @see app/Http/Controllers/Settings/BadgeController.php:40
 * @route '/settings/badges'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/badges',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::index
 * @see app/Http/Controllers/Settings/BadgeController.php:40
 * @route '/settings/badges'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::index
 * @see app/Http/Controllers/Settings/BadgeController.php:40
 * @route '/settings/badges'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\BadgeController::index
 * @see app/Http/Controllers/Settings/BadgeController.php:40
 * @route '/settings/badges'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::index
 * @see app/Http/Controllers/Settings/BadgeController.php:40
 * @route '/settings/badges'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::index
 * @see app/Http/Controllers/Settings/BadgeController.php:40
 * @route '/settings/badges'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\BadgeController::index
 * @see app/Http/Controllers/Settings/BadgeController.php:40
 * @route '/settings/badges'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:69
 * @route '/settings/badges'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/badges',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:69
 * @route '/settings/badges'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:69
 * @route '/settings/badges'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:69
 * @route '/settings/badges'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:69
 * @route '/settings/badges'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Settings\BadgeController::show
 * @see app/Http/Controllers/Settings/BadgeController.php:81
 * @route '/settings/badges/{badge}'
 */
export const show = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/settings/badges/{badge}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::show
 * @see app/Http/Controllers/Settings/BadgeController.php:81
 * @route '/settings/badges/{badge}'
 */
show.url = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { badge: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { badge: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    badge: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        badge: typeof args.badge === 'object'
                ? args.badge.id
                : args.badge,
                }

    return show.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::show
 * @see app/Http/Controllers/Settings/BadgeController.php:81
 * @route '/settings/badges/{badge}'
 */
show.get = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\BadgeController::show
 * @see app/Http/Controllers/Settings/BadgeController.php:81
 * @route '/settings/badges/{badge}'
 */
show.head = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::show
 * @see app/Http/Controllers/Settings/BadgeController.php:81
 * @route '/settings/badges/{badge}'
 */
    const showForm = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::show
 * @see app/Http/Controllers/Settings/BadgeController.php:81
 * @route '/settings/badges/{badge}'
 */
        showForm.get = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\BadgeController::show
 * @see app/Http/Controllers/Settings/BadgeController.php:81
 * @route '/settings/badges/{badge}'
 */
        showForm.head = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Settings\BadgeController::update
 * @see app/Http/Controllers/Settings/BadgeController.php:122
 * @route '/settings/badges/{badge}'
 */
export const update = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/badges/{badge}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::update
 * @see app/Http/Controllers/Settings/BadgeController.php:122
 * @route '/settings/badges/{badge}'
 */
update.url = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { badge: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { badge: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    badge: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        badge: typeof args.badge === 'object'
                ? args.badge.id
                : args.badge,
                }

    return update.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::update
 * @see app/Http/Controllers/Settings/BadgeController.php:122
 * @route '/settings/badges/{badge}'
 */
update.put = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::update
 * @see app/Http/Controllers/Settings/BadgeController.php:122
 * @route '/settings/badges/{badge}'
 */
    const updateForm = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::update
 * @see app/Http/Controllers/Settings/BadgeController.php:122
 * @route '/settings/badges/{badge}'
 */
        updateForm.put = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Settings\BadgeController::status
 * @see app/Http/Controllers/Settings/BadgeController.php:131
 * @route '/settings/badges/{badge}/status'
 */
export const status = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: status.url(args, options),
    method: 'patch',
})

status.definition = {
    methods: ["patch"],
    url: '/settings/badges/{badge}/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::status
 * @see app/Http/Controllers/Settings/BadgeController.php:131
 * @route '/settings/badges/{badge}/status'
 */
status.url = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { badge: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { badge: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    badge: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        badge: typeof args.badge === 'object'
                ? args.badge.id
                : args.badge,
                }

    return status.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::status
 * @see app/Http/Controllers/Settings/BadgeController.php:131
 * @route '/settings/badges/{badge}/status'
 */
status.patch = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: status.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::status
 * @see app/Http/Controllers/Settings/BadgeController.php:131
 * @route '/settings/badges/{badge}/status'
 */
    const statusForm = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: status.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::status
 * @see app/Http/Controllers/Settings/BadgeController.php:131
 * @route '/settings/badges/{badge}/status'
 */
        statusForm.patch = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: status.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    status.form = statusForm
/**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:142
 * @route '/settings/badges/{badge}'
 */
export const destroy = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/badges/{badge}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:142
 * @route '/settings/badges/{badge}'
 */
destroy.url = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { badge: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { badge: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    badge: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        badge: typeof args.badge === 'object'
                ? args.badge.id
                : args.badge,
                }

    return destroy.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:142
 * @route '/settings/badges/{badge}'
 */
destroy.delete = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:142
 * @route '/settings/badges/{badge}'
 */
    const destroyForm = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:142
 * @route '/settings/badges/{badge}'
 */
        destroyForm.delete = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Settings\BadgeController::people
 * @see app/Http/Controllers/Settings/BadgeController.php:156
 * @route '/settings/badges/{badge}/people'
 */
export const people = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: people.url(args, options),
    method: 'get',
})

people.definition = {
    methods: ["get","head"],
    url: '/settings/badges/{badge}/people',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::people
 * @see app/Http/Controllers/Settings/BadgeController.php:156
 * @route '/settings/badges/{badge}/people'
 */
people.url = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { badge: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { badge: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    badge: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        badge: typeof args.badge === 'object'
                ? args.badge.id
                : args.badge,
                }

    return people.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::people
 * @see app/Http/Controllers/Settings/BadgeController.php:156
 * @route '/settings/badges/{badge}/people'
 */
people.get = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: people.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\BadgeController::people
 * @see app/Http/Controllers/Settings/BadgeController.php:156
 * @route '/settings/badges/{badge}/people'
 */
people.head = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: people.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::people
 * @see app/Http/Controllers/Settings/BadgeController.php:156
 * @route '/settings/badges/{badge}/people'
 */
    const peopleForm = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: people.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::people
 * @see app/Http/Controllers/Settings/BadgeController.php:156
 * @route '/settings/badges/{badge}/people'
 */
        peopleForm.get = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: people.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\BadgeController::people
 * @see app/Http/Controllers/Settings/BadgeController.php:156
 * @route '/settings/badges/{badge}/people'
 */
        peopleForm.head = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: people.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    people.form = peopleForm
/**
* @see \App\Http\Controllers\Settings\BadgeController::award
 * @see app/Http/Controllers/Settings/BadgeController.php:189
 * @route '/settings/badges/{badge}/awards'
 */
export const award = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: award.url(args, options),
    method: 'post',
})

award.definition = {
    methods: ["post"],
    url: '/settings/badges/{badge}/awards',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::award
 * @see app/Http/Controllers/Settings/BadgeController.php:189
 * @route '/settings/badges/{badge}/awards'
 */
award.url = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { badge: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { badge: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    badge: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        badge: typeof args.badge === 'object'
                ? args.badge.id
                : args.badge,
                }

    return award.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::award
 * @see app/Http/Controllers/Settings/BadgeController.php:189
 * @route '/settings/badges/{badge}/awards'
 */
award.post = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: award.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::award
 * @see app/Http/Controllers/Settings/BadgeController.php:189
 * @route '/settings/badges/{badge}/awards'
 */
    const awardForm = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: award.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::award
 * @see app/Http/Controllers/Settings/BadgeController.php:189
 * @route '/settings/badges/{badge}/awards'
 */
        awardForm.post = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: award.url(args, options),
            method: 'post',
        })
    
    award.form = awardForm
/**
* @see \App\Http\Controllers\Settings\BadgeController::revoke
 * @see app/Http/Controllers/Settings/BadgeController.php:201
 * @route '/settings/badges/{badge}/awards/{award}'
 */
export const revoke = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: revoke.url(args, options),
    method: 'delete',
})

revoke.definition = {
    methods: ["delete"],
    url: '/settings/badges/{badge}/awards/{award}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::revoke
 * @see app/Http/Controllers/Settings/BadgeController.php:201
 * @route '/settings/badges/{badge}/awards/{award}'
 */
revoke.url = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    badge: args[0],
                    award: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        badge: typeof args.badge === 'object'
                ? args.badge.id
                : args.badge,
                                award: typeof args.award === 'object'
                ? args.award.id
                : args.award,
                }

    return revoke.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace('{award}', parsedArgs.award.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::revoke
 * @see app/Http/Controllers/Settings/BadgeController.php:201
 * @route '/settings/badges/{badge}/awards/{award}'
 */
revoke.delete = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: revoke.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::revoke
 * @see app/Http/Controllers/Settings/BadgeController.php:201
 * @route '/settings/badges/{badge}/awards/{award}'
 */
    const revokeForm = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: revoke.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::revoke
 * @see app/Http/Controllers/Settings/BadgeController.php:201
 * @route '/settings/badges/{badge}/awards/{award}'
 */
        revokeForm.delete = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: revoke.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    revoke.form = revokeForm
const BadgeController = { index, store, show, update, status, destroy, people, award, revoke }

export default BadgeController