import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::edit
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:23
 * @route '/password/change'
 */
export const edit = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/password/change',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::edit
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:23
 * @route '/password/change'
 */
edit.url = (options?: RouteQueryOptions) => {
    return edit.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::edit
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:23
 * @route '/password/change'
 */
edit.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::edit
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:23
 * @route '/password/change'
 */
edit.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::edit
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:23
 * @route '/password/change'
 */
    const editForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::edit
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:23
 * @route '/password/change'
 */
        editForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::edit
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:23
 * @route '/password/change'
 */
        editForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::update
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:37
 * @route '/password/change'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/password/change',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::update
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:37
 * @route '/password/change'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::update
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:37
 * @route '/password/change'
 */
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::update
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:37
 * @route '/password/change'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\TemporaryPasswordController::update
 * @see app/Http/Controllers/Settings/TemporaryPasswordController.php:37
 * @route '/password/change'
 */
        updateForm.put = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
const TemporaryPasswordController = { edit, update }

export default TemporaryPasswordController