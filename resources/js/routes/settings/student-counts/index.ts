import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\StudentCountController::index
 * @see app/Http/Controllers/Settings/StudentCountController.php:29
 * @route '/settings/student-counts'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/settings/student-counts',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\StudentCountController::index
 * @see app/Http/Controllers/Settings/StudentCountController.php:29
 * @route '/settings/student-counts'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\StudentCountController::index
 * @see app/Http/Controllers/Settings/StudentCountController.php:29
 * @route '/settings/student-counts'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\StudentCountController::index
 * @see app/Http/Controllers/Settings/StudentCountController.php:29
 * @route '/settings/student-counts'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\StudentCountController::index
 * @see app/Http/Controllers/Settings/StudentCountController.php:29
 * @route '/settings/student-counts'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\StudentCountController::index
 * @see app/Http/Controllers/Settings/StudentCountController.php:29
 * @route '/settings/student-counts'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\StudentCountController::index
 * @see app/Http/Controllers/Settings/StudentCountController.php:29
 * @route '/settings/student-counts'
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
* @see \App\Http\Controllers\Settings\StudentCountController::template
 * @see app/Http/Controllers/Settings/StudentCountController.php:73
 * @route '/settings/student-counts/template'
 */
export const template = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: template.url(options),
    method: 'get',
})

template.definition = {
    methods: ["get","head"],
    url: '/settings/student-counts/template',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Settings\StudentCountController::template
 * @see app/Http/Controllers/Settings/StudentCountController.php:73
 * @route '/settings/student-counts/template'
 */
template.url = (options?: RouteQueryOptions) => {
    return template.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\StudentCountController::template
 * @see app/Http/Controllers/Settings/StudentCountController.php:73
 * @route '/settings/student-counts/template'
 */
template.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: template.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Settings\StudentCountController::template
 * @see app/Http/Controllers/Settings/StudentCountController.php:73
 * @route '/settings/student-counts/template'
 */
template.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: template.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Settings\StudentCountController::template
 * @see app/Http/Controllers/Settings/StudentCountController.php:73
 * @route '/settings/student-counts/template'
 */
    const templateForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: template.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Settings\StudentCountController::template
 * @see app/Http/Controllers/Settings/StudentCountController.php:73
 * @route '/settings/student-counts/template'
 */
        templateForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: template.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Settings\StudentCountController::template
 * @see app/Http/Controllers/Settings/StudentCountController.php:73
 * @route '/settings/student-counts/template'
 */
        templateForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: template.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    template.form = templateForm
/**
* @see \App\Http\Controllers\Settings\StudentCountController::importMethod
 * @see app/Http/Controllers/Settings/StudentCountController.php:53
 * @route '/settings/student-counts/import'
 */
export const importMethod = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

importMethod.definition = {
    methods: ["post"],
    url: '/settings/student-counts/import',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\StudentCountController::importMethod
 * @see app/Http/Controllers/Settings/StudentCountController.php:53
 * @route '/settings/student-counts/import'
 */
importMethod.url = (options?: RouteQueryOptions) => {
    return importMethod.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\StudentCountController::importMethod
 * @see app/Http/Controllers/Settings/StudentCountController.php:53
 * @route '/settings/student-counts/import'
 */
importMethod.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: importMethod.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\StudentCountController::importMethod
 * @see app/Http/Controllers/Settings/StudentCountController.php:53
 * @route '/settings/student-counts/import'
 */
    const importMethodForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: importMethod.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\StudentCountController::importMethod
 * @see app/Http/Controllers/Settings/StudentCountController.php:53
 * @route '/settings/student-counts/import'
 */
        importMethodForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: importMethod.url(options),
            method: 'post',
        })
    
    importMethod.form = importMethodForm
/**
* @see \App\Http\Controllers\Settings\StudentCountController::destroy
 * @see app/Http/Controllers/Settings/StudentCountController.php:80
 * @route '/settings/student-counts'
 */
export const destroy = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/student-counts',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\StudentCountController::destroy
 * @see app/Http/Controllers/Settings/StudentCountController.php:80
 * @route '/settings/student-counts'
 */
destroy.url = (options?: RouteQueryOptions) => {
    return destroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\StudentCountController::destroy
 * @see app/Http/Controllers/Settings/StudentCountController.php:80
 * @route '/settings/student-counts'
 */
destroy.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\StudentCountController::destroy
 * @see app/Http/Controllers/Settings/StudentCountController.php:80
 * @route '/settings/student-counts'
 */
    const destroyForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url({
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\StudentCountController::destroy
 * @see app/Http/Controllers/Settings/StudentCountController.php:80
 * @route '/settings/student-counts'
 */
        destroyForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const studentCounts = {
    index: Object.assign(index, index),
template: Object.assign(template, template),
import: Object.assign(importMethod, importMethod),
destroy: Object.assign(destroy, destroy),
}

export default studentCounts