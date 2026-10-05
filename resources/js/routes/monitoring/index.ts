import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\MonitoringController::records
 * @see app/Http/Controllers/MonitoringController.php:73
 * @route '/records'
 */
export const records = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: records.url(options),
    method: 'get',
})

records.definition = {
    methods: ["get","head"],
    url: '/records',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MonitoringController::records
 * @see app/Http/Controllers/MonitoringController.php:73
 * @route '/records'
 */
records.url = (options?: RouteQueryOptions) => {
    return records.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::records
 * @see app/Http/Controllers/MonitoringController.php:73
 * @route '/records'
 */
records.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: records.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MonitoringController::records
 * @see app/Http/Controllers/MonitoringController.php:73
 * @route '/records'
 */
records.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: records.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MonitoringController::records
 * @see app/Http/Controllers/MonitoringController.php:73
 * @route '/records'
 */
    const recordsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: records.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::records
 * @see app/Http/Controllers/MonitoringController.php:73
 * @route '/records'
 */
        recordsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: records.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MonitoringController::records
 * @see app/Http/Controllers/MonitoringController.php:73
 * @route '/records'
 */
        recordsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: records.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    records.form = recordsForm
/**
* @see \App\Http\Controllers\MonitoringController::create
 * @see app/Http/Controllers/MonitoringController.php:33
 * @route '/monitoring'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/monitoring',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MonitoringController::create
 * @see app/Http/Controllers/MonitoringController.php:33
 * @route '/monitoring'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::create
 * @see app/Http/Controllers/MonitoringController.php:33
 * @route '/monitoring'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MonitoringController::create
 * @see app/Http/Controllers/MonitoringController.php:33
 * @route '/monitoring'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MonitoringController::create
 * @see app/Http/Controllers/MonitoringController.php:33
 * @route '/monitoring'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::create
 * @see app/Http/Controllers/MonitoringController.php:33
 * @route '/monitoring'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MonitoringController::create
 * @see app/Http/Controllers/MonitoringController.php:33
 * @route '/monitoring'
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
* @see \App\Http\Controllers\MonitoringController::store
 * @see app/Http/Controllers/MonitoringController.php:60
 * @route '/monitoring'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/monitoring',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MonitoringController::store
 * @see app/Http/Controllers/MonitoringController.php:60
 * @route '/monitoring'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::store
 * @see app/Http/Controllers/MonitoringController.php:60
 * @route '/monitoring'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MonitoringController::store
 * @see app/Http/Controllers/MonitoringController.php:60
 * @route '/monitoring'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::store
 * @see app/Http/Controllers/MonitoringController.php:60
 * @route '/monitoring'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\MonitoringController::show
 * @see app/Http/Controllers/MonitoringController.php:99
 * @route '/monitoring/{report}'
 */
export const show = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/monitoring/{report}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MonitoringController::show
 * @see app/Http/Controllers/MonitoringController.php:99
 * @route '/monitoring/{report}'
 */
show.url = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { report: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    report: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        report: typeof args.report === 'object'
                ? args.report.id
                : args.report,
                }

    return show.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::show
 * @see app/Http/Controllers/MonitoringController.php:99
 * @route '/monitoring/{report}'
 */
show.get = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MonitoringController::show
 * @see app/Http/Controllers/MonitoringController.php:99
 * @route '/monitoring/{report}'
 */
show.head = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MonitoringController::show
 * @see app/Http/Controllers/MonitoringController.php:99
 * @route '/monitoring/{report}'
 */
    const showForm = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::show
 * @see app/Http/Controllers/MonitoringController.php:99
 * @route '/monitoring/{report}'
 */
        showForm.get = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MonitoringController::show
 * @see app/Http/Controllers/MonitoringController.php:99
 * @route '/monitoring/{report}'
 */
        showForm.head = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\MonitoringController::draft
 * @see app/Http/Controllers/MonitoringController.php:127
 * @route '/monitoring/{report}/draft'
 */
export const draft = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: draft.url(args, options),
    method: 'patch',
})

draft.definition = {
    methods: ["patch"],
    url: '/monitoring/{report}/draft',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\MonitoringController::draft
 * @see app/Http/Controllers/MonitoringController.php:127
 * @route '/monitoring/{report}/draft'
 */
draft.url = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { report: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    report: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        report: typeof args.report === 'object'
                ? args.report.id
                : args.report,
                }

    return draft.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::draft
 * @see app/Http/Controllers/MonitoringController.php:127
 * @route '/monitoring/{report}/draft'
 */
draft.patch = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: draft.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\MonitoringController::draft
 * @see app/Http/Controllers/MonitoringController.php:127
 * @route '/monitoring/{report}/draft'
 */
    const draftForm = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: draft.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::draft
 * @see app/Http/Controllers/MonitoringController.php:127
 * @route '/monitoring/{report}/draft'
 */
        draftForm.patch = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: draft.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    draft.form = draftForm
/**
* @see \App\Http\Controllers\MonitoringController::finalize
 * @see app/Http/Controllers/MonitoringController.php:135
 * @route '/monitoring/{report}/finalize'
 */
export const finalize = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: finalize.url(args, options),
    method: 'post',
})

finalize.definition = {
    methods: ["post"],
    url: '/monitoring/{report}/finalize',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MonitoringController::finalize
 * @see app/Http/Controllers/MonitoringController.php:135
 * @route '/monitoring/{report}/finalize'
 */
finalize.url = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { report: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    report: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        report: typeof args.report === 'object'
                ? args.report.id
                : args.report,
                }

    return finalize.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::finalize
 * @see app/Http/Controllers/MonitoringController.php:135
 * @route '/monitoring/{report}/finalize'
 */
finalize.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: finalize.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MonitoringController::finalize
 * @see app/Http/Controllers/MonitoringController.php:135
 * @route '/monitoring/{report}/finalize'
 */
    const finalizeForm = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: finalize.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::finalize
 * @see app/Http/Controllers/MonitoringController.php:135
 * @route '/monitoring/{report}/finalize'
 */
        finalizeForm.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: finalize.url(args, options),
            method: 'post',
        })
    
    finalize.form = finalizeForm
/**
* @see \App\Http\Controllers\MonitoringController::reopen
 * @see app/Http/Controllers/MonitoringController.php:145
 * @route '/monitoring/{report}/reopen'
 */
export const reopen = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reopen.url(args, options),
    method: 'post',
})

reopen.definition = {
    methods: ["post"],
    url: '/monitoring/{report}/reopen',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MonitoringController::reopen
 * @see app/Http/Controllers/MonitoringController.php:145
 * @route '/monitoring/{report}/reopen'
 */
reopen.url = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { report: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    report: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        report: typeof args.report === 'object'
                ? args.report.id
                : args.report,
                }

    return reopen.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::reopen
 * @see app/Http/Controllers/MonitoringController.php:145
 * @route '/monitoring/{report}/reopen'
 */
reopen.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reopen.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MonitoringController::reopen
 * @see app/Http/Controllers/MonitoringController.php:145
 * @route '/monitoring/{report}/reopen'
 */
    const reopenForm = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reopen.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::reopen
 * @see app/Http/Controllers/MonitoringController.php:145
 * @route '/monitoring/{report}/reopen'
 */
        reopenForm.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reopen.url(args, options),
            method: 'post',
        })
    
    reopen.form = reopenForm
/**
* @see \App\Http\Controllers\MonitoringController::submit
 * @see app/Http/Controllers/MonitoringController.php:155
 * @route '/monitoring/{report}/submit'
 */
export const submit = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

submit.definition = {
    methods: ["post"],
    url: '/monitoring/{report}/submit',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MonitoringController::submit
 * @see app/Http/Controllers/MonitoringController.php:155
 * @route '/monitoring/{report}/submit'
 */
submit.url = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { report: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    report: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        report: typeof args.report === 'object'
                ? args.report.id
                : args.report,
                }

    return submit.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::submit
 * @see app/Http/Controllers/MonitoringController.php:155
 * @route '/monitoring/{report}/submit'
 */
submit.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submit.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\MonitoringController::submit
 * @see app/Http/Controllers/MonitoringController.php:155
 * @route '/monitoring/{report}/submit'
 */
    const submitForm = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: submit.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::submit
 * @see app/Http/Controllers/MonitoringController.php:155
 * @route '/monitoring/{report}/submit'
 */
        submitForm.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: submit.url(args, options),
            method: 'post',
        })
    
    submit.form = submitForm
/**
* @see \App\Http\Controllers\MonitoringController::attachment
 * @see app/Http/Controllers/MonitoringController.php:166
 * @route '/monitoring/{report}/revisions/{revision}/attachment'
 */
export const attachment = (args: { report: string | { id: string }, revision: string | { id: string } } | [report: string | { id: string }, revision: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attachment.url(args, options),
    method: 'get',
})

attachment.definition = {
    methods: ["get","head"],
    url: '/monitoring/{report}/revisions/{revision}/attachment',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MonitoringController::attachment
 * @see app/Http/Controllers/MonitoringController.php:166
 * @route '/monitoring/{report}/revisions/{revision}/attachment'
 */
attachment.url = (args: { report: string | { id: string }, revision: string | { id: string } } | [report: string | { id: string }, revision: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    report: args[0],
                    revision: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        report: typeof args.report === 'object'
                ? args.report.id
                : args.report,
                                revision: typeof args.revision === 'object'
                ? args.revision.id
                : args.revision,
                }

    return attachment.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace('{revision}', parsedArgs.revision.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\MonitoringController::attachment
 * @see app/Http/Controllers/MonitoringController.php:166
 * @route '/monitoring/{report}/revisions/{revision}/attachment'
 */
attachment.get = (args: { report: string | { id: string }, revision: string | { id: string } } | [report: string | { id: string }, revision: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: attachment.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MonitoringController::attachment
 * @see app/Http/Controllers/MonitoringController.php:166
 * @route '/monitoring/{report}/revisions/{revision}/attachment'
 */
attachment.head = (args: { report: string | { id: string }, revision: string | { id: string } } | [report: string | { id: string }, revision: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: attachment.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MonitoringController::attachment
 * @see app/Http/Controllers/MonitoringController.php:166
 * @route '/monitoring/{report}/revisions/{revision}/attachment'
 */
    const attachmentForm = (args: { report: string | { id: string }, revision: string | { id: string } } | [report: string | { id: string }, revision: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: attachment.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MonitoringController::attachment
 * @see app/Http/Controllers/MonitoringController.php:166
 * @route '/monitoring/{report}/revisions/{revision}/attachment'
 */
        attachmentForm.get = (args: { report: string | { id: string }, revision: string | { id: string } } | [report: string | { id: string }, revision: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: attachment.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MonitoringController::attachment
 * @see app/Http/Controllers/MonitoringController.php:166
 * @route '/monitoring/{report}/revisions/{revision}/attachment'
 */
        attachmentForm.head = (args: { report: string | { id: string }, revision: string | { id: string } } | [report: string | { id: string }, revision: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: attachment.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    attachment.form = attachmentForm
const monitoring = {
    records: Object.assign(records, records),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
draft: Object.assign(draft, draft),
finalize: Object.assign(finalize, finalize),
reopen: Object.assign(reopen, reopen),
submit: Object.assign(submit, submit),
attachment: Object.assign(attachment, attachment),
}

export default monitoring