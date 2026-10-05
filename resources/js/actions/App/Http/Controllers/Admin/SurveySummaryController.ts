import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SurveySummaryController::__invoke
 * @see app/Http/Controllers/Admin/SurveySummaryController.php:19
 * @route '/admin/surveys/{survey}/summary'
 */
const SurveySummaryController = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: SurveySummaryController.url(args, options),
    method: 'get',
})

SurveySummaryController.definition = {
    methods: ["get","head"],
    url: '/admin/surveys/{survey}/summary',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SurveySummaryController::__invoke
 * @see app/Http/Controllers/Admin/SurveySummaryController.php:19
 * @route '/admin/surveys/{survey}/summary'
 */
SurveySummaryController.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { survey: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { survey: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                }

    return SurveySummaryController.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveySummaryController::__invoke
 * @see app/Http/Controllers/Admin/SurveySummaryController.php:19
 * @route '/admin/surveys/{survey}/summary'
 */
SurveySummaryController.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: SurveySummaryController.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SurveySummaryController::__invoke
 * @see app/Http/Controllers/Admin/SurveySummaryController.php:19
 * @route '/admin/surveys/{survey}/summary'
 */
SurveySummaryController.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: SurveySummaryController.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SurveySummaryController::__invoke
 * @see app/Http/Controllers/Admin/SurveySummaryController.php:19
 * @route '/admin/surveys/{survey}/summary'
 */
    const SurveySummaryControllerForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: SurveySummaryController.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveySummaryController::__invoke
 * @see app/Http/Controllers/Admin/SurveySummaryController.php:19
 * @route '/admin/surveys/{survey}/summary'
 */
        SurveySummaryControllerForm.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: SurveySummaryController.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SurveySummaryController::__invoke
 * @see app/Http/Controllers/Admin/SurveySummaryController.php:19
 * @route '/admin/surveys/{survey}/summary'
 */
        SurveySummaryControllerForm.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: SurveySummaryController.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    SurveySummaryController.form = SurveySummaryControllerForm
export default SurveySummaryController