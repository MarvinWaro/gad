import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:100
 * @route '/settings/respondent-groups'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/respondent-groups',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:100
 * @route '/settings/respondent-groups'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:100
 * @route '/settings/respondent-groups'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:100
 * @route '/settings/respondent-groups'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:100
 * @route '/settings/respondent-groups'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:100
 * @route '/settings/respondent-groups'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:100
 * @route '/settings/respondent-groups'
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
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::followUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:207
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
export const followUps = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: followUps.url(args, options),
    method: 'put',
})

followUps.definition = {
    methods: ["put"],
    url: '/settings/respondent-groups/{group}/follow-ups',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::followUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:207
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
followUps.url = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { group: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { group: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    group: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        group: typeof args.group === 'object'
                ? args.group.id
                : args.group,
                }

    return followUps.definition.url
            .replace('{group}', parsedArgs.group.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::followUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:207
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
followUps.put = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: followUps.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::followUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:207
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
    const followUpsForm = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: followUps.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::followUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:207
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
        followUpsForm.put = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: followUps.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    followUps.form = followUpsForm
const respondentGroups = {
    index: Object.assign(index, index),
followUps: Object.assign(followUps, followUps),
}

export default respondentGroups