import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::registration
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
export const registration = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: registration.url(args, options),
    method: 'put',
})

registration.definition = {
    methods: ["put"],
    url: '/settings/regions/{region}/registration',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::registration
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
registration.url = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return registration.definition.url
            .replace('{region}', parsedArgs.region.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::registration
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
registration.put = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: registration.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::registration
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
    const registrationForm = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: registration.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\RegionRegistrationController::registration
 * @see app/Http/Controllers/Settings/RegionRegistrationController.php:22
 * @route '/settings/regions/{region}/registration'
 */
        registrationForm.put = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: registration.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    registration.form = registrationForm
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:42
 * @route '/settings/regions'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/regions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:42
 * @route '/settings/regions'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:42
 * @route '/settings/regions'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:42
 * @route '/settings/regions'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:42
 * @route '/settings/regions'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:42
 * @route '/settings/regions'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::index
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:42
 * @route '/settings/regions'
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
* @see \App\Http\Controllers\Settings\RegionOfficeController::office
 * @see app/Http/Controllers/Settings/RegionOfficeController.php:20
 * @route '/settings/regions/{region}/office'
 */
export const office = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: office.url(args, options),
    method: 'put',
})

office.definition = {
    methods: ["put"],
    url: '/settings/regions/{region}/office',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\RegionOfficeController::office
 * @see app/Http/Controllers/Settings/RegionOfficeController.php:20
 * @route '/settings/regions/{region}/office'
 */
office.url = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return office.definition.url
            .replace('{region}', parsedArgs.region.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\RegionOfficeController::office
 * @see app/Http/Controllers/Settings/RegionOfficeController.php:20
 * @route '/settings/regions/{region}/office'
 */
office.put = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: office.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\RegionOfficeController::office
 * @see app/Http/Controllers/Settings/RegionOfficeController.php:20
 * @route '/settings/regions/{region}/office'
 */
    const officeForm = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: office.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\RegionOfficeController::office
 * @see app/Http/Controllers/Settings/RegionOfficeController.php:20
 * @route '/settings/regions/{region}/office'
 */
        officeForm.put = (args: { region: number | { id: number } } | [region: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: office.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    office.form = officeForm
const regions = {
    registration: Object.assign(registration, registration),
index: Object.assign(index, index),
office: Object.assign(office, office),
}

export default regions