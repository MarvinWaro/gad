import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SurveyController::index
 * @see app/Http/Controllers/Admin/SurveyController.php:27
 * @route '/admin/surveys'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/surveys',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SurveyController::index
 * @see app/Http/Controllers/Admin/SurveyController.php:27
 * @route '/admin/surveys'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyController::index
 * @see app/Http/Controllers/Admin/SurveyController.php:27
 * @route '/admin/surveys'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SurveyController::index
 * @see app/Http/Controllers/Admin/SurveyController.php:27
 * @route '/admin/surveys'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyController::index
 * @see app/Http/Controllers/Admin/SurveyController.php:27
 * @route '/admin/surveys'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyController::index
 * @see app/Http/Controllers/Admin/SurveyController.php:27
 * @route '/admin/surveys'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SurveyController::index
 * @see app/Http/Controllers/Admin/SurveyController.php:27
 * @route '/admin/surveys'
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
* @see \App\Http\Controllers\Admin\SurveyController::store
 * @see app/Http/Controllers/Admin/SurveyController.php:76
 * @route '/admin/surveys'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/surveys',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SurveyController::store
 * @see app/Http/Controllers/Admin/SurveyController.php:76
 * @route '/admin/surveys'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyController::store
 * @see app/Http/Controllers/Admin/SurveyController.php:76
 * @route '/admin/surveys'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyController::store
 * @see app/Http/Controllers/Admin/SurveyController.php:76
 * @route '/admin/surveys'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyController::store
 * @see app/Http/Controllers/Admin/SurveyController.php:76
 * @route '/admin/surveys'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\SurveyController::edit
 * @see app/Http/Controllers/Admin/SurveyController.php:109
 * @route '/admin/surveys/{survey}/edit'
 */
export const edit = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/surveys/{survey}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SurveyController::edit
 * @see app/Http/Controllers/Admin/SurveyController.php:109
 * @route '/admin/surveys/{survey}/edit'
 */
edit.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { survey: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { survey: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                }

    return edit.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyController::edit
 * @see app/Http/Controllers/Admin/SurveyController.php:109
 * @route '/admin/surveys/{survey}/edit'
 */
edit.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SurveyController::edit
 * @see app/Http/Controllers/Admin/SurveyController.php:109
 * @route '/admin/surveys/{survey}/edit'
 */
edit.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyController::edit
 * @see app/Http/Controllers/Admin/SurveyController.php:109
 * @route '/admin/surveys/{survey}/edit'
 */
    const editForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyController::edit
 * @see app/Http/Controllers/Admin/SurveyController.php:109
 * @route '/admin/surveys/{survey}/edit'
 */
        editForm.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SurveyController::edit
 * @see app/Http/Controllers/Admin/SurveyController.php:109
 * @route '/admin/surveys/{survey}/edit'
 */
        editForm.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\Admin\SurveyController::update
 * @see app/Http/Controllers/Admin/SurveyController.php:152
 * @route '/admin/surveys/{survey}'
 */
export const update = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/surveys/{survey}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\SurveyController::update
 * @see app/Http/Controllers/Admin/SurveyController.php:152
 * @route '/admin/surveys/{survey}'
 */
update.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { survey: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { survey: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                }

    return update.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyController::update
 * @see app/Http/Controllers/Admin/SurveyController.php:152
 * @route '/admin/surveys/{survey}'
 */
update.put = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyController::update
 * @see app/Http/Controllers/Admin/SurveyController.php:152
 * @route '/admin/surveys/{survey}'
 */
    const updateForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyController::update
 * @see app/Http/Controllers/Admin/SurveyController.php:152
 * @route '/admin/surveys/{survey}'
 */
        updateForm.put = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\SurveyController::publish
 * @see app/Http/Controllers/Admin/SurveyController.php:220
 * @route '/admin/surveys/{survey}/publish'
 */
export const publish = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: publish.url(args, options),
    method: 'post',
})

publish.definition = {
    methods: ["post"],
    url: '/admin/surveys/{survey}/publish',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\SurveyController::publish
 * @see app/Http/Controllers/Admin/SurveyController.php:220
 * @route '/admin/surveys/{survey}/publish'
 */
publish.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { survey: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { survey: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                }

    return publish.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyController::publish
 * @see app/Http/Controllers/Admin/SurveyController.php:220
 * @route '/admin/surveys/{survey}/publish'
 */
publish.post = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: publish.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyController::publish
 * @see app/Http/Controllers/Admin/SurveyController.php:220
 * @route '/admin/surveys/{survey}/publish'
 */
    const publishForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: publish.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyController::publish
 * @see app/Http/Controllers/Admin/SurveyController.php:220
 * @route '/admin/surveys/{survey}/publish'
 */
        publishForm.post = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: publish.url(args, options),
            method: 'post',
        })
    
    publish.form = publishForm
/**
* @see \App\Http\Controllers\Admin\SurveyController::archive
 * @see app/Http/Controllers/Admin/SurveyController.php:263
 * @route '/admin/surveys/{survey}/archive'
 */
export const archive = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: archive.url(args, options),
    method: 'patch',
})

archive.definition = {
    methods: ["patch"],
    url: '/admin/surveys/{survey}/archive',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Admin\SurveyController::archive
 * @see app/Http/Controllers/Admin/SurveyController.php:263
 * @route '/admin/surveys/{survey}/archive'
 */
archive.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { survey: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { survey: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                }

    return archive.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyController::archive
 * @see app/Http/Controllers/Admin/SurveyController.php:263
 * @route '/admin/surveys/{survey}/archive'
 */
archive.patch = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: archive.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyController::archive
 * @see app/Http/Controllers/Admin/SurveyController.php:263
 * @route '/admin/surveys/{survey}/archive'
 */
    const archiveForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: archive.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PATCH',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyController::archive
 * @see app/Http/Controllers/Admin/SurveyController.php:263
 * @route '/admin/surveys/{survey}/archive'
 */
        archiveForm.patch = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: archive.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    archive.form = archiveForm
/**
* @see \App\Http\Controllers\Admin\SurveyController::destroy
 * @see app/Http/Controllers/Admin/SurveyController.php:279
 * @route '/admin/surveys/{survey}'
 */
export const destroy = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/surveys/{survey}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SurveyController::destroy
 * @see app/Http/Controllers/Admin/SurveyController.php:279
 * @route '/admin/surveys/{survey}'
 */
destroy.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { survey: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { survey: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                }

    return destroy.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyController::destroy
 * @see app/Http/Controllers/Admin/SurveyController.php:279
 * @route '/admin/surveys/{survey}'
 */
destroy.delete = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyController::destroy
 * @see app/Http/Controllers/Admin/SurveyController.php:279
 * @route '/admin/surveys/{survey}'
 */
    const destroyForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyController::destroy
 * @see app/Http/Controllers/Admin/SurveyController.php:279
 * @route '/admin/surveys/{survey}'
 */
        destroyForm.delete = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const SurveyController = { index, store, edit, update, publish, archive, destroy }

export default SurveyController