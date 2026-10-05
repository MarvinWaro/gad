import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
import manage from './manage'
import attempts from './attempts'
import answers from './answers'
/**
* @see \App\Http\Controllers\QuestController::index
 * @see app/Http/Controllers/QuestController.php:22
 * @route '/quests'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/quests',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuestController::index
 * @see app/Http/Controllers/QuestController.php:22
 * @route '/quests'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuestController::index
 * @see app/Http/Controllers/QuestController.php:22
 * @route '/quests'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuestController::index
 * @see app/Http/Controllers/QuestController.php:22
 * @route '/quests'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuestController::index
 * @see app/Http/Controllers/QuestController.php:22
 * @route '/quests'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuestController::index
 * @see app/Http/Controllers/QuestController.php:22
 * @route '/quests'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuestController::index
 * @see app/Http/Controllers/QuestController.php:22
 * @route '/quests'
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
* @see \App\Http\Controllers\QuestController::show
 * @see app/Http/Controllers/QuestController.php:34
 * @route '/quests/{quest}'
 */
export const show = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/quests/{quest}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuestController::show
 * @see app/Http/Controllers/QuestController.php:34
 * @route '/quests/{quest}'
 */
show.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuestController::show
 * @see app/Http/Controllers/QuestController.php:34
 * @route '/quests/{quest}'
 */
show.get = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuestController::show
 * @see app/Http/Controllers/QuestController.php:34
 * @route '/quests/{quest}'
 */
show.head = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuestController::show
 * @see app/Http/Controllers/QuestController.php:34
 * @route '/quests/{quest}'
 */
    const showForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuestController::show
 * @see app/Http/Controllers/QuestController.php:34
 * @route '/quests/{quest}'
 */
        showForm.get = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuestController::show
 * @see app/Http/Controllers/QuestController.php:34
 * @route '/quests/{quest}'
 */
        showForm.head = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
const quests = {
    manage: Object.assign(manage, manage),
index: Object.assign(index, index),
show: Object.assign(show, show),
attempts: Object.assign(attempts, attempts),
answers: Object.assign(answers, answers),
}

export default quests