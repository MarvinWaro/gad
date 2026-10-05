import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\QuestController::store
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
export const store = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/quests/{quest}/answers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuestController::store
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
store.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quest: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quest: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quest: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quest: typeof args.quest === 'object'
                ? args.quest.id
                : args.quest,
                }

    return store.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuestController::store
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
store.post = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuestController::store
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
    const storeForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuestController::store
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
        storeForm.post = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(args, options),
            method: 'post',
        })
    
    store.form = storeForm
const answers = {
    store: Object.assign(store, store),
}

export default answers