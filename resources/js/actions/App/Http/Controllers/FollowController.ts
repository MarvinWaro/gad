import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\FollowController::store
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
export const store = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/people/{person}/follow',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FollowController::store
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
store.url = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { person: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { person: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    person: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        person: typeof args.person === 'object'
                ? args.person.id
                : args.person,
                }

    return store.definition.url
            .replace('{person}', parsedArgs.person.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FollowController::store
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
store.post = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\FollowController::store
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
    const storeForm = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FollowController::store
 * @see app/Http/Controllers/FollowController.php:17
 * @route '/people/{person}/follow'
 */
        storeForm.post = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\FollowController::destroy
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
export const destroy = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/people/{person}/follow',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\FollowController::destroy
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
destroy.url = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { person: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { person: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    person: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        person: typeof args.person === 'object'
                ? args.person.id
                : args.person,
                }

    return destroy.definition.url
            .replace('{person}', parsedArgs.person.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FollowController::destroy
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
destroy.delete = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\FollowController::destroy
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
    const destroyForm = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FollowController::destroy
 * @see app/Http/Controllers/FollowController.php:28
 * @route '/people/{person}/follow'
 */
        destroyForm.delete = (args: { person: number | { id: number } } | [person: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const FollowController = { store, destroy }

export default FollowController