import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\RoleManagementController::index
 * @see app/Http/Controllers/Settings/RoleManagementController.php:23
 * @route '/settings/roles'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/roles',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::index
 * @see app/Http/Controllers/Settings/RoleManagementController.php:23
 * @route '/settings/roles'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::index
 * @see app/Http/Controllers/Settings/RoleManagementController.php:23
 * @route '/settings/roles'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\RoleManagementController::index
 * @see app/Http/Controllers/Settings/RoleManagementController.php:23
 * @route '/settings/roles'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\RoleManagementController::index
 * @see app/Http/Controllers/Settings/RoleManagementController.php:23
 * @route '/settings/roles'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\RoleManagementController::index
 * @see app/Http/Controllers/Settings/RoleManagementController.php:23
 * @route '/settings/roles'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\RoleManagementController::index
 * @see app/Http/Controllers/Settings/RoleManagementController.php:23
 * @route '/settings/roles'
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
* @see \App\Http\Controllers\Settings\RoleManagementController::store
 * @see app/Http/Controllers/Settings/RoleManagementController.php:76
 * @route '/settings/roles'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/roles',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::store
 * @see app/Http/Controllers/Settings/RoleManagementController.php:76
 * @route '/settings/roles'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::store
 * @see app/Http/Controllers/Settings/RoleManagementController.php:76
 * @route '/settings/roles'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\RoleManagementController::store
 * @see app/Http/Controllers/Settings/RoleManagementController.php:76
 * @route '/settings/roles'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\RoleManagementController::store
 * @see app/Http/Controllers/Settings/RoleManagementController.php:76
 * @route '/settings/roles'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Settings\RoleManagementController::update
 * @see app/Http/Controllers/Settings/RoleManagementController.php:104
 * @route '/settings/roles/{role}'
 */
export const update = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/roles/{role}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::update
 * @see app/Http/Controllers/Settings/RoleManagementController.php:104
 * @route '/settings/roles/{role}'
 */
update.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { role: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: typeof args.role === 'object'
                ? args.role.id
                : args.role,
                }

    return update.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::update
 * @see app/Http/Controllers/Settings/RoleManagementController.php:104
 * @route '/settings/roles/{role}'
 */
update.put = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\RoleManagementController::update
 * @see app/Http/Controllers/Settings/RoleManagementController.php:104
 * @route '/settings/roles/{role}'
 */
    const updateForm = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\RoleManagementController::update
 * @see app/Http/Controllers/Settings/RoleManagementController.php:104
 * @route '/settings/roles/{role}'
 */
        updateForm.put = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Settings\RoleManagementController::destroy
 * @see app/Http/Controllers/Settings/RoleManagementController.php:135
 * @route '/settings/roles/{role}'
 */
export const destroy = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/roles/{role}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::destroy
 * @see app/Http/Controllers/Settings/RoleManagementController.php:135
 * @route '/settings/roles/{role}'
 */
destroy.url = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { role: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { role: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    role: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        role: typeof args.role === 'object'
                ? args.role.id
                : args.role,
                }

    return destroy.definition.url
            .replace('{role}', parsedArgs.role.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\RoleManagementController::destroy
 * @see app/Http/Controllers/Settings/RoleManagementController.php:135
 * @route '/settings/roles/{role}'
 */
destroy.delete = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\RoleManagementController::destroy
 * @see app/Http/Controllers/Settings/RoleManagementController.php:135
 * @route '/settings/roles/{role}'
 */
    const destroyForm = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\RoleManagementController::destroy
 * @see app/Http/Controllers/Settings/RoleManagementController.php:135
 * @route '/settings/roles/{role}'
 */
        destroyForm.delete = (args: { role: number | { id: number } } | [role: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const roles = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default roles