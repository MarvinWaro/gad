import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\EventRegistrationController::store
 * @see app/Http/Controllers/EventRegistrationController.php:18
 * @route '/events/{event}/registration'
 */
export const store = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/events/{event}/registration',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\EventRegistrationController::store
 * @see app/Http/Controllers/EventRegistrationController.php:18
 * @route '/events/{event}/registration'
 */
store.url = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'ulid' in args) {
            args = { event: args.ulid }
        }
    
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.ulid
                : args.event,
                }

    return store.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventRegistrationController::store
 * @see app/Http/Controllers/EventRegistrationController.php:18
 * @route '/events/{event}/registration'
 */
store.post = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\EventRegistrationController::store
 * @see app/Http/Controllers/EventRegistrationController.php:18
 * @route '/events/{event}/registration'
 */
    const storeForm = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EventRegistrationController::store
 * @see app/Http/Controllers/EventRegistrationController.php:18
 * @route '/events/{event}/registration'
 */
        storeForm.post = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\EventRegistrationController::destroy
 * @see app/Http/Controllers/EventRegistrationController.php:29
 * @route '/events/{event}/registration'
 */
export const destroy = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/events/{event}/registration',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\EventRegistrationController::destroy
 * @see app/Http/Controllers/EventRegistrationController.php:29
 * @route '/events/{event}/registration'
 */
destroy.url = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { event: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'ulid' in args) {
            args = { event: args.ulid }
        }
    
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.ulid
                : args.event,
                }

    return destroy.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\EventRegistrationController::destroy
 * @see app/Http/Controllers/EventRegistrationController.php:29
 * @route '/events/{event}/registration'
 */
destroy.delete = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\EventRegistrationController::destroy
 * @see app/Http/Controllers/EventRegistrationController.php:29
 * @route '/events/{event}/registration'
 */
    const destroyForm = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\EventRegistrationController::destroy
 * @see app/Http/Controllers/EventRegistrationController.php:29
 * @route '/events/{event}/registration'
 */
        destroyForm.delete = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const EventRegistrationController = { store, destroy }

export default EventRegistrationController