import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import events from './events'
import carousels from './carousels'
import feedback from './feedback'
import surveys from './surveys'
import monitoring from './monitoring'
import checklists from './checklists'
/**
* @see \App\Http\Controllers\Admin\EventScannerController::scanner
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
export const scanner = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: scanner.url(options),
    method: 'get',
})

scanner.definition = {
    methods: ["get","head"],
    url: '/admin/scanner',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\EventScannerController::scanner
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
scanner.url = (options?: RouteQueryOptions) => {
    return scanner.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventScannerController::scanner
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
scanner.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: scanner.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\EventScannerController::scanner
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
scanner.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: scanner.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\EventScannerController::scanner
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
    const scannerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: scanner.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\EventScannerController::scanner
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
        scannerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: scanner.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\EventScannerController::scanner
 * @see app/Http/Controllers/Admin/EventScannerController.php:18
 * @route '/admin/scanner'
 */
        scannerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: scanner.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    scanner.form = scannerForm
const admin = {
    events: Object.assign(events, events),
scanner: Object.assign(scanner, scanner),
carousels: Object.assign(carousels, carousels),
feedback: Object.assign(feedback, feedback),
surveys: Object.assign(surveys, surveys),
monitoring: Object.assign(monitoring, monitoring),
checklists: Object.assign(checklists, checklists),
}

export default admin