import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
import certificates from './certificates'
/**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:25
 * @route '/admin/events/{event}/guests'
 */
export const store = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/events/{event}/guests',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:25
 * @route '/admin/events/{event}/guests'
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
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:25
 * @route '/admin/events/{event}/guests'
 */
store.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:25
 * @route '/admin/events/{event}/guests'
 */
    const storeForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:25
 * @route '/admin/events/{event}/guests'
 */
        storeForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\EventGuestController::update
 * @see app/Http/Controllers/Admin/EventGuestController.php:36
 * @route '/admin/events/{event}/guests/{guest}'
 */
export const update = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/events/{event}/guests/{guest}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\EventGuestController::update
 * @see app/Http/Controllers/Admin/EventGuestController.php:36
 * @route '/admin/events/{event}/guests/{guest}'
 */
update.url = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                    guest: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                                guest: typeof args.guest === 'object'
                ? args.guest.id
                : args.guest,
                }

    return update.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace('{guest}', parsedArgs.guest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventGuestController::update
 * @see app/Http/Controllers/Admin/EventGuestController.php:36
 * @route '/admin/events/{event}/guests/{guest}'
 */
update.put = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\EventGuestController::update
 * @see app/Http/Controllers/Admin/EventGuestController.php:36
 * @route '/admin/events/{event}/guests/{guest}'
 */
    const updateForm = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventGuestController::update
 * @see app/Http/Controllers/Admin/EventGuestController.php:36
 * @route '/admin/events/{event}/guests/{guest}'
 */
        updateForm.put = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\EventGuestController::destroy
 * @see app/Http/Controllers/Admin/EventGuestController.php:48
 * @route '/admin/events/{event}/guests/{guest}'
 */
export const destroy = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/events/{event}/guests/{guest}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\EventGuestController::destroy
 * @see app/Http/Controllers/Admin/EventGuestController.php:48
 * @route '/admin/events/{event}/guests/{guest}'
 */
destroy.url = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                    guest: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                                guest: typeof args.guest === 'object'
                ? args.guest.id
                : args.guest,
                }

    return destroy.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace('{guest}', parsedArgs.guest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventGuestController::destroy
 * @see app/Http/Controllers/Admin/EventGuestController.php:48
 * @route '/admin/events/{event}/guests/{guest}'
 */
destroy.delete = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\EventGuestController::destroy
 * @see app/Http/Controllers/Admin/EventGuestController.php:48
 * @route '/admin/events/{event}/guests/{guest}'
 */
    const destroyForm = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventGuestController::destroy
 * @see app/Http/Controllers/Admin/EventGuestController.php:48
 * @route '/admin/events/{event}/guests/{guest}'
 */
        destroyForm.delete = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const guests = {
    store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
certificates: Object.assign(certificates, certificates),
}

export default guests