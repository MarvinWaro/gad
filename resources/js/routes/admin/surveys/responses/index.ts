import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::index
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:25
 * @route '/admin/surveys/{survey}/responses'
 */
export const index = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/surveys/{survey}/responses',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::index
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:25
 * @route '/admin/surveys/{survey}/responses'
 */
index.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return index.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::index
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:25
 * @route '/admin/surveys/{survey}/responses'
 */
index.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::index
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:25
 * @route '/admin/surveys/{survey}/responses'
 */
index.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::index
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:25
 * @route '/admin/surveys/{survey}/responses'
 */
    const indexForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::index
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:25
 * @route '/admin/surveys/{survey}/responses'
 */
        indexForm.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::index
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:25
 * @route '/admin/surveys/{survey}/responses'
 */
        indexForm.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::exportMethod
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:58
 * @route '/admin/surveys/{survey}/responses/export'
 */
export const exportMethod = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(args, options),
    method: 'get',
})

exportMethod.definition = {
    methods: ["get","head"],
    url: '/admin/surveys/{survey}/responses/export',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::exportMethod
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:58
 * @route '/admin/surveys/{survey}/responses/export'
 */
exportMethod.url = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return exportMethod.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::exportMethod
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:58
 * @route '/admin/surveys/{survey}/responses/export'
 */
exportMethod.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportMethod.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::exportMethod
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:58
 * @route '/admin/surveys/{survey}/responses/export'
 */
exportMethod.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportMethod.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::exportMethod
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:58
 * @route '/admin/surveys/{survey}/responses/export'
 */
    const exportMethodForm = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportMethod.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::exportMethod
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:58
 * @route '/admin/surveys/{survey}/responses/export'
 */
        exportMethodForm.get = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::exportMethod
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:58
 * @route '/admin/surveys/{survey}/responses/export'
 */
        exportMethodForm.head = (args: { survey: number | { id: number } } | [survey: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportMethod.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportMethod.form = exportMethodForm
/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::show
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:45
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
export const show = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/surveys/{survey}/responses/{surveyResponse}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::show
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:45
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
show.url = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                    surveyResponse: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                                surveyResponse: typeof args.surveyResponse === 'object'
                ? args.surveyResponse.id
                : args.surveyResponse,
                }

    return show.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace('{surveyResponse}', parsedArgs.surveyResponse.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::show
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:45
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
show.get = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::show
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:45
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
show.head = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::show
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:45
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
    const showForm = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::show
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:45
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
        showForm.get = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::show
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:45
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
        showForm.head = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::destroy
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:108
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
export const destroy = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/surveys/{survey}/responses/{surveyResponse}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::destroy
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:108
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
destroy.url = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    survey: args[0],
                    surveyResponse: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        survey: typeof args.survey === 'object'
                ? args.survey.id
                : args.survey,
                                surveyResponse: typeof args.surveyResponse === 'object'
                ? args.surveyResponse.id
                : args.surveyResponse,
                }

    return destroy.definition.url
            .replace('{survey}', parsedArgs.survey.toString())
            .replace('{surveyResponse}', parsedArgs.surveyResponse.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\SurveyResponseController::destroy
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:108
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
destroy.delete = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::destroy
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:108
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
    const destroyForm = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\SurveyResponseController::destroy
 * @see app/Http/Controllers/Admin/SurveyResponseController.php:108
 * @route '/admin/surveys/{survey}/responses/{surveyResponse}'
 */
        destroyForm.delete = (args: { survey: number | { id: number }, surveyResponse: string | { id: string } } | [survey: number | { id: number }, surveyResponse: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const responses = {
    index: Object.assign(index, index),
export: Object.assign(exportMethod, exportMethod),
show: Object.assign(show, show),
destroy: Object.assign(destroy, destroy),
}

export default responses