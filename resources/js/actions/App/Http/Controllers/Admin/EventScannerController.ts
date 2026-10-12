import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EventScannerController::show
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/scanner',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EventScannerController::show
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventScannerController::show
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EventScannerController::show
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EventScannerController::show
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EventScannerController::show
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EventScannerController::show
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const EventScannerController = { show }

export default EventScannerController