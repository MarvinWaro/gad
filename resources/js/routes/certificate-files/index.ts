import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\CertificateFileController::show
 * @see app/Http/Controllers/CertificateFileController.php:17
 * @route '/certificate-files/{folder}/{file}'
 */
export const show = (args: { folder: string | number, file: string | number } | [folder: string | number, file: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/certificate-files/{folder}/{file}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\CertificateFileController::show
 * @see app/Http/Controllers/CertificateFileController.php:17
 * @route '/certificate-files/{folder}/{file}'
 */
show.url = (args: { folder: string | number, file: string | number } | [folder: string | number, file: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    folder: args[0],
                    file: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        folder: args.folder,
                                file: args.file,
                }

    return show.definition.url
            .replace('{folder}', parsedArgs.folder.toString())
            .replace('{file}', parsedArgs.file.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\CertificateFileController::show
 * @see app/Http/Controllers/CertificateFileController.php:17
 * @route '/certificate-files/{folder}/{file}'
 */
show.get = (args: { folder: string | number, file: string | number } | [folder: string | number, file: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\CertificateFileController::show
 * @see app/Http/Controllers/CertificateFileController.php:17
 * @route '/certificate-files/{folder}/{file}'
 */
show.head = (args: { folder: string | number, file: string | number } | [folder: string | number, file: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\CertificateFileController::show
 * @see app/Http/Controllers/CertificateFileController.php:17
 * @route '/certificate-files/{folder}/{file}'
 */
    const showForm = (args: { folder: string | number, file: string | number } | [folder: string | number, file: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\CertificateFileController::show
 * @see app/Http/Controllers/CertificateFileController.php:17
 * @route '/certificate-files/{folder}/{file}'
 */
        showForm.get = (args: { folder: string | number, file: string | number } | [folder: string | number, file: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\CertificateFileController::show
 * @see app/Http/Controllers/CertificateFileController.php:17
 * @route '/certificate-files/{folder}/{file}'
 */
        showForm.head = (args: { folder: string | number, file: string | number } | [folder: string | number, file: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const certificateFiles = {
    show: Object.assign(show, show),
}

export default certificateFiles