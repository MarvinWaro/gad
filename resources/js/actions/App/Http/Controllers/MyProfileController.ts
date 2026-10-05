import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\MyProfileController::__invoke
 * @see app/Http/Controllers/MyProfileController.php:25
 * @route '/profile'
 */
const MyProfileController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: MyProfileController.url(options),
    method: 'get',
})

MyProfileController.definition = {
    methods: ["get","head"],
    url: '/profile',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MyProfileController::__invoke
 * @see app/Http/Controllers/MyProfileController.php:25
 * @route '/profile'
 */
MyProfileController.url = (options?: RouteQueryOptions) => {
    return MyProfileController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MyProfileController::__invoke
 * @see app/Http/Controllers/MyProfileController.php:25
 * @route '/profile'
 */
MyProfileController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: MyProfileController.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\MyProfileController::__invoke
 * @see app/Http/Controllers/MyProfileController.php:25
 * @route '/profile'
 */
MyProfileController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: MyProfileController.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\MyProfileController::__invoke
 * @see app/Http/Controllers/MyProfileController.php:25
 * @route '/profile'
 */
    const MyProfileControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: MyProfileController.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\MyProfileController::__invoke
 * @see app/Http/Controllers/MyProfileController.php:25
 * @route '/profile'
 */
        MyProfileControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: MyProfileController.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\MyProfileController::__invoke
 * @see app/Http/Controllers/MyProfileController.php:25
 * @route '/profile'
 */
        MyProfileControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: MyProfileController.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    MyProfileController.form = MyProfileControllerForm
export default MyProfileController