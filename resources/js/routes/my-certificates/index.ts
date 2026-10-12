import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\MyCertificateController::index
 * @see app/Http/Controllers/Settings/MyCertificateController.php:21
 * @route '/settings/my-certificates'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/my-certificates',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\MyCertificateController::index
 * @see app/Http/Controllers/Settings/MyCertificateController.php:21
 * @route '/settings/my-certificates'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\MyCertificateController::index
 * @see app/Http/Controllers/Settings/MyCertificateController.php:21
 * @route '/settings/my-certificates'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\MyCertificateController::index
 * @see app/Http/Controllers/Settings/MyCertificateController.php:21
 * @route '/settings/my-certificates'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\MyCertificateController::index
 * @see app/Http/Controllers/Settings/MyCertificateController.php:21
 * @route '/settings/my-certificates'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\MyCertificateController::index
 * @see app/Http/Controllers/Settings/MyCertificateController.php:21
 * @route '/settings/my-certificates'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\MyCertificateController::index
 * @see app/Http/Controllers/Settings/MyCertificateController.php:21
 * @route '/settings/my-certificates'
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
const myCertificates = {
    index: Object.assign(index, index),
}

export default myCertificates