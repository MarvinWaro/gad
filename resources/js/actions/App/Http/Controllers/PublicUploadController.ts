import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
const PublicUploadController = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: PublicUploadController.url(args, options),
    method: 'get',
})

PublicUploadController.definition = {
    methods: ["get","head"],
    url: '/files/{path}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
PublicUploadController.url = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { path: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    path: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        path: args.path,
                }

    return PublicUploadController.definition.url
            .replace('{path}', parsedArgs.path.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
PublicUploadController.get = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: PublicUploadController.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
PublicUploadController.head = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: PublicUploadController.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
    const PublicUploadControllerForm = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: PublicUploadController.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
        PublicUploadControllerForm.get = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: PublicUploadController.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
        PublicUploadControllerForm.head = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: PublicUploadController.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    PublicUploadController.form = PublicUploadControllerForm
export default PublicUploadController