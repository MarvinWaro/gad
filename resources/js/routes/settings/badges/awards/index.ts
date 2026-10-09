import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:190
 * @route '/settings/badges/{badge}/awards'
 */
export const store = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/badges/{badge}/awards',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:190
 * @route '/settings/badges/{badge}/awards'
 */
store.url = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:190
 * @route '/settings/badges/{badge}/awards'
 */
store.post = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:190
 * @route '/settings/badges/{badge}/awards'
 */
    const storeForm = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\BadgeController::store
 * @see app/Http/Controllers/Settings/BadgeController.php:190
 * @route '/settings/badges/{badge}/awards'
 */
        storeForm.post = (args: { badge: string | { id: string } } | [badge: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:202
 * @route '/settings/badges/{badge}/awards/{award}'
 */
export const destroy = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/badges/{badge}/awards/{award}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:202
 * @route '/settings/badges/{badge}/awards/{award}'
 */
destroy.url = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{badge}', parsedArgs.badge.toString())
            .replace('{award}', parsedArgs.award.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:202
 * @route '/settings/badges/{badge}/awards/{award}'
 */
destroy.delete = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\BadgeController::destroy
 * @see app/Http/Controllers/Settings/BadgeController.php:202
 * @route '/settings/badges/{badge}/awards/{award}'
 */
    const destroyForm = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
 * @see app/Http/Controllers/Settings/BadgeController.php:202
 * @route '/settings/badges/{badge}/awards/{award}'
 */
        destroyForm.delete = (args: { badge: string | { id: string }, award: number | { id: number } } | [badge: string | { id: string }, award: number | { id: number } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const awards = {
    store: Object.assign(store, store),
destroy: Object.assign(destroy, destroy),
}

export default awards