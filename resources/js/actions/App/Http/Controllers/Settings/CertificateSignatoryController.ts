import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::index
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:27
 * @route '/settings/certificate-signatories'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/certificate-signatories',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::index
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:27
 * @route '/settings/certificate-signatories'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::index
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:27
 * @route '/settings/certificate-signatories'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::index
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:27
 * @route '/settings/certificate-signatories'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::index
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:27
 * @route '/settings/certificate-signatories'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::index
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:27
 * @route '/settings/certificate-signatories'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::index
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:27
 * @route '/settings/certificate-signatories'
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
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::store
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:57
 * @route '/settings/certificate-signatories'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/certificate-signatories',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::store
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:57
 * @route '/settings/certificate-signatories'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::store
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:57
 * @route '/settings/certificate-signatories'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::store
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:57
 * @route '/settings/certificate-signatories'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::store
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:57
 * @route '/settings/certificate-signatories'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::update
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:70
 * @route '/settings/certificate-signatories/{signatory}'
 */
export const update = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/certificate-signatories/{signatory}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::update
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:70
 * @route '/settings/certificate-signatories/{signatory}'
 */
update.url = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { signatory: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { signatory: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    signatory: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        signatory: typeof args.signatory === 'object'
                ? args.signatory.id
                : args.signatory,
                }

    return update.definition.url
            .replace('{signatory}', parsedArgs.signatory.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::update
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:70
 * @route '/settings/certificate-signatories/{signatory}'
 */
update.put = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::update
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:70
 * @route '/settings/certificate-signatories/{signatory}'
 */
    const updateForm = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::update
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:70
 * @route '/settings/certificate-signatories/{signatory}'
 */
        updateForm.put = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::destroy
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:79
 * @route '/settings/certificate-signatories/{signatory}'
 */
export const destroy = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/certificate-signatories/{signatory}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::destroy
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:79
 * @route '/settings/certificate-signatories/{signatory}'
 */
destroy.url = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { signatory: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { signatory: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    signatory: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        signatory: typeof args.signatory === 'object'
                ? args.signatory.id
                : args.signatory,
                }

    return destroy.definition.url
            .replace('{signatory}', parsedArgs.signatory.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::destroy
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:79
 * @route '/settings/certificate-signatories/{signatory}'
 */
destroy.delete = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::destroy
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:79
 * @route '/settings/certificate-signatories/{signatory}'
 */
    const destroyForm = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\CertificateSignatoryController::destroy
 * @see app/Http/Controllers/Settings/CertificateSignatoryController.php:79
 * @route '/settings/certificate-signatories/{signatory}'
 */
        destroyForm.delete = (args: { signatory: string | { id: string } } | [signatory: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const CertificateSignatoryController = { index, store, update, destroy }

export default CertificateSignatoryController