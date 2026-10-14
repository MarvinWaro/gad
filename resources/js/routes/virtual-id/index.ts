import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\VirtualIdController::show
 * @see app/Http/Controllers/Settings/VirtualIdController.php:17
 * @route '/settings/virtual-id'
 */
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/settings/virtual-id',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\VirtualIdController::show
 * @see app/Http/Controllers/Settings/VirtualIdController.php:17
 * @route '/settings/virtual-id'
 */
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\VirtualIdController::show
 * @see app/Http/Controllers/Settings/VirtualIdController.php:17
 * @route '/settings/virtual-id'
 */
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\VirtualIdController::show
 * @see app/Http/Controllers/Settings/VirtualIdController.php:17
 * @route '/settings/virtual-id'
 */
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\VirtualIdController::show
 * @see app/Http/Controllers/Settings/VirtualIdController.php:17
 * @route '/settings/virtual-id'
 */
    const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\VirtualIdController::show
 * @see app/Http/Controllers/Settings/VirtualIdController.php:17
 * @route '/settings/virtual-id'
 */
        showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\VirtualIdController::show
 * @see app/Http/Controllers/Settings/VirtualIdController.php:17
 * @route '/settings/virtual-id'
 */
        showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Settings\VirtualIdController::photo
 * @see app/Http/Controllers/Settings/VirtualIdController.php:29
 * @route '/settings/virtual-id/photo'
 */
export const photo = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: photo.url(options),
    method: 'get',
})

photo.definition = {
    methods: ["get","head"],
    url: '/settings/virtual-id/photo',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\VirtualIdController::photo
 * @see app/Http/Controllers/Settings/VirtualIdController.php:29
 * @route '/settings/virtual-id/photo'
 */
photo.url = (options?: RouteQueryOptions) => {
    return photo.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\VirtualIdController::photo
 * @see app/Http/Controllers/Settings/VirtualIdController.php:29
 * @route '/settings/virtual-id/photo'
 */
photo.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: photo.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\VirtualIdController::photo
 * @see app/Http/Controllers/Settings/VirtualIdController.php:29
 * @route '/settings/virtual-id/photo'
 */
photo.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: photo.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\VirtualIdController::photo
 * @see app/Http/Controllers/Settings/VirtualIdController.php:29
 * @route '/settings/virtual-id/photo'
 */
    const photoForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: photo.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\VirtualIdController::photo
 * @see app/Http/Controllers/Settings/VirtualIdController.php:29
 * @route '/settings/virtual-id/photo'
 */
        photoForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: photo.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\VirtualIdController::photo
 * @see app/Http/Controllers/Settings/VirtualIdController.php:29
 * @route '/settings/virtual-id/photo'
 */
        photoForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: photo.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    photo.form = photoForm
const virtualId = {
    show: Object.assign(show, show),
photo: Object.assign(photo, photo),
}

export default virtualId