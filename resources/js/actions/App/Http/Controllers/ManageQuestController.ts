import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\ManageQuestController::index
 * @see app/Http/Controllers/ManageQuestController.php:33
 * @route '/quests/manage'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/quests/manage',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ManageQuestController::index
 * @see app/Http/Controllers/ManageQuestController.php:33
 * @route '/quests/manage'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::index
 * @see app/Http/Controllers/ManageQuestController.php:33
 * @route '/quests/manage'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ManageQuestController::index
 * @see app/Http/Controllers/ManageQuestController.php:33
 * @route '/quests/manage'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::index
 * @see app/Http/Controllers/ManageQuestController.php:33
 * @route '/quests/manage'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::index
 * @see app/Http/Controllers/ManageQuestController.php:33
 * @route '/quests/manage'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ManageQuestController::index
 * @see app/Http/Controllers/ManageQuestController.php:33
 * @route '/quests/manage'
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
* @see \App\Http\Controllers\ManageQuestController::create
 * @see app/Http/Controllers/ManageQuestController.php:65
 * @route '/quests/manage/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/quests/manage/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ManageQuestController::create
 * @see app/Http/Controllers/ManageQuestController.php:65
 * @route '/quests/manage/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::create
 * @see app/Http/Controllers/ManageQuestController.php:65
 * @route '/quests/manage/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ManageQuestController::create
 * @see app/Http/Controllers/ManageQuestController.php:65
 * @route '/quests/manage/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::create
 * @see app/Http/Controllers/ManageQuestController.php:65
 * @route '/quests/manage/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::create
 * @see app/Http/Controllers/ManageQuestController.php:65
 * @route '/quests/manage/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ManageQuestController::create
 * @see app/Http/Controllers/ManageQuestController.php:65
 * @route '/quests/manage/create'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\ManageQuestController::store
 * @see app/Http/Controllers/ManageQuestController.php:70
 * @route '/quests/manage'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/quests/manage',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ManageQuestController::store
 * @see app/Http/Controllers/ManageQuestController.php:70
 * @route '/quests/manage'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::store
 * @see app/Http/Controllers/ManageQuestController.php:70
 * @route '/quests/manage'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::store
 * @see app/Http/Controllers/ManageQuestController.php:70
 * @route '/quests/manage'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::store
 * @see app/Http/Controllers/ManageQuestController.php:70
 * @route '/quests/manage'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\ManageQuestController::show
 * @see app/Http/Controllers/ManageQuestController.php:81
 * @route '/quests/manage/{quest}'
 */
export const show = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/quests/manage/{quest}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ManageQuestController::show
 * @see app/Http/Controllers/ManageQuestController.php:81
 * @route '/quests/manage/{quest}'
 */
show.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quest: typeof args.quest === 'object'
                ? args.quest.id
                : args.quest,
                }

    return show.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::show
 * @see app/Http/Controllers/ManageQuestController.php:81
 * @route '/quests/manage/{quest}'
 */
show.get = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ManageQuestController::show
 * @see app/Http/Controllers/ManageQuestController.php:81
 * @route '/quests/manage/{quest}'
 */
show.head = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::show
 * @see app/Http/Controllers/ManageQuestController.php:81
 * @route '/quests/manage/{quest}'
 */
    const showForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::show
 * @see app/Http/Controllers/ManageQuestController.php:81
 * @route '/quests/manage/{quest}'
 */
        showForm.get = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ManageQuestController::show
 * @see app/Http/Controllers/ManageQuestController.php:81
 * @route '/quests/manage/{quest}'
 */
        showForm.head = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ManageQuestController::edit
 * @see app/Http/Controllers/ManageQuestController.php:105
 * @route '/quests/manage/{quest}/edit'
 */
export const edit = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/quests/manage/{quest}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ManageQuestController::edit
 * @see app/Http/Controllers/ManageQuestController.php:105
 * @route '/quests/manage/{quest}/edit'
 */
edit.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quest: typeof args.quest === 'object'
                ? args.quest.id
                : args.quest,
                }

    return edit.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::edit
 * @see app/Http/Controllers/ManageQuestController.php:105
 * @route '/quests/manage/{quest}/edit'
 */
edit.get = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ManageQuestController::edit
 * @see app/Http/Controllers/ManageQuestController.php:105
 * @route '/quests/manage/{quest}/edit'
 */
edit.head = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::edit
 * @see app/Http/Controllers/ManageQuestController.php:105
 * @route '/quests/manage/{quest}/edit'
 */
    const editForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::edit
 * @see app/Http/Controllers/ManageQuestController.php:105
 * @route '/quests/manage/{quest}/edit'
 */
        editForm.get = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ManageQuestController::edit
 * @see app/Http/Controllers/ManageQuestController.php:105
 * @route '/quests/manage/{quest}/edit'
 */
        editForm.head = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\ManageQuestController::update
 * @see app/Http/Controllers/ManageQuestController.php:110
 * @route '/quests/manage/{quest}'
 */
export const update = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/quests/manage/{quest}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\ManageQuestController::update
 * @see app/Http/Controllers/ManageQuestController.php:110
 * @route '/quests/manage/{quest}'
 */
update.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quest: typeof args.quest === 'object'
                ? args.quest.id
                : args.quest,
                }

    return update.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::update
 * @see app/Http/Controllers/ManageQuestController.php:110
 * @route '/quests/manage/{quest}'
 */
update.put = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::update
 * @see app/Http/Controllers/ManageQuestController.php:110
 * @route '/quests/manage/{quest}'
 */
    const updateForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::update
 * @see app/Http/Controllers/ManageQuestController.php:110
 * @route '/quests/manage/{quest}'
 */
        updateForm.put = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ManageQuestController::status
 * @see app/Http/Controllers/ManageQuestController.php:119
 * @route '/quests/manage/{quest}/status'
 */
export const status = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: status.url(args, options),
    method: 'patch',
})

status.definition = {
    methods: ["patch"],
    url: '/quests/manage/{quest}/status',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ManageQuestController::status
 * @see app/Http/Controllers/ManageQuestController.php:119
 * @route '/quests/manage/{quest}/status'
 */
status.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quest: typeof args.quest === 'object'
                ? args.quest.id
                : args.quest,
                }

    return status.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::status
 * @see app/Http/Controllers/ManageQuestController.php:119
 * @route '/quests/manage/{quest}/status'
 */
status.patch = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: status.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::status
 * @see app/Http/Controllers/ManageQuestController.php:119
 * @route '/quests/manage/{quest}/status'
 */
    const statusForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: status.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::status
 * @see app/Http/Controllers/ManageQuestController.php:119
 * @route '/quests/manage/{quest}/status'
 */
        statusForm.patch = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\ManageQuestController::retakes
 * @see app/Http/Controllers/ManageQuestController.php:134
 * @route '/quests/manage/{quest}/retakes'
 */
export const retakes = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: retakes.url(args, options),
    method: 'patch',
})

retakes.definition = {
    methods: ["patch"],
    url: '/quests/manage/{quest}/retakes',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\ManageQuestController::retakes
 * @see app/Http/Controllers/ManageQuestController.php:134
 * @route '/quests/manage/{quest}/retakes'
 */
retakes.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quest: typeof args.quest === 'object'
                ? args.quest.id
                : args.quest,
                }

    return retakes.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::retakes
 * @see app/Http/Controllers/ManageQuestController.php:134
 * @route '/quests/manage/{quest}/retakes'
 */
retakes.patch = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: retakes.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::retakes
 * @see app/Http/Controllers/ManageQuestController.php:134
 * @route '/quests/manage/{quest}/retakes'
 */
    const retakesForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: retakes.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::retakes
 * @see app/Http/Controllers/ManageQuestController.php:134
 * @route '/quests/manage/{quest}/retakes'
 */
        retakesForm.patch = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: retakes.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    retakes.form = retakesForm
/**
* @see \App\Http\Controllers\ManageQuestController::destroy
 * @see app/Http/Controllers/ManageQuestController.php:146
 * @route '/quests/manage/{quest}'
 */
export const destroy = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/quests/manage/{quest}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\ManageQuestController::destroy
 * @see app/Http/Controllers/ManageQuestController.php:146
 * @route '/quests/manage/{quest}'
 */
destroy.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quest: typeof args.quest === 'object'
                ? args.quest.id
                : args.quest,
                }

    return destroy.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ManageQuestController::destroy
 * @see app/Http/Controllers/ManageQuestController.php:146
 * @route '/quests/manage/{quest}'
 */
destroy.delete = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\ManageQuestController::destroy
 * @see app/Http/Controllers/ManageQuestController.php:146
 * @route '/quests/manage/{quest}'
 */
    const destroyForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ManageQuestController::destroy
 * @see app/Http/Controllers/ManageQuestController.php:146
 * @route '/quests/manage/{quest}'
 */
        destroyForm.delete = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const ManageQuestController = { index, create, store, show, edit, update, status, retakes, destroy }

export default ManageQuestController