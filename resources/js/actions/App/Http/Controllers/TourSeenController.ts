import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
const TourSeenController = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: TourSeenController.url(options),
    method: 'post',
})

TourSeenController.definition = {
    methods: ["post"],
    url: '/tour/seen',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
TourSeenController.url = (options?: RouteQueryOptions) => {
    return TourSeenController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
TourSeenController.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: TourSeenController.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
    const TourSeenControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: TourSeenController.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\TourSeenController::__invoke
 * @see app/Http/Controllers/TourSeenController.php:15
 * @route '/tour/seen'
 */
        TourSeenControllerForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: TourSeenController.url(options),
            method: 'post',
        })
    
    TourSeenController.form = TourSeenControllerForm
export default TourSeenController