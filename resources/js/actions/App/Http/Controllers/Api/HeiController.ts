import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\HeiController::regions
 * @see app/Http/Controllers/Api/HeiController.php:29
 * @route '/api/regions'
 */
export const regions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: regions.url(options),
    method: 'get',
})

regions.definition = {
    methods: ["get","head"],
    url: '/api/regions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\HeiController::regions
 * @see app/Http/Controllers/Api/HeiController.php:29
 * @route '/api/regions'
 */
regions.url = (options?: RouteQueryOptions) => {
    return regions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\HeiController::regions
 * @see app/Http/Controllers/Api/HeiController.php:29
 * @route '/api/regions'
 */
regions.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: regions.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\HeiController::regions
 * @see app/Http/Controllers/Api/HeiController.php:29
 * @route '/api/regions'
 */
regions.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: regions.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\HeiController::regions
 * @see app/Http/Controllers/Api/HeiController.php:29
 * @route '/api/regions'
 */
    const regionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: regions.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\HeiController::regions
 * @see app/Http/Controllers/Api/HeiController.php:29
 * @route '/api/regions'
 */
        regionsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: regions.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\HeiController::regions
 * @see app/Http/Controllers/Api/HeiController.php:29
 * @route '/api/regions'
 */
        regionsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: regions.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    regions.form = regionsForm
/**
* @see \App\Http\Controllers\Api\HeiController::index
 * @see app/Http/Controllers/Api/HeiController.php:67
 * @route '/api/heis'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/heis',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\HeiController::index
 * @see app/Http/Controllers/Api/HeiController.php:67
 * @route '/api/heis'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\HeiController::index
 * @see app/Http/Controllers/Api/HeiController.php:67
 * @route '/api/heis'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Api\HeiController::index
 * @see app/Http/Controllers/Api/HeiController.php:67
 * @route '/api/heis'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Api\HeiController::index
 * @see app/Http/Controllers/Api/HeiController.php:67
 * @route '/api/heis'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Api\HeiController::index
 * @see app/Http/Controllers/Api/HeiController.php:67
 * @route '/api/heis'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Api\HeiController::index
 * @see app/Http/Controllers/Api/HeiController.php:67
 * @route '/api/heis'
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
const HeiController = { regions, index }

export default HeiController