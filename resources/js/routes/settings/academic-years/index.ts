import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\AcademicYearController::index
 * @see app/Http/Controllers/Settings/AcademicYearController.php:20
 * @route '/settings/academic-years'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/academic-years',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::index
 * @see app/Http/Controllers/Settings/AcademicYearController.php:20
 * @route '/settings/academic-years'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::index
 * @see app/Http/Controllers/Settings/AcademicYearController.php:20
 * @route '/settings/academic-years'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\AcademicYearController::index
 * @see app/Http/Controllers/Settings/AcademicYearController.php:20
 * @route '/settings/academic-years'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\AcademicYearController::index
 * @see app/Http/Controllers/Settings/AcademicYearController.php:20
 * @route '/settings/academic-years'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\AcademicYearController::index
 * @see app/Http/Controllers/Settings/AcademicYearController.php:20
 * @route '/settings/academic-years'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\AcademicYearController::index
 * @see app/Http/Controllers/Settings/AcademicYearController.php:20
 * @route '/settings/academic-years'
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
* @see \App\Http\Controllers\Settings\AcademicYearController::store
 * @see app/Http/Controllers/Settings/AcademicYearController.php:47
 * @route '/settings/academic-years'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/settings/academic-years',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::store
 * @see app/Http/Controllers/Settings/AcademicYearController.php:47
 * @route '/settings/academic-years'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::store
 * @see app/Http/Controllers/Settings/AcademicYearController.php:47
 * @route '/settings/academic-years'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\AcademicYearController::store
 * @see app/Http/Controllers/Settings/AcademicYearController.php:47
 * @route '/settings/academic-years'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\AcademicYearController::store
 * @see app/Http/Controllers/Settings/AcademicYearController.php:47
 * @route '/settings/academic-years'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Settings\AcademicYearController::update
 * @see app/Http/Controllers/Settings/AcademicYearController.php:55
 * @route '/settings/academic-years/{academicYear}'
 */
export const update = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/settings/academic-years/{academicYear}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::update
 * @see app/Http/Controllers/Settings/AcademicYearController.php:55
 * @route '/settings/academic-years/{academicYear}'
 */
update.url = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { academicYear: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { academicYear: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    academicYear: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        academicYear: typeof args.academicYear === 'object'
                ? args.academicYear.id
                : args.academicYear,
                }

    return update.definition.url
            .replace('{academicYear}', parsedArgs.academicYear.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::update
 * @see app/Http/Controllers/Settings/AcademicYearController.php:55
 * @route '/settings/academic-years/{academicYear}'
 */
update.put = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Settings\AcademicYearController::update
 * @see app/Http/Controllers/Settings/AcademicYearController.php:55
 * @route '/settings/academic-years/{academicYear}'
 */
    const updateForm = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\AcademicYearController::update
 * @see app/Http/Controllers/Settings/AcademicYearController.php:55
 * @route '/settings/academic-years/{academicYear}'
 */
        updateForm.put = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Settings\AcademicYearController::destroy
 * @see app/Http/Controllers/Settings/AcademicYearController.php:63
 * @route '/settings/academic-years/{academicYear}'
 */
export const destroy = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/academic-years/{academicYear}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::destroy
 * @see app/Http/Controllers/Settings/AcademicYearController.php:63
 * @route '/settings/academic-years/{academicYear}'
 */
destroy.url = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { academicYear: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { academicYear: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    academicYear: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        academicYear: typeof args.academicYear === 'object'
                ? args.academicYear.id
                : args.academicYear,
                }

    return destroy.definition.url
            .replace('{academicYear}', parsedArgs.academicYear.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\AcademicYearController::destroy
 * @see app/Http/Controllers/Settings/AcademicYearController.php:63
 * @route '/settings/academic-years/{academicYear}'
 */
destroy.delete = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\AcademicYearController::destroy
 * @see app/Http/Controllers/Settings/AcademicYearController.php:63
 * @route '/settings/academic-years/{academicYear}'
 */
    const destroyForm = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\AcademicYearController::destroy
 * @see app/Http/Controllers/Settings/AcademicYearController.php:63
 * @route '/settings/academic-years/{academicYear}'
 */
        destroyForm.delete = (args: { academicYear: string | { id: string } } | [academicYear: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const academicYears = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default academicYears