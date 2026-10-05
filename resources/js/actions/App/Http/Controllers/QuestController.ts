import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../wayfinder'
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
/**
* @see \App\Http\Controllers\QuestController::start
 * @see app/Http/Controllers/QuestController.php:45
 * @route '/quests/{quest}/attempts'
 */
export const start = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(args, options),
    method: 'post',
})

start.definition = {
    methods: ["post"],
    url: '/quests/{quest}/attempts',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuestController::start
 * @see app/Http/Controllers/QuestController.php:45
 * @route '/quests/{quest}/attempts'
 */
start.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return start.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuestController::start
 * @see app/Http/Controllers/QuestController.php:45
 * @route '/quests/{quest}/attempts'
 */
start.post = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuestController::start
 * @see app/Http/Controllers/QuestController.php:45
 * @route '/quests/{quest}/attempts'
 */
    const startForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: start.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuestController::start
 * @see app/Http/Controllers/QuestController.php:45
 * @route '/quests/{quest}/attempts'
 */
        startForm.post = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: start.url(args, options),
            method: 'post',
        })
    
    start.form = startForm
/**
* @see \App\Http\Controllers\QuestController::answer
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
export const answer = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: answer.url(args, options),
    method: 'post',
})

answer.definition = {
    methods: ["post"],
    url: '/quests/{quest}/answers',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuestController::answer
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
answer.url = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return answer.definition.url
            .replace('{quest}', parsedArgs.quest.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuestController::answer
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
answer.post = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: answer.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuestController::answer
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
    const answerForm = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: answer.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuestController::answer
 * @see app/Http/Controllers/QuestController.php:54
 * @route '/quests/{quest}/answers'
 */
        answerForm.post = (args: { quest: string | { id: string } } | [quest: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: answer.url(args, options),
            method: 'post',
        })
    
    answer.form = answerForm
const QuestController = { index, show, start, answer }

export default QuestController