import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CertificateRequestController::store
 * @see app/Http/Controllers/CertificateRequestController.php:22
 * @route '/events/{event}/certificate-requests'
 */
export const store = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/events/{event}/certificate-requests',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\CertificateRequestController::store
 * @see app/Http/Controllers/CertificateRequestController.php:22
 * @route '/events/{event}/certificate-requests'
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
* @see \App\Http\Controllers\CertificateRequestController::store
 * @see app/Http/Controllers/CertificateRequestController.php:22
 * @route '/events/{event}/certificate-requests'
 */
store.post = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\CertificateRequestController::store
 * @see app/Http/Controllers/CertificateRequestController.php:22
 * @route '/events/{event}/certificate-requests'
 */
    const storeForm = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CertificateRequestController::store
 * @see app/Http/Controllers/CertificateRequestController.php:22
 * @route '/events/{event}/certificate-requests'
 */
        storeForm.post = (args: { event: string | { ulid: string } } | [event: string | { ulid: string } ] | string | { ulid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\CertificateRequestController::update
 * @see app/Http/Controllers/CertificateRequestController.php:34
 * @route '/settings/event-certificates/{eventCertificate}/requests/{certificateRequest}'
 */
export const update = (args: { eventCertificate: string | { id: string }, certificateRequest: string | { id: string } } | [eventCertificate: string | { id: string }, certificateRequest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/event-certificates/{eventCertificate}/requests/{certificateRequest}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\CertificateRequestController::update
 * @see app/Http/Controllers/CertificateRequestController.php:34
 * @route '/settings/event-certificates/{eventCertificate}/requests/{certificateRequest}'
 */
update.url = (args: { eventCertificate: string | { id: string }, certificateRequest: string | { id: string } } | [eventCertificate: string | { id: string }, certificateRequest: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    eventCertificate: args[0],
                    certificateRequest: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        eventCertificate: typeof args.eventCertificate === 'object'
                ? args.eventCertificate.id
                : args.eventCertificate,
                                certificateRequest: typeof args.certificateRequest === 'object'
                ? args.certificateRequest.id
                : args.certificateRequest,
                }

    return update.definition.url
            .replace('{eventCertificate}', parsedArgs.eventCertificate.toString())
            .replace('{certificateRequest}', parsedArgs.certificateRequest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateRequestController::update
 * @see app/Http/Controllers/CertificateRequestController.php:34
 * @route '/settings/event-certificates/{eventCertificate}/requests/{certificateRequest}'
 */
update.put = (args: { eventCertificate: string | { id: string }, certificateRequest: string | { id: string } } | [eventCertificate: string | { id: string }, certificateRequest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\CertificateRequestController::update
 * @see app/Http/Controllers/CertificateRequestController.php:34
 * @route '/settings/event-certificates/{eventCertificate}/requests/{certificateRequest}'
 */
    const updateForm = (args: { eventCertificate: string | { id: string }, certificateRequest: string | { id: string } } | [eventCertificate: string | { id: string }, certificateRequest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\CertificateRequestController::update
 * @see app/Http/Controllers/CertificateRequestController.php:34
 * @route '/settings/event-certificates/{eventCertificate}/requests/{certificateRequest}'
 */
        updateForm.put = (args: { eventCertificate: string | { id: string }, certificateRequest: string | { id: string } } | [eventCertificate: string | { id: string }, certificateRequest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const CertificateRequestController = { store, update }

export default CertificateRequestController