import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
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
const certificateRequests = {
    store: Object.assign(store, store),
}

export default certificateRequests