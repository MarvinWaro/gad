import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EventCheckInController::index
 * @see app/Http/Controllers/Admin/EventCheckInController.php:27
 * @route '/admin/events/{event}/check-ins'
 */
export const index = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/events/{event}/check-ins',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EventCheckInController::index
 * @see app/Http/Controllers/Admin/EventCheckInController.php:27
 * @route '/admin/events/{event}/check-ins'
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
* @see \App\Http\Controllers\Admin\EventCheckInController::index
 * @see app/Http/Controllers/Admin/EventCheckInController.php:27
 * @route '/admin/events/{event}/check-ins'
 */
index.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EventCheckInController::index
 * @see app/Http/Controllers/Admin/EventCheckInController.php:27
 * @route '/admin/events/{event}/check-ins'
 */
index.head = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EventCheckInController::index
 * @see app/Http/Controllers/Admin/EventCheckInController.php:27
 * @route '/admin/events/{event}/check-ins'
 */
    const indexForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EventCheckInController::index
 * @see app/Http/Controllers/Admin/EventCheckInController.php:27
 * @route '/admin/events/{event}/check-ins'
 */
        indexForm.get = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EventCheckInController::index
 * @see app/Http/Controllers/Admin/EventCheckInController.php:27
 * @route '/admin/events/{event}/check-ins'
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
* @see \App\Http\Controllers\Admin\EventCheckInController::store
 * @see app/Http/Controllers/Admin/EventCheckInController.php:39
 * @route '/admin/events/{event}/check-ins'
 */
export const store = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/events/{event}/check-ins',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EventCheckInController::store
 * @see app/Http/Controllers/Admin/EventCheckInController.php:39
 * @route '/admin/events/{event}/check-ins'
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
* @see \App\Http\Controllers\Admin\EventCheckInController::store
 * @see app/Http/Controllers/Admin/EventCheckInController.php:39
 * @route '/admin/events/{event}/check-ins'
 */
store.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EventCheckInController::store
 * @see app/Http/Controllers/Admin/EventCheckInController.php:39
 * @route '/admin/events/{event}/check-ins'
 */
    const storeForm = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventCheckInController::store
 * @see app/Http/Controllers/Admin/EventCheckInController.php:39
 * @route '/admin/events/{event}/check-ins'
 */
        storeForm.post = (args: { event: number | { id: number } } | [event: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\EventCheckInController::destroy
 * @see app/Http/Controllers/Admin/EventCheckInController.php:54
 * @route '/admin/events/{event}/check-ins/{checkIn}'
 */
export const destroy = (args: { event: number | { id: number }, checkIn: string | { id: string } } | [event: number | { id: number }, checkIn: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/events/{event}/check-ins/{checkIn}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\EventCheckInController::destroy
 * @see app/Http/Controllers/Admin/EventCheckInController.php:54
 * @route '/admin/events/{event}/check-ins/{checkIn}'
 */
destroy.url = (args: { event: number | { id: number }, checkIn: string | { id: string } } | [event: number | { id: number }, checkIn: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                    checkIn: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                                checkIn: typeof args.checkIn === 'object'
                ? args.checkIn.id
                : args.checkIn,
                }

    return destroy.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace('{checkIn}', parsedArgs.checkIn.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventCheckInController::destroy
 * @see app/Http/Controllers/Admin/EventCheckInController.php:54
 * @route '/admin/events/{event}/check-ins/{checkIn}'
 */
destroy.delete = (args: { event: number | { id: number }, checkIn: string | { id: string } } | [event: number | { id: number }, checkIn: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\EventCheckInController::destroy
 * @see app/Http/Controllers/Admin/EventCheckInController.php:54
 * @route '/admin/events/{event}/check-ins/{checkIn}'
 */
    const destroyForm = (args: { event: number | { id: number }, checkIn: string | { id: string } } | [event: number | { id: number }, checkIn: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventCheckInController::destroy
 * @see app/Http/Controllers/Admin/EventCheckInController.php:54
 * @route '/admin/events/{event}/check-ins/{checkIn}'
 */
        destroyForm.delete = (args: { event: number | { id: number }, checkIn: string | { id: string } } | [event: number | { id: number }, checkIn: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const checkIns = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
destroy: Object.assign(destroy, destroy),
}

export default checkIns