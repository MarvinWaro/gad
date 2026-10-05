import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\SiteRatingController::store
 * @see app/Http/Controllers/SiteRatingController.php:17
 * @route '/ratings'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/ratings',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SiteRatingController::store
 * @see app/Http/Controllers/SiteRatingController.php:17
 * @route '/ratings'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SiteRatingController::store
 * @see app/Http/Controllers/SiteRatingController.php:17
 * @route '/ratings'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SiteRatingController::store
 * @see app/Http/Controllers/SiteRatingController.php:17
 * @route '/ratings'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SiteRatingController::store
 * @see app/Http/Controllers/SiteRatingController.php:17
 * @route '/ratings'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const SiteRatingController = { store }

export default SiteRatingController