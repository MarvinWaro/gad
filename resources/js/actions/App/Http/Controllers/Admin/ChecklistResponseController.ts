import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\ChecklistResponseController::index
 * @see app/Http/Controllers/Admin/ChecklistResponseController.php:19
 * @route '/admin/monitoring/{type}'
 */
export const index = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/monitoring/{type}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\ChecklistResponseController::index
 * @see app/Http/Controllers/Admin/ChecklistResponseController.php:19
 * @route '/admin/monitoring/{type}'
 */
index.url = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { type: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                }

    return index.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\ChecklistResponseController::index
 * @see app/Http/Controllers/Admin/ChecklistResponseController.php:19
 * @route '/admin/monitoring/{type}'
 */
index.get = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\ChecklistResponseController::index
 * @see app/Http/Controllers/Admin/ChecklistResponseController.php:19
 * @route '/admin/monitoring/{type}'
 */
index.head = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\ChecklistResponseController::index
 * @see app/Http/Controllers/Admin/ChecklistResponseController.php:19
 * @route '/admin/monitoring/{type}'
 */
    const indexForm = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\ChecklistResponseController::index
 * @see app/Http/Controllers/Admin/ChecklistResponseController.php:19
 * @route '/admin/monitoring/{type}'
 */
        indexForm.get = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\ChecklistResponseController::index
 * @see app/Http/Controllers/Admin/ChecklistResponseController.php:19
 * @route '/admin/monitoring/{type}'
 */
        indexForm.head = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
const ChecklistResponseController = { index }

export default ChecklistResponseController