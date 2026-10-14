import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
const show3dfda2a7eb016fa54b667500c04a531e = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show3dfda2a7eb016fa54b667500c04a531e.url(options),
    method: 'get',
})

show3dfda2a7eb016fa54b667500c04a531e.definition = {
    methods: ["get","head"],
    url: '/verify',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
show3dfda2a7eb016fa54b667500c04a531e.url = (options?: RouteQueryOptions) => {
    return show3dfda2a7eb016fa54b667500c04a531e.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
show3dfda2a7eb016fa54b667500c04a531e.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show3dfda2a7eb016fa54b667500c04a531e.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
show3dfda2a7eb016fa54b667500c04a531e.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show3dfda2a7eb016fa54b667500c04a531e.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
    const show3dfda2a7eb016fa54b667500c04a531eForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show3dfda2a7eb016fa54b667500c04a531e.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
        show3dfda2a7eb016fa54b667500c04a531eForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show3dfda2a7eb016fa54b667500c04a531e.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify'
 */
        show3dfda2a7eb016fa54b667500c04a531eForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show3dfda2a7eb016fa54b667500c04a531e.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show3dfda2a7eb016fa54b667500c04a531e.form = show3dfda2a7eb016fa54b667500c04a531eForm
    /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
const show6304adffcc41b8a5c85472437db49dcc = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show6304adffcc41b8a5c85472437db49dcc.url(args, options),
    method: 'get',
})

show6304adffcc41b8a5c85472437db49dcc.definition = {
    methods: ["get","head"],
    url: '/verify/{number}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
show6304adffcc41b8a5c85472437db49dcc.url = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show6304adffcc41b8a5c85472437db49dcc.definition.url
            .replace('{number}', parsedArgs.number.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
show6304adffcc41b8a5c85472437db49dcc.get = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show6304adffcc41b8a5c85472437db49dcc.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
show6304adffcc41b8a5c85472437db49dcc.head = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show6304adffcc41b8a5c85472437db49dcc.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
    const show6304adffcc41b8a5c85472437db49dccForm = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show6304adffcc41b8a5c85472437db49dcc.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
        show6304adffcc41b8a5c85472437db49dccForm.get = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show6304adffcc41b8a5c85472437db49dcc.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CertificateVerificationController::show
 * @see app/Http/Controllers/CertificateVerificationController.php:20
 * @route '/verify/{number}'
 */
        show6304adffcc41b8a5c85472437db49dccForm.head = (args: { number: string | number } | [number: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show6304adffcc41b8a5c85472437db49dcc.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show6304adffcc41b8a5c85472437db49dcc.form = show6304adffcc41b8a5c85472437db49dccForm

/**
* Multiple routes resolve to \App\Http\Controllers\CertificateVerificationController::show, so this export is a
* dictionary keyed by URI rather than a callable. Call a specific route with `show['<uri>'](...)`,
* or import the route by name from your generated `routes/` directory.
*/
export const show = {
    '/verify': show3dfda2a7eb016fa54b667500c04a531e,
    '/verify/{number}': show6304adffcc41b8a5c85472437db49dcc,
}

const CertificateVerificationController = { show }

export default CertificateVerificationController