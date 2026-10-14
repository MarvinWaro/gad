import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::index
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:44
 * @route '/admin/events/{event}/registrations'
 */
export const index = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/events/{event}/registrations',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::index
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:44
 * @route '/admin/events/{event}/registrations'
 */
index.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { event: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                }

    return index.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::index
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:44
 * @route '/admin/events/{event}/registrations'
 */
index.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::index
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:44
 * @route '/admin/events/{event}/registrations'
 */
index.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::index
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:44
 * @route '/admin/events/{event}/registrations'
 */
    const indexForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::index
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:44
 * @route '/admin/events/{event}/registrations'
 */
        indexForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::index
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:44
 * @route '/admin/events/{event}/registrations'
 */
        indexForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::store
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:140
 * @route '/admin/events/{event}/registrations'
 */
export const store = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/events/{event}/registrations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::store
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:140
 * @route '/admin/events/{event}/registrations'
 */
store.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { event: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                }

    return store.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::store
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:140
 * @route '/admin/events/{event}/registrations'
 */
store.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::store
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:140
 * @route '/admin/events/{event}/registrations'
 */
    const storeForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::store
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:140
 * @route '/admin/events/{event}/registrations'
 */
        storeForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::attendance
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:152
 * @route '/admin/events/{event}/registrations/{registration}/attendance'
 */
export const attendance = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: attendance.url(args, options),
    method: 'put',
})

attendance.definition = {
    methods: ["put"],
    url: '/admin/events/{event}/registrations/{registration}/attendance',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::attendance
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:152
 * @route '/admin/events/{event}/registrations/{registration}/attendance'
 */
attendance.url = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                    registration: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                                registration: typeof args.registration === 'object'
                ? args.registration.id
                : args.registration,
                }

    return attendance.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace('{registration}', parsedArgs.registration.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::attendance
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:152
 * @route '/admin/events/{event}/registrations/{registration}/attendance'
 */
attendance.put = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: attendance.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::attendance
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:152
 * @route '/admin/events/{event}/registrations/{registration}/attendance'
 */
    const attendanceForm = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: attendance.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::attendance
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:152
 * @route '/admin/events/{event}/registrations/{registration}/attendance'
 */
        attendanceForm.put = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: attendance.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    attendance.form = attendanceForm
/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::destroy
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:164
 * @route '/admin/events/{event}/registrations/{registration}'
 */
export const destroy = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/events/{event}/registrations/{registration}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::destroy
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:164
 * @route '/admin/events/{event}/registrations/{registration}'
 */
destroy.url = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                    registration: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                                registration: typeof args.registration === 'object'
                ? args.registration.id
                : args.registration,
                }

    return destroy.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace('{registration}', parsedArgs.registration.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::destroy
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:164
 * @route '/admin/events/{event}/registrations/{registration}'
 */
destroy.delete = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::destroy
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:164
 * @route '/admin/events/{event}/registrations/{registration}'
 */
    const destroyForm = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::destroy
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:164
 * @route '/admin/events/{event}/registrations/{registration}'
 */
        destroyForm.delete = (args: { event: number | { id: number }, registration: string | { id: string } } | [event: number | { id: number }, registration: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const registrations = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
attendance: Object.assign(attendance, attendance),
destroy: Object.assign(destroy, destroy),
}

export default registrations