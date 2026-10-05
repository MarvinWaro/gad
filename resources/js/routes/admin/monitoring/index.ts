import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::review
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:55
 * @route '/admin/monitoring/{report}/review'
 */
export const review = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: review.url(args, options),
    method: 'post',
})

review.definition = {
    methods: ["post"],
    url: '/admin/monitoring/{report}/review',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::review
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:55
 * @route '/admin/monitoring/{report}/review'
 */
review.url = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { report: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { report: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    report: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        report: typeof args.report === 'object'
                ? args.report.id
                : args.report,
                }

    return review.definition.url
            .replace('{report}', parsedArgs.report.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::review
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:55
 * @route '/admin/monitoring/{report}/review'
 */
review.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: review.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::review
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:55
 * @route '/admin/monitoring/{report}/review'
 */
    const reviewForm = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: review.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::review
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:55
 * @route '/admin/monitoring/{report}/review'
 */
        reviewForm.post = (args: { report: string | { id: string } } | [report: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: review.url(args, options),
            method: 'post',
        })
    
    review.form = reviewForm
/**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::index
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:21
 * @route '/admin/monitoring'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::index
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:21
 * @route '/admin/monitoring'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::index
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:21
 * @route '/admin/monitoring'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::index
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:21
 * @route '/admin/monitoring'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::index
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:21
 * @route '/admin/monitoring'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::index
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:21
 * @route '/admin/monitoring'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\MonitoringReviewController::index
 * @see app/Http/Controllers/Admin/MonitoringReviewController.php:21
 * @route '/admin/monitoring'
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
const monitoring = {
    review: Object.assign(review, review),
index: Object.assign(index, index),
}

export default monitoring