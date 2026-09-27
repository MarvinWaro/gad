import { useEffect, useState, type Ref } from 'react';
import { ArrowUpRight, Check, Link2, Search, SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GlossaryGroup, GlossaryTerm } from '@/data/definition-of-terms';
import type { LawRecord } from '@/data/phlgadis-demo';
import { highlightParts } from '@/lib/glossary';
import { documentHint } from './resource-page';

export const searchSuggestions = ['gender', 'violence', 'harassment'];

export function Highlight({
    text,
    tokens,
}: {
    text: string;
    tokens: string[];
}) {
    return highlightParts(text, tokens).map((part, index) =>
        part.match ? (
            <mark key={index} className="glossary-mark">
                {part.text}
            </mark>
        ) : (
            part.text
        ),
    );
}

export function GlossaryToolbar({
    query,
    onQueryChange,
    inputRef,
    groups,
    laws,
    activeLaw,
    shown,
    total,
}: {
    query: string;
    onQueryChange: (query: string) => void;
    inputRef: Ref<HTMLInputElement>;
    groups: GlossaryGroup[];
    laws: Map<string, LawRecord>;
    activeLaw: string | null;
    shown: number;
    total: number;
}) {
    const searching = query.trim() !== '';

    return (
        <div className="glossary-toolbar">
            <div className="public-container glossary-toolbar-inner">
                <form
                    role="search"
                    className="glossary-search"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <label htmlFor="glossary-search" className="sr-only">
                        Search terms and definitions
                    </label>
                    <Search aria-hidden="true" />
                    <Input
                        ref={inputRef}
                        id="glossary-search"
                        type="search"
                        value={query}
                        placeholder="Search terms and definitions"
                        autoComplete="off"
                        spellCheck={false}
                        enterKeyHint="search"
                        onChange={(event) => onQueryChange(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape' && query !== '') {
                                event.preventDefault();
                                onQueryChange('');
                            }
                        }}
                    />
                    {query !== '' ? (
                        <button
                            type="button"
                            className="glossary-clear"
                            aria-label="Clear search"
                            onClick={() => onQueryChange('')}
                        >
                            <X aria-hidden="true" />
                        </button>
                    ) : (
                        <kbd className="glossary-kbd" aria-hidden="true">
                            /
                        </kbd>
                    )}
                </form>
                <nav className="glossary-laws" aria-label="Laws on this page">
                    {groups.map((group) => {
                        const law = laws.get(group.law);
                        if (!law) return null;
                        const count = group.terms.length;

                        return (
                            <a
                                key={group.law}
                                href={`#${group.law}`}
                                aria-current={
                                    activeLaw === group.law ? 'true' : undefined
                                }
                                data-empty={
                                    searching && count === 0 ? '' : undefined
                                }
                            >
                                {law.number}
                                <span className="glossary-count">
                                    {count}
                                    <span className="sr-only">
                                        {count === 1 ? ' term' : ' terms'}
                                    </span>
                                </span>
                            </a>
                        );
                    })}
                </nav>
                <p
                    className="glossary-status"
                    data-searching={searching ? '' : undefined}
                    aria-live="polite"
                >
                    {searching
                        ? `Showing ${shown} of ${total} terms`
                        : `${total} terms`}
                </p>
            </div>
        </div>
    );
}

export function GlossaryGroupSection({
    group,
    law,
    termCount,
    tokens,
    targeted,
    termsBySlug,
    formsOf,
}: {
    group: GlossaryGroup;
    law: LawRecord;
    termCount: number;
    tokens: string[];
    targeted: string | null;
    termsBySlug: Map<string, GlossaryTerm>;
    formsOf: Map<string, GlossaryTerm[]>;
}) {
    const shown = group.terms.length;

    return (
        <section
            id={group.law}
            className="glossary-group"
            aria-labelledby={`${group.law}-title`}
        >
            <header className="glossary-group-head">
                <div>
                    <span className="law-number">{law.number}</span>
                    <h2 id={`${group.law}-title`}>{law.title}</h2>
                    <p>
                        {group.section} ·{' '}
                        {shown === termCount
                            ? `${termCount} terms`
                            : `${shown} of ${termCount} terms`}
                    </p>
                </div>
                <a
                    className="glossary-source"
                    href={law.document}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Read the Act
                    <span className="sr-only">
                        {' '}
                        {law.number}
                        {documentHint(law.document, law.documentBytes)}
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                </a>
            </header>
            <div className="glossary-entries">
                {group.terms.map((term) => (
                    <TermEntry
                        key={term.slug}
                        term={term}
                        tokens={tokens}
                        targeted={targeted === term.slug}
                        parent={
                            term.partOf
                                ? termsBySlug.get(term.partOf)
                                : undefined
                        }
                        forms={formsOf.get(term.slug) ?? []}
                    />
                ))}
            </div>
        </section>
    );
}

function TermEntry({
    term,
    tokens,
    targeted,
    parent,
    forms,
}: {
    term: GlossaryTerm;
    tokens: string[];
    // Opened from a link; pushState does not update :target.
    targeted: boolean;
    parent?: GlossaryTerm;
    forms: GlossaryTerm[];
}) {
    return (
        <article
            id={term.slug}
            className="glossary-entry"
            data-targeted={targeted ? '' : undefined}
            aria-labelledby={`${term.slug}-term`}
        >
            <div className="glossary-entry-head">
                <div className="glossary-entry-title">
                    <h3 id={`${term.slug}-term`}>
                        <a href={`#${term.slug}`}>
                            <Highlight text={term.term} tokens={tokens} />
                        </a>
                    </h3>
                    <CopyLinkButton slug={term.slug} term={term.term} />
                </div>
                {parent && (
                    <p className="glossary-kicker">
                        Listed under{' '}
                        <a href={`#${parent.slug}`}>{parent.term}</a>
                    </p>
                )}
            </div>
            <div className="glossary-entry-body">
                <p>
                    <Highlight text={term.definition} tokens={tokens} />
                </p>
                {term.items && (
                    <ol className="glossary-items">
                        {term.items.map((item) => (
                            <li key={item}>
                                <Highlight text={item} tokens={tokens} />
                            </li>
                        ))}
                    </ol>
                )}
                {forms.length > 0 && (
                    <ol className="glossary-forms">
                        {forms.map((form) => (
                            <li key={form.slug}>
                                <a href={`#${form.slug}`}>{form.term}</a>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </article>
    );
}

function CopyLinkButton({ slug, term }: { slug: string; term: string }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timeout = window.setTimeout(() => setCopied(false), 2000);
        return () => window.clearTimeout(timeout);
    }, [copied]);

    const copy = async () => {
        const url = `${window.location.origin}${window.location.pathname}#${slug}`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
        } catch {
            // No clipboard (an insecure origin, or permission denied): put
            // the link in the address bar so it can still be copied there.
            window.history.replaceState(window.history.state, '', `#${slug}`);
        }
    };

    return (
        <>
            <button
                type="button"
                className="glossary-copy"
                data-copied={copied ? '' : undefined}
                aria-label={`Copy link to ${term}`}
                onClick={copy}
            >
                {copied ? (
                    <Check aria-hidden="true" />
                ) : (
                    <Link2 aria-hidden="true" />
                )}
            </button>
            <span className="sr-only" role="status">
                {copied ? 'Link copied' : ''}
            </span>
        </>
    );
}

export function GlossaryEmpty({
    query,
    onQueryChange,
}: {
    query: string;
    onQueryChange: (query: string) => void;
}) {
    return (
        <div className="glossary-empty">
            <SearchX aria-hidden="true" />
            <h2>No terms match “{query.trim()}”</h2>
            <p>Check the spelling, or try one of these:</p>
            <div className="glossary-suggestions">
                {searchSuggestions.map((suggestion) => (
                    <Button
                        key={suggestion}
                        variant="outline"
                        onClick={() => onQueryChange(suggestion)}
                    >
                        {suggestion}
                    </Button>
                ))}
            </div>
            <Button
                variant="ghost"
                className="text-action"
                onClick={() => onQueryChange('')}
            >
                Clear search
            </Button>
        </div>
    );
}
