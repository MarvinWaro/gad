import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\CertificateVerificationController::index
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/verify',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CertificateVerificationController::index
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateVerificationController::index
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CertificateVerificationController::index
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CertificateVerificationController::index
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CertificateVerificationController::index
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CertificateVerificationController::index
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
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
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
export const show = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/verify/{number}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
show.url = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { number: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    number: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        number: args.number,
                }

    return show.definition.url
            .replace('{number}', parsedArgs.number.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
show.get = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
show.head = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
    const showForm = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
        showForm.get = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
        showForm.head = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const verify = {
    index: Object.assign(index, index),
show: Object.assign(show, show),
}

export default verify