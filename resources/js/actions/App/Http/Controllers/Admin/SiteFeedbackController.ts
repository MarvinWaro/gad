import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::index
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:33
 * @route '/admin/feedback'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/feedback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::index
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:33
 * @route '/admin/feedback'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::index
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:33
 * @route '/admin/feedback'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::index
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:33
 * @route '/admin/feedback'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::index
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:33
 * @route '/admin/feedback'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::index
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:33
 * @route '/admin/feedback'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::index
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:33
 * @route '/admin/feedback'
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
/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::exportMethod
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:62
 * @route '/admin/feedback/export'
 */
export const exportMethod = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/admin/feedback/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::exportMethod
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:62
 * @route '/admin/feedback/export'
 */
exportMethod.url = (options?: RouteQueryOptions) => {
    return exportMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::exportMethod
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:62
 * @route '/admin/feedback/export'
 */
exportMethod.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::exportMethod
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:62
 * @route '/admin/feedback/export'
 */
exportMethod.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::exportMethod
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:62
 * @route '/admin/feedback/export'
 */
    const exportMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::exportMethod
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:62
 * @route '/admin/feedback/export'
 */
        exportMethodForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::exportMethod
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:62
 * @route '/admin/feedback/export'
 */
        exportMethodForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportMethod.form = exportMethodForm
/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::destroy
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:110
 * @route '/admin/feedback/{siteFeedback}'
 */
export const destroy = (args: { siteFeedback: string | { id: string } } | [siteFeedback: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/feedback/{siteFeedback}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::destroy
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:110
 * @route '/admin/feedback/{siteFeedback}'
 */
destroy.url = (args: { siteFeedback: string | { id: string } } | [siteFeedback: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { siteFeedback: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { siteFeedback: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    siteFeedback: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        siteFeedback: typeof args.siteFeedback === 'object'
                ? args.siteFeedback.id
                : args.siteFeedback,
                }

    return destroy.definition.url
            .replace('{siteFeedback}', parsedArgs.siteFeedback.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::destroy
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:110
 * @route '/admin/feedback/{siteFeedback}'
 */
destroy.delete = (args: { siteFeedback: string | { id: string } } | [siteFeedback: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::destroy
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:110
 * @route '/admin/feedback/{siteFeedback}'
 */
    const destroyForm = (args: { siteFeedback: string | { id: string } } | [siteFeedback: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SiteFeedbackController::destroy
 * @see app/Http/Controllers/Admin/SiteFeedbackController.php:110
 * @route '/admin/feedback/{siteFeedback}'
 */
        destroyForm.delete = (args: { siteFeedback: string | { id: string } } | [siteFeedback: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const SiteFeedbackController = { index, exportMethod, destroy, export: exportMethod }

export default SiteFeedbackController