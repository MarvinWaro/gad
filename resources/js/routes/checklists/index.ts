import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ChecklistController::show
 * @see app/Http/Controllers/ChecklistController.php:21
 * @route '/records/{type}'
 */
export const show = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/records/{type}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ChecklistController::show
 * @see app/Http/Controllers/ChecklistController.php:21
 * @route '/records/{type}'
 */
show.url = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { type: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                }

    return show.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChecklistController::show
 * @see app/Http/Controllers/ChecklistController.php:21
 * @route '/records/{type}'
 */
show.get = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ChecklistController::show
 * @see app/Http/Controllers/ChecklistController.php:21
 * @route '/records/{type}'
 */
show.head = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ChecklistController::show
 * @see app/Http/Controllers/ChecklistController.php:21
 * @route '/records/{type}'
 */
    const showForm = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ChecklistController::show
 * @see app/Http/Controllers/ChecklistController.php:21
 * @route '/records/{type}'
 */
        showForm.get = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ChecklistController::show
 * @see app/Http/Controllers/ChecklistController.php:21
 * @route '/records/{type}'
 */
        showForm.head = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\ChecklistController::store
 * @see app/Http/Controllers/ChecklistController.php:49
 * @route '/records/{type}'
 */
export const store = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/records/{type}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\ChecklistController::store
 * @see app/Http/Controllers/ChecklistController.php:49
 * @route '/records/{type}'
 */
store.url = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { type: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                }

    return store.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\ChecklistController::store
 * @see app/Http/Controllers/ChecklistController.php:49
 * @route '/records/{type}'
 */
store.post = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\ChecklistController::store
 * @see app/Http/Controllers/ChecklistController.php:49
 * @route '/records/{type}'
 */
    const storeForm = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\ChecklistController::store
 * @see app/Http/Controllers/ChecklistController.php:49
 * @route '/records/{type}'
 */
        storeForm.post = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const checklists = {
    show: Object.assign(show, show),
store: Object.assign(store, store),
}

export default checklists