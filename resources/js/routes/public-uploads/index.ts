import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
export const show = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/files/{path}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
show.url = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{path}', parsedArgs.path.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
show.get = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
show.head = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
    const showForm = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
        showForm.get = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PublicUploadController::__invoke
 * @see app/Http/Controllers/PublicUploadController.php:18
 * @route '/files/{path}'
 */
        showForm.head = (args: { path: string | number } | [path: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const publicUploads = {
    show: Object.assign(show, show),
}

export default publicUploads