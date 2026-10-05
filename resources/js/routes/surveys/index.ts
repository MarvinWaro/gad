import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import responses from './responses'
/**
* @see \App\Http\Controllers\PublicSurveyController::show
 * @see app/Http/Controllers/PublicSurveyController.php:26
 * @route '/surveys/{law}'
 */
export const show = (args: { law: string | number } | [law: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/surveys/{law}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PublicSurveyController::show
 * @see app/Http/Controllers/PublicSurveyController.php:26
 * @route '/surveys/{law}'
 */
show.url = (args: { law: string | number } | [law: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { law: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    law: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        law: args.law,
                }

    return show.definition.url
            .replace('{law}', parsedArgs.law.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicSurveyController::show
 * @see app/Http/Controllers/PublicSurveyController.php:26
 * @route '/surveys/{law}'
 */
show.get = (args: { law: string | number } | [law: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PublicSurveyController::show
 * @see app/Http/Controllers/PublicSurveyController.php:26
 * @route '/surveys/{law}'
 */
show.head = (args: { law: string | number } | [law: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PublicSurveyController::show
 * @see app/Http/Controllers/PublicSurveyController.php:26
 * @route '/surveys/{law}'
 */
    const showForm = (args: { law: string | number } | [law: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PublicSurveyController::show
 * @see app/Http/Controllers/PublicSurveyController.php:26
 * @route '/surveys/{law}'
 */
        showForm.get = (args: { law: string | number } | [law: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PublicSurveyController::show
 * @see app/Http/Controllers/PublicSurveyController.php:26
 * @route '/surveys/{law}'
 */
        showForm.head = (args: { law: string | number } | [law: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const surveys = {
    show: Object.assign(show, show),
responses: Object.assign(responses, responses),
}

export default surveys