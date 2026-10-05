import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SiteFeedbackController::create
 * @see app/Http/Controllers/SiteFeedbackController.php:23
 * @route '/feedback'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/feedback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SiteFeedbackController::create
 * @see app/Http/Controllers/SiteFeedbackController.php:23
 * @route '/feedback'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SiteFeedbackController::create
 * @see app/Http/Controllers/SiteFeedbackController.php:23
 * @route '/feedback'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SiteFeedbackController::create
 * @see app/Http/Controllers/SiteFeedbackController.php:23
 * @route '/feedback'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SiteFeedbackController::create
 * @see app/Http/Controllers/SiteFeedbackController.php:23
 * @route '/feedback'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SiteFeedbackController::create
 * @see app/Http/Controllers/SiteFeedbackController.php:23
 * @route '/feedback'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SiteFeedbackController::create
 * @see app/Http/Controllers/SiteFeedbackController.php:23
 * @route '/feedback'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\SiteFeedbackController::store
 * @see app/Http/Controllers/SiteFeedbackController.php:43
 * @route '/feedback'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/feedback',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SiteFeedbackController::store
 * @see app/Http/Controllers/SiteFeedbackController.php:43
 * @route '/feedback'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SiteFeedbackController::store
 * @see app/Http/Controllers/SiteFeedbackController.php:43
 * @route '/feedback'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SiteFeedbackController::store
 * @see app/Http/Controllers/SiteFeedbackController.php:43
 * @route '/feedback'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SiteFeedbackController::store
 * @see app/Http/Controllers/SiteFeedbackController.php:43
 * @route '/feedback'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const SiteFeedbackController = { create, store }

export default SiteFeedbackController