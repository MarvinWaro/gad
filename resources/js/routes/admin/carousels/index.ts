import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::index
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:21
 * @route '/admin/carousels'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/carousels',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::index
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:21
 * @route '/admin/carousels'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::index
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:21
 * @route '/admin/carousels'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::index
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:21
 * @route '/admin/carousels'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::index
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:21
 * @route '/admin/carousels'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::index
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:21
 * @route '/admin/carousels'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::index
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:21
 * @route '/admin/carousels'
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
* @see \App\Http\Controllers\Admin\CarouselSlideController::store
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:61
 * @route '/admin/carousels'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/carousels',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::store
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:61
 * @route '/admin/carousels'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::store
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:61
 * @route '/admin/carousels'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::store
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:61
 * @route '/admin/carousels'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::store
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:61
 * @route '/admin/carousels'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::update
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:80
 * @route '/admin/carousels/{carouselSlide}'
 */
export const update = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/admin/carousels/{carouselSlide}',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::update
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:80
 * @route '/admin/carousels/{carouselSlide}'
 */
update.url = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { carouselSlide: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { carouselSlide: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    carouselSlide: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        carouselSlide: typeof args.carouselSlide === 'object'
                ? args.carouselSlide.id
                : args.carouselSlide,
                }

    return update.definition.url
            .replace('{carouselSlide}', parsedArgs.carouselSlide.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::update
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:80
 * @route '/admin/carousels/{carouselSlide}'
 */
update.put = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

    /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::update
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:80
 * @route '/admin/carousels/{carouselSlide}'
 */
    const updateForm = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::update
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:80
 * @route '/admin/carousels/{carouselSlide}'
 */
        updateForm.put = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\Admin\CarouselSlideController::destroy
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:114
 * @route '/admin/carousels/{carouselSlide}'
 */
export const destroy = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/carousels/{carouselSlide}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::destroy
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:114
 * @route '/admin/carousels/{carouselSlide}'
 */
destroy.url = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { carouselSlide: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { carouselSlide: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    carouselSlide: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        carouselSlide: typeof args.carouselSlide === 'object'
                ? args.carouselSlide.id
                : args.carouselSlide,
                }

    return destroy.definition.url
            .replace('{carouselSlide}', parsedArgs.carouselSlide.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\CarouselSlideController::destroy
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:114
 * @route '/admin/carousels/{carouselSlide}'
 */
destroy.delete = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::destroy
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:114
 * @route '/admin/carousels/{carouselSlide}'
 */
    const destroyForm = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\CarouselSlideController::destroy
 * @see app/Http/Controllers/Admin/CarouselSlideController.php:114
 * @route '/admin/carousels/{carouselSlide}'
 */
        destroyForm.delete = (args: { carouselSlide: number | { id: number } } | [carouselSlide: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
const carousels = {
    index: Object.assign(index, index),
store: Object.assign(store, store),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default carousels