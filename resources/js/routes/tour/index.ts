import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
export const seen = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: seen.url(options),
    method: 'post',
})

seen.definition = {
    methods: ["post"],
    url: '/tour/seen',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
seen.url = (options?: RouteQueryOptions) => {
    return seen.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
seen.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: seen.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
    const seenForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: seen.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
        seenForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: seen.url(options),
            method: 'post',
        })
    
    seen.form = seenForm
const tour = {
    seen: Object.assign(seen, seen),
}

export default tour