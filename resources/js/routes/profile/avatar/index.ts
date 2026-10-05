import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::update
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:21
 * @route '/settings/profile/avatar'
 */
export const update = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

update.definition = {
    methods: ["post"],
    url: '/settings/profile/avatar',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::update
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:21
 * @route '/settings/profile/avatar'
 */
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::update
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:21
 * @route '/settings/profile/avatar'
 */
update.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: update.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::update
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:21
 * @route '/settings/profile/avatar'
 */
    const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::update
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:21
 * @route '/settings/profile/avatar'
 */
        updateForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(options),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::destroy
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:53
 * @route '/settings/profile/avatar'
 */
export const destroy = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/settings/profile/avatar',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::destroy
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:53
 * @route '/settings/profile/avatar'
 */
destroy.url = (options?: RouteQueryOptions) => {
    return destroy.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::destroy
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:53
 * @route '/settings/profile/avatar'
 */
destroy.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\Settings\ProfileAvatarController::destroy
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:53
 * @route '/settings/profile/avatar'
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
* @see \App\Http\Controllers\Settings\ProfileAvatarController::destroy
 * @see app/Http/Controllers/Settings/ProfileAvatarController.php:53
 * @route '/settings/profile/avatar'
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
const avatar = {
    update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
}

export default avatar