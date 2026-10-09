import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::respondentGroups
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:115
 * @route '/settings/respondent-groups'
 */
export const respondentGroups = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: respondentGroups.url(options),
    method: 'get',
})

respondentGroups.definition = {
    methods: ["get","head"],
    url: '/settings/respondent-groups',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::respondentGroups
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:115
 * @route '/settings/respondent-groups'
 */
respondentGroups.url = (options?: RouteQueryOptions) => {
    return respondentGroups.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::respondentGroups
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:115
 * @route '/settings/respondent-groups'
 */
respondentGroups.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: respondentGroups.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::respondentGroups
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:115
 * @route '/settings/respondent-groups'
 */
respondentGroups.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: respondentGroups.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::respondentGroups
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:115
 * @route '/settings/respondent-groups'
 */
    const respondentGroupsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: respondentGroups.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::respondentGroups
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:115
 * @route '/settings/respondent-groups'
 */
        respondentGroupsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: respondentGroups.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::respondentGroups
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:115
 * @route '/settings/respondent-groups'
 */
        respondentGroupsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: respondentGroups.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    respondentGroups.form = respondentGroupsForm
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::regions
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:43
 * @route '/settings/regions'
 */
export const regions = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: regions.url(options),
    method: 'get',
})

regions.definition = {
    methods: ["get","head"],
    url: '/settings/regions',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::regions
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:43
 * @route '/settings/regions'
 */
regions.url = (options?: RouteQueryOptions) => {
    return regions.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::regions
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:43
 * @route '/settings/regions'
 */
regions.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: regions.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::regions
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:43
 * @route '/settings/regions'
 */
regions.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: regions.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::regions
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:43
 * @route '/settings/regions'
 */
    const regionsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: regions.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::regions
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:43
 * @route '/settings/regions'
 */
        regionsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: regions.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::regions
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:43
 * @route '/settings/regions'
 */
        regionsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: regions.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    regions.form = regionsForm
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::heis
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
export const heis = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: heis.url(options),
    method: 'get',
})

heis.definition = {
    methods: ["get","head"],
    url: '/settings/heis',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::heis
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
heis.url = (options?: RouteQueryOptions) => {
    return heis.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::heis
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
heis.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: heis.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::heis
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
heis.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: heis.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::heis
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
    const heisForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: heis.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::heis
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
        heisForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: heis.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::heis
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:66
 * @route '/settings/heis'
 */
        heisForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: heis.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    heis.form = heisForm
/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::updateFollowUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:222
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
export const updateFollowUps = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateFollowUps.url(args, options),
    method: 'put',
})

updateFollowUps.definition = {
    methods: ["put"],
    url: '/settings/respondent-groups/{group}/follow-ups',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::updateFollowUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:222
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
updateFollowUps.url = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { group: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { group: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    group: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        group: typeof args.group === 'object'
                ? args.group.id
                : args.group,
                }

    return updateFollowUps.definition.url
            .replace('{group}', parsedArgs.group.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::updateFollowUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:222
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
updateFollowUps.put = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: updateFollowUps.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::updateFollowUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:222
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
    const updateFollowUpsForm = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: updateFollowUps.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\SurveyDirectoryController::updateFollowUps
 * @see app/Http/Controllers/Settings/SurveyDirectoryController.php:222
 * @route '/settings/respondent-groups/{group}/follow-ups'
 */
        updateFollowUpsForm.put = (args: { group: number | { id: number } } | [group: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: updateFollowUps.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    updateFollowUps.form = updateFollowUpsForm
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
const SurveyDirectoryController = { respondentGroups, regions, heis, updateFollowUps, sync, store, update, destroy }

export default SurveyDirectoryController