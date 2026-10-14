import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PublicEventController::index
 * @see app/Http/Controllers/PublicEventController.php:23
 * @route '/gad-events'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/gad-events',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicEventController::index
 * @see app/Http/Controllers/PublicEventController.php:23
 * @route '/gad-events'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicEventController::index
 * @see app/Http/Controllers/PublicEventController.php:23
 * @route '/gad-events'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PublicEventController::index
 * @see app/Http/Controllers/PublicEventController.php:23
 * @route '/gad-events'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PublicEventController::index
 * @see app/Http/Controllers/PublicEventController.php:23
 * @route '/gad-events'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PublicEventController::index
 * @see app/Http/Controllers/PublicEventController.php:23
 * @route '/gad-events'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PublicEventController::index
 * @see app/Http/Controllers/PublicEventController.php:23
 * @route '/gad-events'
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
* @see \App\Http\Controllers\PublicEventController::show
 * @see app/Http/Controllers/PublicEventController.php:40
 * @route '/gad-events/{event}'
 */
export const show = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/gad-events/{event}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicEventController::show
 * @see app/Http/Controllers/PublicEventController.php:40
 * @route '/gad-events/{event}'
 */
show.url = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicEventController::show
 * @see app/Http/Controllers/PublicEventController.php:40
 * @route '/gad-events/{event}'
 */
show.get = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PublicEventController::show
 * @see app/Http/Controllers/PublicEventController.php:40
 * @route '/gad-events/{event}'
 */
show.head = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PublicEventController::show
 * @see app/Http/Controllers/PublicEventController.php:40
 * @route '/gad-events/{event}'
 */
    const showForm = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PublicEventController::show
 * @see app/Http/Controllers/PublicEventController.php:40
 * @route '/gad-events/{event}'
 */
        showForm.get = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PublicEventController::show
 * @see app/Http/Controllers/PublicEventController.php:40
 * @route '/gad-events/{event}'
 */
        showForm.head = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const publicEvents = {
    index: Object.assign(index, index),
show: Object.assign(show, show),
}

export default publicEvents