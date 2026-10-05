import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\PeopleSearchController::index
 * @see app/Http/Controllers/PeopleSearchController.php:25
 * @route '/search'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/search',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PeopleSearchController::index
 * @see app/Http/Controllers/PeopleSearchController.php:25
 * @route '/search'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PeopleSearchController::index
 * @see app/Http/Controllers/PeopleSearchController.php:25
 * @route '/search'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PeopleSearchController::index
 * @see app/Http/Controllers/PeopleSearchController.php:25
 * @route '/search'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PeopleSearchController::index
 * @see app/Http/Controllers/PeopleSearchController.php:25
 * @route '/search'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PeopleSearchController::index
 * @see app/Http/Controllers/PeopleSearchController.php:25
 * @route '/search'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PeopleSearchController::index
 * @see app/Http/Controllers/PeopleSearchController.php:25
 * @route '/search'
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
* @see \App\Http\Controllers\PeopleSearchController::suggestions
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
export const suggestions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: suggestions.url(options),
    method: 'get',
})

suggestions.definition = {
    methods: ["get","head"],
    url: '/search/people',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PeopleSearchController::suggestions
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
suggestions.url = (options?: RouteQueryOptions) => {
    return suggestions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PeopleSearchController::suggestions
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
suggestions.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: suggestions.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PeopleSearchController::suggestions
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
suggestions.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: suggestions.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PeopleSearchController::suggestions
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
    const suggestionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: suggestions.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PeopleSearchController::suggestions
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
        suggestionsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: suggestions.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PeopleSearchController::suggestions
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
        suggestionsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: suggestions.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    suggestions.form = suggestionsForm
const PeopleSearchController = { index, suggestions }

export default PeopleSearchController