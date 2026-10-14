import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
const requests = {
    update: Object.assign(update, update),
}

export default requests