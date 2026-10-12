import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\CertificateDocumentController::document
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
export const document = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: document.url(args, options),
    method: 'get',
})

document.definition = {
    methods: ["get","head"],
    url: '/certificates/{certificate}/document',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CertificateDocumentController::document
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
document.url = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return document.definition.url
            .replace('{certificate}', parsedArgs.certificate.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateDocumentController::document
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
document.get = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: document.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CertificateDocumentController::document
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
document.head = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: document.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CertificateDocumentController::document
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
    const documentForm = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: document.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CertificateDocumentController::document
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
        documentForm.get = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: document.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CertificateDocumentController::document
 * @see app/Http/Controllers/CertificateDocumentController.php:20
 * @route '/certificates/{certificate}/document'
 */
        documentForm.head = (args: { certificate: string | { id: string } } | [certificate: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: document.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    document.form = documentForm
const certificates = {
    document: Object.assign(document, document),
}

export default certificates