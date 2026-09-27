import {
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent,
} from 'react';
import { Info } from 'lucide-react';
import {
    GlossaryEmpty,
    GlossaryGroupSection,
    GlossaryToolbar,
} from '@/components/resources/glossary';
import { ResourcePage } from '@/components/resources/resource-page';
import { glossary, type GlossaryTerm } from '@/data/definition-of-terms';
import { laws } from '@/data/phlgadis-demo';
import { filterGlossary, tokenize } from '@/lib/glossary';
import '../../../css/public.css';

const lawsBySlug = new Map(laws.map((law) => [law.slug, law]));
const allTerms = glossary.flatMap((group) => group.terms);
const termsBySlug = new Map(allTerms.map((term) => [term.slug, term]));
const termCounts = new Map(
    glossary.map((group) => [group.law, group.terms.length]),
);
const formsOf = new Map<string, GlossaryTerm[]>();
for (const term of allTerms) {
    if (!term.partOf) continue;
    formsOf.set(term.partOf, [...(formsOf.get(term.partOf) ?? []), term]);
}

function scrollBehavior(): ScrollBehavior {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth';
}

export default function DefinitionOfTerms() {
    const [query, setQuery] = useState('');
    const [activeLaw, setActiveLaw] = useState<string | null>(null);
    const [targeted, setTargeted] = useState<string | null>(null);
    const deferredQuery = useDeferredValue(query);
    const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);
    const groups = useMemo(() => filterGlossary(glossary, tokens), [tokens]);
    const shown = groups.reduce((sum, group) => sum + group.terms.length, 0);
    const inputRef = useRef<HTMLInputElement>(null);
    const toolbarAnchorRef = useRef<HTMLDivElement>(null);
    const groupsRef = useRef<HTMLDivElement>(null);
    const pendingTarget = useRef<string | null>(null);
    const listed = useRef(false);

    const goTo = (id: string, behavior: ScrollBehavior = scrollBehavior()) => {
        const target = document.getElementById(id);
        if (!target) return false;
        if (window.location.hash !== `#${id}`) {
            window.history.pushState(window.history.state, '', `#${id}`);
        }
        target.scrollIntoView({ behavior, block: 'start' });
        // Clear first so opening the same term again replays its tint.
        setTargeted(null);
        window.requestAnimationFrame(() => setTargeted(id));
        return true;
    };

    // In-page links scroll smoothly and keep Inertia's history state. A link
    // to a term hidden by the current search clears the search first.
    const handleAnchorClick = (event: MouseEvent<HTMLElement>) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        )
            return;
        const anchor = (event.target as Element).closest('a[href^="#"]');
        const hash = anchor?.getAttribute('href');
        if (!hash || hash === '#') return;

        event.preventDefault();
        const id = hash.slice(1);
        if (goTo(id)) return;
        if (termsBySlug.has(id) || lawsBySlug.has(id)) {
            pendingTarget.current = id;
            setQuery('');
        }
    };

    useEffect(() => {
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (id && document.getElementById(id)) goTo(id, 'instant');

        const onPopState = () =>
            setTargeted(
                decodeURIComponent(window.location.hash.slice(1)) || null,
            );
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    // "/" jumps to the search box from anywhere on the page.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.key !== '/' ||
                event.defaultPrevented ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey
            )
                return;
            const target = event.target as HTMLElement | null;
            if (
                target?.closest(
                    'input, textarea, select, [contenteditable="true"]',
                )
            )
                return;
            event.preventDefault();
            inputRef.current?.focus();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    // After a search changes the list, bring its start back under the
    // toolbar so results never begin somewhere off screen.
    useEffect(() => {
        if (pendingTarget.current) {
            const id = pendingTarget.current;
            if (goTo(id)) pendingTarget.current = null;
            return;
        }
        if (!listed.current) {
            listed.current = true;
            return;
        }
        const anchor = toolbarAnchorRef.current;
        const header = document.querySelector('.site-header');
        if (
            anchor &&
            anchor.getBoundingClientRect().top <
                (header?.getBoundingClientRect().bottom ?? 0)
        ) {
            anchor.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
    }, [groups]);

    // Mark the law whose group is under the toolbar as the current one.
    useEffect(() => {
        let frame = 0;
        const update = () => {
            frame = 0;
            const sections =
                groupsRef.current?.querySelectorAll<HTMLElement>(
                    '.glossary-group',
                ) ?? [];
            const header = document.querySelector('.site-header');
            const toolbar = document.querySelector('.glossary-toolbar');
            const line =
                Math.max(
                    header?.getBoundingClientRect().bottom ?? 0,
                    toolbar?.getBoundingClientRect().bottom ?? 0,
                ) + 32;
            let current: string | null = null;
            for (const section of sections) {
                if (section.getBoundingClientRect().top <= line) {
                    current = section.id;
                }
            }
            const atBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 2;
            if (atBottom && current && sections.length > 0) {
                current = sections[sections.length - 1].id;
            }
            setActiveLaw(current);
        };
        const schedule = () => {
            if (!frame) frame = window.requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, [groups]);

    return (
        <ResourcePage
            title="Definition of Terms"
            description="Key terms from the GAD enabling laws, as each Act defines them. Search for a word, or browse by law."
            summary={`${allTerms.length} terms from ${glossary.length} laws`}
            metaDescription="Key gender and development terms from RA 9262, RA 9710 and RA 11313, as each Act defines them."
            onMainClick={handleAnchorClick}
        >
            <div ref={toolbarAnchorRef} className="glossary-toolbar-anchor" />
            <GlossaryToolbar
                query={query}
                onQueryChange={setQuery}
                inputRef={inputRef}
                groups={groups}
                laws={lawsBySlug}
                activeLaw={activeLaw}
                shown={shown}
                total={allTerms.length}
            />
            <div
                ref={groupsRef}
                id="glossary"
                className="public-container glossary-groups"
            >
                {shown === 0 ? (
                    <GlossaryEmpty query={query} onQueryChange={setQuery} />
                ) : (
                    groups.map((group) => {
                        const law = lawsBySlug.get(group.law);
                        if (!law || group.terms.length === 0) return null;

                        return (
                            <GlossaryGroupSection
                                key={group.law}
                                group={group}
                                law={law}
                                termCount={termCounts.get(group.law) ?? 0}
                                tokens={tokens}
                                targeted={targeted}
                                termsBySlug={termsBySlug}
                                formsOf={formsOf}
                            />
                        );
                    })
                )}
                <p className="glossary-note">
                    <Info aria-hidden="true" />
                    Definitions are reproduced from each Act for learning and
                    reference. For legal use, consult the official text of the
                    law.
                </p>
            </div>
        </ResourcePage>
    );
}
