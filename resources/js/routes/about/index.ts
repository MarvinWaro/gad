import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/about/gad-herstory'
 */
export const herstory = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: herstory.url(options),
    method: 'get',
})

herstory.definition = {
    methods: ["get","head"],
    url: '/about/gad-herstory',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/about/gad-herstory'
 */
herstory.url = (options?: RouteQueryOptions) => {
    return herstory.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/about/gad-herstory'
 */
herstory.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: herstory.url(options),
    method: 'get',
})
/**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/about/gad-herstory'
 */
herstory.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: herstory.url(options),
    method: 'head',
})

    /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/about/gad-herstory'
 */
    const herstoryForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: herstory.url(options),
        method: 'get',
    })

            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/about/gad-herstory'
 */
        herstoryForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: herstory.url(options),
            method: 'get',
        })
            /**
* @see \Inertia\Controller::__invoke
 * @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
 * @route '/about/gad-herstory'
 */
        herstoryForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: herstory.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    herstory.form = herstoryForm
const about = {
    herstory: Object.assign(herstory, herstory),
}

export default about