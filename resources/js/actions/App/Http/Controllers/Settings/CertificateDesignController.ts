import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::index
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:41
 * @route '/settings/certificates'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/certificates',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::index
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:41
 * @route '/settings/certificates'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::index
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:41
 * @route '/settings/certificates'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::index
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:41
 * @route '/settings/certificates'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::index
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:41
 * @route '/settings/certificates'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::index
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:41
 * @route '/settings/certificates'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::index
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:41
 * @route '/settings/certificates'
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
* @see \App\Http\Controllers\Settings\CertificateDesignController::create
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:70
 * @route '/settings/certificates/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/settings/certificates/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::create
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:70
 * @route '/settings/certificates/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::create
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:70
 * @route '/settings/certificates/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::create
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:70
 * @route '/settings/certificates/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::create
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:70
 * @route '/settings/certificates/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::create
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:70
 * @route '/settings/certificates/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::create
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:70
 * @route '/settings/certificates/create'
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
* @see \App\Http\Controllers\Settings\CertificateDesignController::store
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:82
 * @route '/settings/certificates'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/certificates',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::store
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:82
 * @route '/settings/certificates'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::store
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:82
 * @route '/settings/certificates'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::store
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:82
 * @route '/settings/certificates'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::store
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:82
 * @route '/settings/certificates'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::show
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:94
 * @route '/settings/certificates/{design}'
 */
export const show = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/settings/certificates/{design}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::show
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:94
 * @route '/settings/certificates/{design}'
 */
show.url = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return show.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::show
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:94
 * @route '/settings/certificates/{design}'
 */
show.get = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::show
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:94
 * @route '/settings/certificates/{design}'
 */
show.head = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::show
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:94
 * @route '/settings/certificates/{design}'
 */
    const showForm = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::show
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:94
 * @route '/settings/certificates/{design}'
 */
        showForm.get = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::show
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:94
 * @route '/settings/certificates/{design}'
 */
        showForm.head = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Settings\CertificateDesignController::update
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:116
 * @route '/settings/certificates/{design}'
 */
export const update = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/certificates/{design}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::update
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:116
 * @route '/settings/certificates/{design}'
 */
update.url = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return update.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::update
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:116
 * @route '/settings/certificates/{design}'
 */
update.put = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::update
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:116
 * @route '/settings/certificates/{design}'
 */
    const updateForm = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::update
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:116
 * @route '/settings/certificates/{design}'
 */
        updateForm.put = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Settings\CertificateDesignController::duplicate
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:125
 * @route '/settings/certificates/{design}/duplicate'
 */
export const duplicate = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

duplicate.definition = {
    methods: ["post"],
    url: '/settings/certificates/{design}/duplicate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::duplicate
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:125
 * @route '/settings/certificates/{design}/duplicate'
 */
duplicate.url = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return duplicate.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::duplicate
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:125
 * @route '/settings/certificates/{design}/duplicate'
 */
duplicate.post = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::duplicate
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:125
 * @route '/settings/certificates/{design}/duplicate'
 */
    const duplicateForm = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: duplicate.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::duplicate
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:125
 * @route '/settings/certificates/{design}/duplicate'
 */
        duplicateForm.post = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: duplicate.url(args, options),
            method: 'post',
        })
    
    duplicate.form = duplicateForm
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::pair
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:137
 * @route '/settings/certificates/{design}/pair'
 */
export const pair = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pair.url(args, options),
    method: 'post',
})

pair.definition = {
    methods: ["post"],
    url: '/settings/certificates/{design}/pair',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::pair
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:137
 * @route '/settings/certificates/{design}/pair'
 */
pair.url = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return pair.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::pair
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:137
 * @route '/settings/certificates/{design}/pair'
 */
pair.post = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: pair.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::pair
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:137
 * @route '/settings/certificates/{design}/pair'
 */
    const pairForm = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: pair.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::pair
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:137
 * @route '/settings/certificates/{design}/pair'
 */
        pairForm.post = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: pair.url(args, options),
            method: 'post',
        })
    
    pair.form = pairForm
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::destroy
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:148
 * @route '/settings/certificates/{design}'
 */
export const destroy = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/certificates/{design}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::destroy
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:148
 * @route '/settings/certificates/{design}'
 */
destroy.url = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return destroy.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::destroy
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:148
 * @route '/settings/certificates/{design}'
 */
destroy.delete = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::destroy
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:148
 * @route '/settings/certificates/{design}'
 */
    const destroyForm = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::destroy
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:148
 * @route '/settings/certificates/{design}'
 */
        destroyForm.delete = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Settings\CertificateDesignController::events
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:162
 * @route '/settings/certificates/{design}/events'
 */
export const events = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: events.url(args, options),
    method: 'get',
})

events.definition = {
    methods: ["get","head"],
    url: '/settings/certificates/{design}/events',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::events
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:162
 * @route '/settings/certificates/{design}/events'
 */
events.url = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return events.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::events
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:162
 * @route '/settings/certificates/{design}/events'
 */
events.get = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: events.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::events
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:162
 * @route '/settings/certificates/{design}/events'
 */
events.head = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: events.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::events
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:162
 * @route '/settings/certificates/{design}/events'
 */
    const eventsForm = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: events.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::events
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:162
 * @route '/settings/certificates/{design}/events'
 */
        eventsForm.get = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: events.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::events
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:162
 * @route '/settings/certificates/{design}/events'
 */
        eventsForm.head = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: events.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    events.form = eventsForm
/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::use
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:185
 * @route '/settings/certificates/{design}/events'
 */
export const use = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: use.url(args, options),
    method: 'post',
})

use.definition = {
    methods: ["post"],
    url: '/settings/certificates/{design}/events',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::use
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:185
 * @route '/settings/certificates/{design}/events'
 */
use.url = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { design: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { design: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    design: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        design: typeof args.design === 'object'
                ? args.design.id
                : args.design,
                }

    return use.definition.url
            .replace('{design}', parsedArgs.design.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateDesignController::use
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:185
 * @route '/settings/certificates/{design}/events'
 */
use.post = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: use.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::use
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:185
 * @route '/settings/certificates/{design}/events'
 */
    const useForm = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: use.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateDesignController::use
 * @see app/Http/Controllers/Settings/CertificateDesignController.php:185
 * @route '/settings/certificates/{design}/events'
 */
        useForm.post = (args: { design: string | { id: string } } | [design: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: use.url(args, options),
            method: 'post',
        })
    
    use.form = useForm
const CertificateDesignController = { index, create, store, show, update, duplicate, pair, destroy, events, use }

export default CertificateDesignController