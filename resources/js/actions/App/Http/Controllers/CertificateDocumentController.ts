import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CertificateDocumentController::show
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
export const show = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/certificates/{certificate}/document',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CertificateDocumentController::show
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
show.url = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { certificate: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { certificate: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    certificate: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        certificate: typeof args.certificate === 'object'
                ? args.certificate.id
                : args.certificate,
                }

    return show.definition.url
            .replace('{certificate}', parsedArgs.certificate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateDocumentController::show
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
show.get = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CertificateDocumentController::show
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
show.head = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CertificateDocumentController::show
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
    const showForm = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CertificateDocumentController::show
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
        showForm.get = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CertificateDocumentController::show
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
        showForm.head = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const CertificateDocumentController = { show }

export default CertificateDocumentController