import { useEffect, useState } from 'react';
import { people as peopleSearch } from '@/routes/search';
import type { Person } from '@/types/people';

/** Shortest search that is sent (`PeopleSearchRequest::MIN_LENGTH`). */
export const SEARCH_MIN_LENGTH = 2;

/** The pause after typing before asking, so a word is one request. */
const DEBOUNCE_MS = 200;

type Answers = Record<string, Person[]>;

/**
 * The people matching what is typed, asked a pause after each change. A
 * newer search cancels the one in flight, and answers are kept while the
 * page is open, so going back over a word shows its people at once.
 * `people` is null while the answer is on its way (or the search is too
 * short to send).
 */
export function usePeopleSearch(text: string) {
    const search = text.trim();
    const key = search.toLowerCase();
    const ready = search.length >= SEARCH_MIN_LENGTH;
    const [answers, setAnswers] = useState<Answers>({});
    const [failed, setFailed] = useState<string | null>(null);
    const known = key in answers;

    useEffect(() => {
        if (!ready || known) {
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            fetch(peopleSearch.url({ query: { q: search } }), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                signal: controller.signal,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const { data } = (await response.json()) as {
                        data: Person[];
                    };
                    setAnswers((current) => ({ ...current, [key]: data }));
                    setFailed(null);
                })
                .catch(() => {
                    if (!controller.signal.aborted) {
                        setFailed(key);
                    }
                });
        }, DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [key, known, ready, search]);

    return {
        search,
        ready,
        people: ready ? (answers[key] ?? null) : null,
        failed: ready && failed === key,
    };
}
