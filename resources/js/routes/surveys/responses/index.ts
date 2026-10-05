import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
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
const responses = {
    store: Object.assign(store, store),
}

export default responses