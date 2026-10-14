import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
import requests from './requests'
/**
* @see \App\Http\Controllers\Settings\EventCertificateController::show
 * @see app/Http/Controllers/Settings/EventCertificateController.php:35
 * @route '/settings/event-certificates/{eventCertificate}'
 */
export const show = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/settings/event-certificates/{eventCertificate}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::show
 * @see app/Http/Controllers/Settings/EventCertificateController.php:35
 * @route '/settings/event-certificates/{eventCertificate}'
 */
show.url = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { eventCertificate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { eventCertificate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    eventCertificate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        eventCertificate: typeof args.eventCertificate === 'object'
                ? args.eventCertificate.id
                : args.eventCertificate,
                }

    return show.definition.url
            .replace('{eventCertificate}', parsedArgs.eventCertificate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::show
 * @see app/Http/Controllers/Settings/EventCertificateController.php:35
 * @route '/settings/event-certificates/{eventCertificate}'
 */
show.get = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\EventCertificateController::show
 * @see app/Http/Controllers/Settings/EventCertificateController.php:35
 * @route '/settings/event-certificates/{eventCertificate}'
 */
show.head = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\EventCertificateController::show
 * @see app/Http/Controllers/Settings/EventCertificateController.php:35
 * @route '/settings/event-certificates/{eventCertificate}'
 */
    const showForm = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\EventCertificateController::show
 * @see app/Http/Controllers/Settings/EventCertificateController.php:35
 * @route '/settings/event-certificates/{eventCertificate}'
 */
        showForm.get = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\EventCertificateController::show
 * @see app/Http/Controllers/Settings/EventCertificateController.php:35
 * @route '/settings/event-certificates/{eventCertificate}'
 */
        showForm.head = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Settings\EventCertificateController::destroy
 * @see app/Http/Controllers/Settings/EventCertificateController.php:102
 * @route '/settings/event-certificates/{eventCertificate}'
 */
export const destroy = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/event-certificates/{eventCertificate}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::destroy
 * @see app/Http/Controllers/Settings/EventCertificateController.php:102
 * @route '/settings/event-certificates/{eventCertificate}'
 */
destroy.url = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { eventCertificate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { eventCertificate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    eventCertificate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        eventCertificate: typeof args.eventCertificate === 'object'
                ? args.eventCertificate.id
                : args.eventCertificate,
                }

    return destroy.definition.url
            .replace('{eventCertificate}', parsedArgs.eventCertificate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::destroy
 * @see app/Http/Controllers/Settings/EventCertificateController.php:102
 * @route '/settings/event-certificates/{eventCertificate}'
 */
destroy.delete = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\EventCertificateController::destroy
 * @see app/Http/Controllers/Settings/EventCertificateController.php:102
 * @route '/settings/event-certificates/{eventCertificate}'
 */
    const destroyForm = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EventCertificateController::destroy
 * @see app/Http/Controllers/Settings/EventCertificateController.php:102
 * @route '/settings/event-certificates/{eventCertificate}'
 */
        destroyForm.delete = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Settings\EventCertificateController::release
 * @see app/Http/Controllers/Settings/EventCertificateController.php:112
 * @route '/settings/event-certificates/{eventCertificate}/release'
 */
export const release = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: release.url(args, options),
    method: 'post',
})

release.definition = {
    methods: ["post"],
    url: '/settings/event-certificates/{eventCertificate}/release',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::release
 * @see app/Http/Controllers/Settings/EventCertificateController.php:112
 * @route '/settings/event-certificates/{eventCertificate}/release'
 */
release.url = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { eventCertificate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { eventCertificate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    eventCertificate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        eventCertificate: typeof args.eventCertificate === 'object'
                ? args.eventCertificate.id
                : args.eventCertificate,
                }

    return release.definition.url
            .replace('{eventCertificate}', parsedArgs.eventCertificate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::release
 * @see app/Http/Controllers/Settings/EventCertificateController.php:112
 * @route '/settings/event-certificates/{eventCertificate}/release'
 */
release.post = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: release.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\EventCertificateController::release
 * @see app/Http/Controllers/Settings/EventCertificateController.php:112
 * @route '/settings/event-certificates/{eventCertificate}/release'
 */
    const releaseForm = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: release.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EventCertificateController::release
 * @see app/Http/Controllers/Settings/EventCertificateController.php:112
 * @route '/settings/event-certificates/{eventCertificate}/release'
 */
        releaseForm.post = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: release.url(args, options),
            method: 'post',
        })
    
    release.form = releaseForm
/**
* @see \App\Http\Controllers\Settings\EventCertificateController::refresh
 * @see app/Http/Controllers/Settings/EventCertificateController.php:127
 * @route '/settings/event-certificates/{eventCertificate}/refresh'
 */
export const refresh = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refresh.url(args, options),
    method: 'post',
})

refresh.definition = {
    methods: ["post"],
    url: '/settings/event-certificates/{eventCertificate}/refresh',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::refresh
 * @see app/Http/Controllers/Settings/EventCertificateController.php:127
 * @route '/settings/event-certificates/{eventCertificate}/refresh'
 */
refresh.url = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { eventCertificate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { eventCertificate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    eventCertificate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        eventCertificate: typeof args.eventCertificate === 'object'
                ? args.eventCertificate.id
                : args.eventCertificate,
                }

    return refresh.definition.url
            .replace('{eventCertificate}', parsedArgs.eventCertificate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::refresh
 * @see app/Http/Controllers/Settings/EventCertificateController.php:127
 * @route '/settings/event-certificates/{eventCertificate}/refresh'
 */
refresh.post = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: refresh.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\EventCertificateController::refresh
 * @see app/Http/Controllers/Settings/EventCertificateController.php:127
 * @route '/settings/event-certificates/{eventCertificate}/refresh'
 */
    const refreshForm = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: refresh.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EventCertificateController::refresh
 * @see app/Http/Controllers/Settings/EventCertificateController.php:127
 * @route '/settings/event-certificates/{eventCertificate}/refresh'
 */
        refreshForm.post = (args: { eventCertificate: string | { id: string } } | [eventCertificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: refresh.url(args, options),
            method: 'post',
        })
    
    refresh.form = refreshForm
/**
* @see \App\Http\Controllers\Settings\EventCertificateController::status
 * @see app/Http/Controllers/Settings/EventCertificateController.php:139
 * @route '/settings/event-certificates/{eventCertificate}/certificates/{certificate}/status'
 */
export const status = (args: { eventCertificate: string | { id: string }, certificate: string | { id: string } } | [eventCertificate: string | { id: string }, certificate: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: status.url(args, options),
    method: 'put',
})

status.definition = {
    methods: ["put"],
    url: '/settings/event-certificates/{eventCertificate}/certificates/{certificate}/status',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::status
 * @see app/Http/Controllers/Settings/EventCertificateController.php:139
 * @route '/settings/event-certificates/{eventCertificate}/certificates/{certificate}/status'
 */
status.url = (args: { eventCertificate: string | { id: string }, certificate: string | { id: string } } | [eventCertificate: string | { id: string }, certificate: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    eventCertificate: args[0],
                    certificate: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        eventCertificate: typeof args.eventCertificate === 'object'
                ? args.eventCertificate.id
                : args.eventCertificate,
                                certificate: typeof args.certificate === 'object'
                ? args.certificate.id
                : args.certificate,
                }

    return status.definition.url
            .replace('{eventCertificate}', parsedArgs.eventCertificate.toString())
            .replace('{certificate}', parsedArgs.certificate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\EventCertificateController::status
 * @see app/Http/Controllers/Settings/EventCertificateController.php:139
 * @route '/settings/event-certificates/{eventCertificate}/certificates/{certificate}/status'
 */
status.put = (args: { eventCertificate: string | { id: string }, certificate: string | { id: string } } | [eventCertificate: string | { id: string }, certificate: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: status.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\EventCertificateController::status
 * @see app/Http/Controllers/Settings/EventCertificateController.php:139
 * @route '/settings/event-certificates/{eventCertificate}/certificates/{certificate}/status'
 */
    const statusForm = (args: { eventCertificate: string | { id: string }, certificate: string | { id: string } } | [eventCertificate: string | { id: string }, certificate: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: status.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\EventCertificateController::status
 * @see app/Http/Controllers/Settings/EventCertificateController.php:139
 * @route '/settings/event-certificates/{eventCertificate}/certificates/{certificate}/status'
 */
        statusForm.put = (args: { eventCertificate: string | { id: string }, certificate: string | { id: string } } | [eventCertificate: string | { id: string }, certificate: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: status.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    status.form = statusForm
const eventCertificates = {
    show: Object.assign(show, show),
destroy: Object.assign(destroy, destroy),
release: Object.assign(release, release),
refresh: Object.assign(refresh, refresh),
status: Object.assign(status, status),
requests: Object.assign(requests, requests),
}

export default eventCertificates