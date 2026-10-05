import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PeopleSearchController::people
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
export const people = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: people.url(options),
    method: 'get',
})

people.definition = {
    methods: ["get","head"],
    url: '/search/people',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PeopleSearchController::people
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
people.url = (options?: RouteQueryOptions) => {
    return people.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PeopleSearchController::people
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
people.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: people.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PeopleSearchController::people
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
people.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: people.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PeopleSearchController::people
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
    const peopleForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: people.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PeopleSearchController::people
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
        peopleForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: people.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PeopleSearchController::people
 * @see app/Http/Controllers/PeopleSearchController.php:39
 * @route '/search/people'
 */
        peopleForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: people.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    people.form = peopleForm
const search = {
    people: Object.assign(people, people),
}

export default search