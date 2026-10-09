import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/heis',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
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
const heis = {
    index: Object.assign(index, index),
}

export default heis