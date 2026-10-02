import { Link } from '@inertiajs/react';
import { ArrowRight, Target } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AgendaTile, SdgCredit } from '@/components/hei/post-goals';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { achieveAgenda, achievePage } from '@/data/achieve';
import { sustainableGoals } from '@/data/sdgs';
import { formatCount, heatLevel, percentOf } from '@/lib/dashboard';
import { underlineTabs } from '@/lib/underline-tabs';
import { cn } from '@/lib/utils';
import type { DashboardProps, GoalFigures } from '@/types/dashboard';

type GoalSet = 'sdg' | 'achieve';

/** One goal as the section shows it. */
type Goal = {
    code: string;
    /** "SDG 5", or the agenda letter. */
    short: string;
    name: string;
    /** The whole SDG icon, or the agenda item's letter tile. */
    mark: (className: string) => ReactNode;
};

const goalSets: Record<GoalSet, { noun: string; goals: Goal[] }> = {
    sdg: {
        noun: 'goals',
        goals: sustainableGoals.map((goal) => ({
            code: String(goal.number),
            short: `SDG ${goal.number}`,
            name: goal.name,
            // Whole and square, never rounded or covered: the UN's icon rules.
            mark: (className) => (
                <img
                    src={goal.image}
                    alt=""
                    width={320}
                    height={320}
                    decoding="async"
                    className={cn('shrink-0', className)}
                />
            ),
        })),
    },
    achieve: {
        noun: 'items',
        goals: achieveAgenda.map((item) => ({
            code: item.code,
            short: item.letter,
            name: item.title,
            mark: (className) => (
                <AgendaTile item={item} className={className} />
            ),
        })),
    },
};

const heatClasses = [
    'text-muted-foreground',
    'bg-heat-1 text-heat-ink',
    'bg-heat-2 text-heat-ink',
    'bg-heat-3 text-heat-ink-strong',
    'bg-heat-4 text-heat-ink-strong',
] as const;

/**
 * The dashboard's main section: which goals the network's posts support,
 * and where. Each tab ranks its goals, names the regions and HEIs leading
 * the chosen one, and maps every goal against places in a heatmap.
 */
export function GoalInsights({
    goals,
    period,
    postsHref,
}: {
    goals: DashboardProps['goals'];
    period: string;
    /** Where to read the posts, for accounts that may. */
    postsHref?: string;
}) {
    return (
        <section
            aria-labelledby="goals-title"
            className="min-w-0 rounded-xl border bg-card md:col-span-2 xl:col-span-12"
        >
            <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
                <div>
                    <h2 id="goals-title" className="text-lg font-medium">
                        Where GAD work meets the goals
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Original posts tagged with the Sustainable Development
                        Goals and CHED's A.C.H.I.E.V.E. Agenda · {period}
                    </p>
                </div>
                <Target aria-hidden className="size-5 text-brand" />
            </div>
            <Tabs defaultValue="sdg" className="mt-4 gap-0">
                <TabsList
                    aria-label="Goal set"
                    className={cn(underlineTabs.list, 'px-3 sm:px-4')}
                >
                    <TabsTrigger value="sdg" className={underlineTabs.tab}>
                        SDGs
                    </TabsTrigger>
                    <TabsTrigger value="achieve" className={underlineTabs.tab}>
                        A.C.H.I.E.V.E. Agenda
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="sdg">
                    <GoalPanel
                        set="sdg"
                        figures={goals.sdg}
                        postsHref={postsHref}
                    />
                </TabsContent>
                <TabsContent value="achieve">
                    <GoalPanel
                        set="achieve"
                        figures={goals.achieve}
                        postsHref={postsHref}
                    />
                </TabsContent>
            </Tabs>
        </section>
    );
}

function GoalPanel({
    set,
    figures,
    postsHref,
}: {
    set: GoalSet;
    figures: GoalFigures;
    postsHref?: string;
}) {
    const [selected, setSelected] = useState('all');
    const [byOrder, setByOrder] = useState(false);
    const [showEmpty, setShowEmpty] = useState(false);
    const { noun, goals } = goalSets[set];
    const counts = new Map(
        figures.items.map((item) => [item.code, item.posts]),
    );
    const count = (code: string) => counts.get(code) ?? 0;
    const ranked = byOrder
        ? goals
        : [...goals].sort((a, b) => count(b.code) - count(a.code));
    // Ranked by posts, the ones without any wait behind a button.
    const empty = goals.filter((goal) => count(goal.code) === 0).length;
    const listed =
        byOrder || showEmpty
            ? ranked
            : ranked.filter((goal) => count(goal.code) > 0);
    const max = Math.max(1, ...goals.map((goal) => count(goal.code)));
    const chosen = goals.find((goal) => goal.code === selected) ?? null;

    if (figures.totals.posts === 0) {
        return (
            <div className="p-5 sm:p-6">
                <div className="flex flex-col items-center rounded-lg bg-muted px-6 py-10 text-center">
                    <Target
                        aria-hidden
                        className="size-6 text-muted-foreground"
                    />
                    <p className="mt-3 font-medium">
                        No posts carry{' '}
                        {set === 'sdg' ? 'an SDG' : 'an A.C.H.I.E.V.E. item'} in
                        this period yet
                    </p>
                    <p className="mt-1 max-w-md text-sm text-muted-foreground">
                        When HEIs and CHED offices tag their Gender
                        Mainstreaming posts, the {noun} they support rank here,
                        with the regions and schools leading each one.
                    </p>
                </div>
                <GoalFootnotes set={set} />
            </div>
        );
    }

    return (
        <div className="p-5 sm:p-6">
            <dl className="grid grid-cols-3 gap-3 rounded-lg bg-muted p-4">
                {[
                    ['Tagged posts', formatCount(figures.totals.posts)],
                    [
                        `${set === 'sdg' ? 'Goals' : 'Items'} covered`,
                        `${figures.totals.covered} of ${goals.length}`,
                    ],
                    ['HEIs contributing', formatCount(figures.totals.heis)],
                ].map(([label, value]) => (
                    <div key={label} className="min-w-0">
                        <dt className="text-xs text-muted-foreground">
                            {label}
                        </dt>
                        <dd className="mt-1 text-xl font-medium tabular-nums">
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-6 grid gap-6 xl:grid-cols-12">
                <div className="min-w-0 xl:col-span-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">
                            {set === 'sdg' ? 'Goals' : 'Agenda items'} by posts
                        </h3>
                        <div
                            role="group"
                            aria-label="Sort"
                            className="inline-flex rounded-lg bg-muted p-1"
                        >
                            {(
                                [
                                    [false, 'Most posts'],
                                    [
                                        true,
                                        set === 'sdg'
                                            ? 'Goal order'
                                            : 'Agenda order',
                                    ],
                                ] as const
                            ).map(([order, label]) => (
                                <button
                                    key={label}
                                    type="button"
                                    aria-pressed={byOrder === order}
                                    onClick={() => setByOrder(order)}
                                    className={cn(
                                        'min-h-8 rounded-md px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                        byOrder === order
                                            ? 'bg-card font-medium text-foreground shadow-xs'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Choose one to see where it happens.
                    </p>
                    <ul
                        aria-label={set === 'sdg' ? 'Goals' : 'Agenda items'}
                        className="mt-3 space-y-1"
                    >
                        {listed.map((goal) => {
                            const posts = count(goal.code);
                            const pressed = selected === goal.code;
                            return (
                                <li key={goal.code}>
                                    <button
                                        type="button"
                                        aria-pressed={pressed}
                                        onClick={() =>
                                            setSelected(
                                                pressed ? 'all' : goal.code,
                                            )
                                        }
                                        className={cn(
                                            'grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50',
                                            pressed &&
                                                'bg-muted ring-2 ring-foreground',
                                        )}
                                    >
                                        {goal.mark('size-10')}
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm">
                                                <span className="text-muted-foreground">
                                                    {set === 'sdg'
                                                        ? goal.short.replace(
                                                              'SDG ',
                                                              '',
                                                          )
                                                        : goal.short}
                                                    {' · '}
                                                </span>
                                                {goal.name}
                                            </span>
                                            <span
                                                aria-hidden
                                                className="mt-1.5 block h-2 overflow-hidden rounded-r-[4px] bg-muted"
                                            >
                                                <span
                                                    className="block h-full rounded-r-[4px] bg-chart-bar"
                                                    style={{
                                                        width: `${(posts / max) * 100}%`,
                                                    }}
                                                />
                                            </span>
                                        </span>
                                        <span className="w-20 text-right text-sm tabular-nums">
                                            <span
                                                className={cn(
                                                    'font-medium',
                                                    posts === 0 &&
                                                        'text-muted-foreground',
                                                )}
                                            >
                                                {formatCount(posts)}
                                            </span>
                                            <span className="block text-xs text-muted-foreground">
                                                {percentOf(
                                                    posts,
                                                    figures.totals.posts,
                                                )}
                                                % of posts
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {!byOrder && empty > 0 && (
                        <button
                            type="button"
                            aria-expanded={showEmpty}
                            onClick={() => setShowEmpty(!showEmpty)}
                            className="mt-2 min-h-9 rounded-sm px-2 text-sm text-muted-foreground underline underline-offset-2 outline-none hover:text-foreground hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            {showEmpty
                                ? `Hide the ${noun} with no posts yet`
                                : `Show the ${empty} ${empty === 1 ? noun.replace(/s$/, '') : noun} with no posts yet`}
                        </button>
                    )}
                </div>

                <GoalDetails
                    goal={chosen}
                    figures={figures}
                    posts={chosen ? count(chosen.code) : figures.totals.posts}
                    postsHref={postsHref}
                    onClear={() => setSelected('all')}
                />
            </div>

            <GoalHeatmap set={set} figures={figures} selected={selected} />
            <GoalFootnotes
                set={set}
                centralNote={figures.places.level === 'region'}
            />
        </div>
    );
}

/** Where the chosen goal (or all of them) happens: top regions and HEIs. */
function GoalDetails({
    goal,
    figures,
    posts,
    postsHref,
    onClear,
}: {
    goal: Goal | null;
    figures: GoalFigures;
    posts: number;
    postsHref?: string;
    onClear: () => void;
}) {
    const key = goal?.code ?? 'all';
    const regions =
        figures.places.level === 'region'
            ? figures.places.rows
                  .map((row) => ({
                      ...row,
                      value: goal ? (row.counts[key] ?? 0) : row.total,
                  }))
                  .filter((row) => row.value > 0)
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)
            : [];
    const office = figures.places.rows.find((row) => row.kind === 'office');
    const officePosts = office
        ? goal
            ? (office.counts[key] ?? 0)
            : office.total
        : 0;
    const heis = figures.top_heis[key] ?? [];
    const regionMax = Math.max(1, ...regions.map((row) => row.value));

    return (
        <aside
            aria-labelledby="goal-details-title"
            className="min-w-0 self-start rounded-lg border p-4 xl:sticky xl:top-[calc(var(--app-header,0px)+1rem)] xl:col-span-5"
        >
            <div className="flex items-start gap-3">
                {goal?.mark('size-12')}
                <div aria-live="polite" className="min-w-0 flex-1">
                    <h3 id="goal-details-title" className="font-medium">
                        {goal ? `${goal.short} · ${goal.name}` : 'All goals'}
                    </h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatCount(posts)} {posts === 1 ? 'post' : 'posts'}
                        {goal &&
                            ` · ${percentOf(posts, figures.totals.posts)}% of tagged posts`}
                    </p>
                </div>
                {goal && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="shrink-0 rounded-sm text-xs underline underline-offset-2 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        Show all
                    </button>
                )}
            </div>

            {posts === 0 ? (
                <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    No posts on this one in this period yet. It may be worth
                    encouraging, if it fits the network's GAD plans.
                </p>
            ) : (
                <>
                    {regions.length > 0 && (
                        <>
                            <h4 className="mt-5 text-xs font-medium text-muted-foreground">
                                Top regions
                            </h4>
                            <ol className="mt-2 space-y-2.5">
                                {regions.map((row) => (
                                    <li key={row.id} className="text-sm">
                                        <span className="flex justify-between gap-3">
                                            <span className="truncate">
                                                {row.name}
                                            </span>
                                            <span className="font-medium tabular-nums">
                                                {formatCount(row.value)}
                                            </span>
                                        </span>
                                        <span
                                            aria-hidden
                                            className="mt-1 block h-2 overflow-hidden rounded-r-[4px] bg-muted"
                                        >
                                            <span
                                                className="block h-full rounded-r-[4px] bg-chart-bar"
                                                style={{
                                                    width: `${(row.value / regionMax) * 100}%`,
                                                }}
                                            />
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </>
                    )}
                    <h4 className="mt-5 text-xs font-medium text-muted-foreground">
                        Top HEIs
                    </h4>
                    {heis.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                            Only CHED office posts so far.
                        </p>
                    ) : (
                        <ol className="mt-2 divide-y">
                            {heis.map((hei, index) => (
                                <li
                                    key={hei.id}
                                    className="flex items-center gap-3 py-2 text-sm"
                                >
                                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium tabular-nums">
                                        {index + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate">
                                            {hei.name}
                                        </span>
                                        {figures.places.level === 'region' &&
                                            hei.region && (
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {hei.region}
                                                </span>
                                            )}
                                    </span>
                                    <span className="font-medium tabular-nums">
                                        {formatCount(hei.posts)}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                    {office && officePosts > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Plus {formatCount(officePosts)} from the CHED
                            office, {office.name}.
                        </p>
                    )}
                </>
            )}
            {postsHref && (
                <Link
                    href={postsHref}
                    className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                    Read the posts in Gender Mainstreaming
                    <ArrowRight aria-hidden className="size-4" />
                </Link>
            )}
        </aside>
    );
}

/**
 * Every goal against every place one level below the view: regions, or a
 * region's HEIs and its CHED office. Figures are always printed; the shade
 * only repeats them.
 */
function GoalHeatmap({
    set,
    figures,
    selected,
}: {
    set: GoalSet;
    figures: GoalFigures;
    selected: string;
}) {
    const { level, rows } = figures.places;

    if (level === null || rows.length === 0) {
        return null;
    }

    const goals = goalSets[set].goals;
    const max = Math.max(
        1,
        ...rows.flatMap((row) => Object.values(row.counts)),
    );
    const placeLabel = level === 'region' ? 'Region' : 'HEI';

    return (
        <div className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h3 className="text-sm font-medium">
                        {set === 'sdg' ? 'Goals' : 'Agenda items'} by{' '}
                        {level === 'region' ? 'region' : 'HEI'}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {level === 'region'
                            ? 'Posts per region on each one. Darker means more.'
                            : `${heiRowsLabel(rows.filter((row) => row.kind === 'hei').length)}${rows.some((row) => row.kind === 'office') ? ', and the CHED office' : ''}. Darker means more.`}
                    </p>
                </div>
                <div
                    aria-hidden
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                    Fewer
                    {heatClasses.slice(1).map((shade) => (
                        <span
                            key={shade}
                            className={cn('size-4 rounded-[3px]', shade)}
                        />
                    ))}
                    More
                </div>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg border">
                <table className="w-full border-separate border-spacing-0.5 text-xs tabular-nums">
                    <caption className="sr-only">
                        Tagged posts by {placeLabel.toLowerCase()} and{' '}
                        {set === 'sdg' ? 'goal' : 'agenda item'}
                    </caption>
                    <thead>
                        <tr>
                            <th
                                scope="col"
                                className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-medium"
                            >
                                {placeLabel}
                            </th>
                            {goals.map((goal) => (
                                <th
                                    key={goal.code}
                                    scope="col"
                                    className={cn(
                                        'min-w-8 rounded-[3px] px-1 py-2 text-center font-medium',
                                        selected === goal.code &&
                                            'bg-foreground text-background',
                                    )}
                                >
                                    <abbr
                                        title={`${goal.short} · ${goal.name}`}
                                        className="no-underline"
                                    >
                                        {set === 'sdg' ? goal.code : goal.short}
                                    </abbr>
                                </th>
                            ))}
                            <th
                                scope="col"
                                className="px-2 py-2 text-right font-medium"
                            >
                                Posts
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={`${row.kind}-${row.id}`}>
                                <th
                                    scope="row"
                                    className="sticky left-0 z-10 max-w-48 truncate bg-card px-2 py-1.5 text-left font-normal"
                                    title={row.name}
                                >
                                    {row.kind === 'office'
                                        ? `CHED · ${row.name}`
                                        : row.name}
                                </th>
                                {goals.map((goal) => {
                                    const value = row.counts[goal.code] ?? 0;
                                    return (
                                        <td
                                            key={goal.code}
                                            title={`${row.name} · ${goal.short}: ${formatCount(value)}`}
                                            className={cn(
                                                'h-8 rounded-[3px] text-center',
                                                heatClasses[
                                                    heatLevel(value, max)
                                                ],
                                                selected === goal.code &&
                                                    'outline-2 -outline-offset-2 outline-foreground',
                                            )}
                                        >
                                            {value === 0 ? (
                                                <>
                                                    <span aria-hidden>·</span>
                                                    <span className="sr-only">
                                                        0
                                                    </span>
                                                </>
                                            ) : (
                                                formatCount(value)
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="px-2 text-right font-medium">
                                    {formatCount(row.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function heiRowsLabel(count: number): string {
    return count === 1
        ? 'The HEI with tagged posts'
        : `The ${count} HEIs with the most tagged posts`;
}

function GoalFootnotes({
    set,
    centralNote = false,
}: {
    set: GoalSet;
    centralNote?: boolean;
}) {
    return (
        <div className="mt-5 space-y-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">
                A post can carry up to three{' '}
                {set === 'sdg' ? 'goals' : 'agenda items'}, so they add up to
                more than the posts. Shares are not counted.
                {centralNote &&
                    ' Central Office posts count in the totals, not in any region.'}
            </p>
            {set === 'sdg' ? (
                <SdgCredit />
            ) : (
                <p className="text-xs text-muted-foreground">
                    <a
                        href={achievePage}
                        className="rounded-sm text-foreground underline underline-offset-2 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                        About CHED's A.C.H.I.E.V.E. Agenda
                    </a>
                </p>
            )}
        </div>
    );
}
