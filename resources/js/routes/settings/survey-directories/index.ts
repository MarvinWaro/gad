import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::sync
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:145
 * @route '/settings/survey-directories/sync-heis'
 */
export const sync = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

sync.definition = {
    methods: ["post"],
    url: '/settings/survey-directories/sync-heis',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::sync
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:145
 * @route '/settings/survey-directories/sync-heis'
 */
sync.url = (options?: RouteQueryOptions) => {
    return sync.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::sync
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:145
 * @route '/settings/survey-directories/sync-heis'
 */
sync.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sync.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::sync
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:145
 * @route '/settings/survey-directories/sync-heis'
 */
    const syncForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: sync.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::sync
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:145
 * @route '/settings/survey-directories/sync-heis'
 */
        syncForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: sync.url(options),
            method: 'post',
        })
    
    sync.form = syncForm
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::store
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:157
 * @route '/settings/survey-directories/{type}'
 */
export const store = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/survey-directories/{type}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::store
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:157
 * @route '/settings/survey-directories/{type}'
 */
store.url = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { type: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                }

    return store.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::store
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:157
 * @route '/settings/survey-directories/{type}'
 */
store.post = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::store
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:157
 * @route '/settings/survey-directories/{type}'
 */
    const storeForm = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::store
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:157
 * @route '/settings/survey-directories/{type}'
 */
        storeForm.post = (args: { type: string | number } | [type: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::update
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:243
 * @route '/settings/survey-directories/{type}/{id}'
 */
export const update = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/survey-directories/{type}/{id}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::update
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:243
 * @route '/settings/survey-directories/{type}/{id}'
 */
update.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return update.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::update
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:243
 * @route '/settings/survey-directories/{type}/{id}'
 */
update.put = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::update
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:243
 * @route '/settings/survey-directories/{type}/{id}'
 */
    const updateForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::update
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:243
 * @route '/settings/survey-directories/{type}/{id}'
 */
        updateForm.put = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::destroy
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:340
 * @route '/settings/survey-directories/{type}/{id}'
 */
export const destroy = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/survey-directories/{type}/{id}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::destroy
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:340
 * @route '/settings/survey-directories/{type}/{id}'
 */
destroy.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    type: args[0],
                    id: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        type: args.type,
                                id: args.id,
                }

    return destroy.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::destroy
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:340
 * @route '/settings/survey-directories/{type}/{id}'
 */
destroy.delete = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::destroy
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:340
 * @route '/settings/survey-directories/{type}/{id}'
 */
    const destroyForm = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::destroy
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:340
 * @route '/settings/survey-directories/{type}/{id}'
 */
        destroyForm.delete = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const surveyDirectories = {
    sync: Object.assign(sync, sync),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default surveyDirectories