import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:61
 * @route '/admin/events/{event}/guests/{guest}/certificates'
 */
export const store = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/events/{event}/guests/{guest}/certificates',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:61
 * @route '/admin/events/{event}/guests/{guest}/certificates'
 */
store.url = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
                    event: args[0],
                    guest: args[1],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        event: typeof args.event === 'object'
                ? args.event.id
                : args.event,
                                guest: typeof args.guest === 'object'
                ? args.guest.id
                : args.guest,
                }

    return store.definition.url
            .replace('{event}', parsedArgs.event.toString())
            .replace('{guest}', parsedArgs.guest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:61
 * @route '/admin/events/{event}/guests/{guest}/certificates'
 */
store.post = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:61
 * @route '/admin/events/{event}/guests/{guest}/certificates'
 */
    const storeForm = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Admin\EventGuestController::store
 * @see app/Http/Controllers/Admin/EventGuestController.php:61
 * @route '/admin/events/{event}/guests/{guest}/certificates'
 */
        storeForm.post = (args: { event: number | { id: number }, guest: string | { id: string } } | [event: number | { id: number }, guest: string | { id: string } ], options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const certificates = {
    store: Object.assign(store, store),
}

export default certificates