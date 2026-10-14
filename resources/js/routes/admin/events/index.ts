import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import registrations from './registrations'
import registration from './registration'
import guests from './guests'
import cancellation from './cancellation'
import checkIns from './check-ins'
/**
* @see \App\Http\Controllers\Admin\GadEventController::index
 * @see app/Http/Controllers/Admin/GadEventController.php:22
 * @route '/admin/events'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/events',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\GadEventController::index
 * @see app/Http/Controllers/Admin/GadEventController.php:22
 * @route '/admin/events'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\GadEventController::index
 * @see app/Http/Controllers/Admin/GadEventController.php:22
 * @route '/admin/events'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\GadEventController::index
 * @see app/Http/Controllers/Admin/GadEventController.php:22
 * @route '/admin/events'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\GadEventController::index
 * @see app/Http/Controllers/Admin/GadEventController.php:22
 * @route '/admin/events'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\GadEventController::index
 * @see app/Http/Controllers/Admin/GadEventController.php:22
 * @route '/admin/events'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\GadEventController::index
 * @see app/Http/Controllers/Admin/GadEventController.php:22
 * @route '/admin/events'
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
* @see \App\Http\Controllers\Admin\GadEventController::store
 * @see app/Http/Controllers/Admin/GadEventController.php:80
 * @route '/admin/events'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/events',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\GadEventController::store
 * @see app/Http/Controllers/Admin/GadEventController.php:80
 * @route '/admin/events'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\GadEventController::store
 * @see app/Http/Controllers/Admin/GadEventController.php:80
 * @route '/admin/events'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\GadEventController::store
 * @see app/Http/Controllers/Admin/GadEventController.php:80
 * @route '/admin/events'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\GadEventController::store
 * @see app/Http/Controllers/Admin/GadEventController.php:80
 * @route '/admin/events'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\GadEventController::update
 * @see app/Http/Controllers/Admin/GadEventController.php:93
 * @route '/admin/events/{event}'
 */
export const update = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/events/{event}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\GadEventController::update
 * @see app/Http/Controllers/Admin/GadEventController.php:93
 * @route '/admin/events/{event}'
 */
update.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return update.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\GadEventController::update
 * @see app/Http/Controllers/Admin/GadEventController.php:93
 * @route '/admin/events/{event}'
 */
update.put = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\GadEventController::update
 * @see app/Http/Controllers/Admin/GadEventController.php:93
 * @route '/admin/events/{event}'
 */
    const updateForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\GadEventController::update
 * @see app/Http/Controllers/Admin/GadEventController.php:93
 * @route '/admin/events/{event}'
 */
        updateForm.put = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\GadEventController::destroy
 * @see app/Http/Controllers/Admin/GadEventController.php:104
 * @route '/admin/events/{event}'
 */
export const destroy = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/events/{event}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\GadEventController::destroy
 * @see app/Http/Controllers/Admin/GadEventController.php:104
 * @route '/admin/events/{event}'
 */
destroy.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\GadEventController::destroy
 * @see app/Http/Controllers/Admin/GadEventController.php:104
 * @route '/admin/events/{event}'
 */
destroy.delete = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\GadEventController::destroy
 * @see app/Http/Controllers/Admin/GadEventController.php:104
 * @route '/admin/events/{event}'
 */
    const destroyForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\GadEventController::destroy
 * @see app/Http/Controllers/Admin/GadEventController.php:104
 * @route '/admin/events/{event}'
 */
        destroyForm.delete = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EventRegistrationController::people
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:129
 * @route '/admin/events/{event}/people'
 */
export const people = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: people.url(args, options),
    method: 'get',
})

people.definition = {
    methods: ["get","head"],
    url: '/admin/events/{event}/people',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::people
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:129
 * @route '/admin/events/{event}/people'
 */
people.url = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return people.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::people
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:129
 * @route '/admin/events/{event}/people'
 */
people.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: people.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EventRegistrationController::people
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:129
 * @route '/admin/events/{event}/people'
 */
people.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: people.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::people
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:129
 * @route '/admin/events/{event}/people'
 */
    const peopleForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: people.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::people
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:129
 * @route '/admin/events/{event}/people'
 */
        peopleForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: people.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EventRegistrationController::people
 * @see app/Http/Controllers/Admin/EventRegistrationController.php:129
 * @route '/admin/events/{event}/people'
 */
        peopleForm.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: people.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    people.form = peopleForm
const events = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
registrations: Object.assign(registrations, registrations),
registration: Object.assign(registration, registration),
people: Object.assign(people, people),
guests: Object.assign(guests, guests),
cancellation: Object.assign(cancellation, cancellation),
checkIns: Object.assign(checkIns, checkIns),
}

export default events