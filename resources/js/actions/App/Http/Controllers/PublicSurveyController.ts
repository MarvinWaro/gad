import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
/**
* @see \App\Http\Controllers\PublicSurveyController::store
 * @see app/Http/Controllers/PublicSurveyController.php:64
 * @route '/surveys/{survey}/responses'
 */
export const store = (args: { survey: string | { slug: string } } | [survey: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/surveys/{survey}/responses',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PublicSurveyController::store
 * @see app/Http/Controllers/PublicSurveyController.php:64
 * @route '/surveys/{survey}/responses'
 */
store.url = (args: { survey: string | { slug: string } } | [survey: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { survey: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'slug' in args) {
            args = { survey: args.slug }
        }
    
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.slug
                : args.survey,
                }

    return store.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PublicSurveyController::store
 * @see app/Http/Controllers/PublicSurveyController.php:64
 * @route '/surveys/{survey}/responses'
 */
store.post = (args: { survey: string | { slug: string } } | [survey: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PublicSurveyController::store
 * @see app/Http/Controllers/PublicSurveyController.php:64
 * @route '/surveys/{survey}/responses'
 */
    const storeForm = (args: { survey: string | { slug: string } } | [survey: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PublicSurveyController::store
 * @see app/Http/Controllers/PublicSurveyController.php:64
 * @route '/surveys/{survey}/responses'
 */
        storeForm.post = (args: { survey: string | { slug: string } } | [survey: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const PublicSurveyController = { show, store }

export default PublicSurveyController