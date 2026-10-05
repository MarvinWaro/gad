import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::update
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
export const update = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/regions/{region}/registration',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::update
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
update.url = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { region: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { region: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    region: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        region: typeof args.region === 'object'
                ? args.region.id
                : args.region,
                }

    return update.definition.url
            .replace('{region}', parsedArgs.region.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::update
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
update.put = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::update
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
    const updateForm = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::update
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
        updateForm.put = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const RegionRegistrationController = { update }

export default RegionRegistrationController