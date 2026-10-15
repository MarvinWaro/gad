import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
    ChevronDown,
    LifeBuoy,
    Mail,
    Phone,
    Search,
    SearchX,
    X,
} from 'lucide-react';
import { PublicPage } from '@/components/public/public-page';
import { Highlight } from '@/components/resources/glossary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { faqIntro, faqs, type FaqItem } from '@/data/faq';
import { useOperator } from '@/hooks/use-operator';
import { normalize, tokenize } from '@/lib/glossary';
import { hashTarget } from '@/lib/hash-target';
import { home } from '@/routes';
import '../../../css/public.css';

// Opens the answer a link points at (/help/faq#{id}), and brings it into
// view when the page loads on one: the browser tries to scroll before the
// page has rendered, so it cannot find the answer by itself.
function openLinkedAnswer(scroll: boolean) {
    const target = hashTarget();
    if (!(target instanceof HTMLDetailsElement)) return;

    target.open = true;
    if (scroll) target.scrollIntoView({ block: 'start' });
}

type Entry = { item: FaqItem; answer: string };

// Every word in the query must appear in the question or its answer.
function matches(text: string, tokens: string[]) {
    const haystack = normalize(text);

    return tokens.every((token) => haystack.includes(token));
}

export default function Faq() {
    const operator = useOperator();
    const [query, setQuery] = useState('');
    // Once someone searches, answers that come back fade in.
    const [searched, setSearched] = useState(false);
    const deferredQuery = useDeferredValue(query);
    const tokens = useMemo(() => tokenize(deferredQuery), [deferredQuery]);
    const searching = tokens.length > 0;

    const entries: Entry[] = faqs.map((item) => ({
        item,
        answer:
            typeof item.answer === 'string'
                ? item.answer
                : item.answer(operator),
    }));
    const shown = entries.filter(({ item, answer }) =>
        matches(`${item.question} ${answer}`, tokens),
    );

    const changeQuery = (next: string) => {
        setQuery(next);
        setSearched(true);
    };

    useEffect(() => {
        openLinkedAnswer(true);
        const onHashChange = () => openLinkedAnswer(false);
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    return (
        <PublicPage
            title="Frequently Asked Questions"
            eyebrow="Need Help?"
            back={{ href: home.url(), label: 'Back to home' }}
            description="Answers to common questions about PHLGADIS."
            summary={`${faqs.length} questions`}
            metaDescription="Answers to frequently asked questions about PHLGADIS, the Philippine Higher Education Gender and Development Information System."
        >
            <div className="public-container faq">
                <FaqIntro />
                <div className="faq-questions">
                    <FaqSearch
                        query={query}
                        onQueryChange={changeQuery}
                        searching={searching}
                        status={
                            searching
                                ? `Showing ${shown.length} of ${faqs.length} questions`
                                : `${faqs.length} questions`
                        }
                    />
                    {shown.length > 0 ? (
                        <div
                            className="faq-list"
                            data-animate={searched ? '' : undefined}
                        >
                            {shown.map(({ item, answer }) => (
                                <FaqEntry
                                    key={item.id}
                                    item={item}
                                    answer={answer}
                                    tokens={tokens}
                                    open={searching && matches(answer, tokens)}
                                />
                            ))}
                        </div>
                    ) : (
                        <FaqEmpty
                            query={deferredQuery}
                            onClear={() => changeQuery('')}
                        />
                    )}
                </div>
                <FaqContact />
            </div>
        </PublicPage>
    );
}

// What PHLGADIS is for, as the old FAQ page opened.
function FaqIntro() {
    return (
        <div className="faq-intro">
            <p className="faq-intro-lead">{faqIntro.purpose}</p>
            <div>
                <p className="faq-objectives-lead">{faqIntro.objectivesLead}</p>
                <ul className="faq-objectives">
                    {faqIntro.objectives.map((objective) => (
                        <li key={objective}>{objective}</li>
                    ))}
                </ul>
            </div>
            <p>{faqIntro.outcome}</p>
        </div>
    );
}

// The Definition of Terms search field, for the questions: the text stays
// word for word, only the matched words are marked.
function FaqSearch({
    query,
    onQueryChange,
    searching,
    status,
}: {
    query: string;
    onQueryChange: (query: string) => void;
    searching: boolean;
    status: string;
}) {
    return (
        <div className="faq-tools">
            <form
                role="search"
                className="glossary-search"
                onSubmit={(event) => event.preventDefault()}
            >
                <label htmlFor="faq-search" className="sr-only">
                    Search the questions
                </label>
                <Search aria-hidden="true" />
                <Input
                    id="faq-search"
                    type="search"
                    value={query}
                    placeholder="Search the questions"
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
                {query !== '' && (
                    <button
                        type="button"
                        className="glossary-clear"
                        aria-label="Clear search"
                        onClick={() => onQueryChange('')}
                    >
                        <X aria-hidden="true" />
                    </button>
                )}
            </form>
            <p
                className="glossary-status"
                data-searching={searching ? '' : undefined}
                aria-live="polite"
            >
                {status}
            </p>
        </div>
    );
}

// Native disclosure: works without JavaScript, and find-in-page opens a
// closed answer that matches. While searching, answers with a match open.
function FaqEntry({
    item,
    answer,
    tokens,
    open,
}: {
    item: FaqItem;
    answer: string;
    tokens: string[];
    open: boolean;
}) {
    return (
        <details id={item.id} className="faq-item" open={open || undefined}>
            <summary>
                <span>
                    <Highlight text={item.question} tokens={tokens} />
                </span>
                <ChevronDown aria-hidden="true" />
            </summary>
            <p className="faq-answer">
                <Highlight text={answer} tokens={tokens} />
            </p>
        </details>
    );
}

function FaqEmpty({ query, onClear }: { query: string; onClear: () => void }) {
    return (
        <div className="glossary-empty">
            <SearchX aria-hidden="true" />
            <h2>No questions match “{query.trim()}”</h2>
            <p>Check the spelling, or ask us below.</p>
            <Button variant="ghost" className="text-action" onClick={onClear}>
                Clear search
            </Button>
        </div>
    );
}

function FaqContact() {
    const operator = useOperator();

    return (
        <section className="notice-panel" aria-labelledby="faq-contact-title">
            <LifeBuoy aria-hidden="true" />
            <div>
                <h2 id="faq-contact-title">Still have questions?</h2>
                <p>{operator.name} can help.</p>
            </div>
            <div className="faq-contact-actions">
                <Button asChild variant="outline">
                    <a href={operator.hotlineHref}>
                        <Phone aria-hidden="true" />
                        {operator.hotline}
                    </a>
                </Button>
                <Button asChild variant="outline">
                    <a href={`mailto:${operator.email}`}>
                        <Mail aria-hidden="true" />
                        {operator.email}
                    </a>
                </Button>
            </div>
        </section>
    );
}
