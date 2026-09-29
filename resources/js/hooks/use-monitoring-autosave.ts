import { router, useHttp } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import MonitoringController from '@/actions/App/Http/Controllers/MonitoringController';
import {
    applySaveResult,
    editField,
    hasConflicts,
    hasUnsaved,
    initDraft,
    mergeSnapshot,
    pendingPayload,
    resolveConflict,
    valueOf,
} from '@/lib/monitoring-draft';
import type {
    DraftPayload,
    DraftState,
    SaveResult,
} from '@/lib/monitoring-draft';
import type { MonitoringReport, MonitoringRevision } from '@/types/monitoring';

/**
 * saved: nothing left to save. pending: waiting for a pause in typing.
 * offline and error retry on their own; invalid needs a correction;
 * expired needs signing in again; locked means the report can no longer
 * change from this page.
 */
export type SaveStatus =
    | 'saved'
    | 'pending'
    | 'saving'
    | 'conflict'
    | 'offline'
    | 'error'
    | 'invalid'
    | 'expired'
    | 'locked';

const PAUSE_MS = 1200;
const RETRY_MS = [3000, 10000, 30000];

/**
 * Saves the monitoring form as the person types: after a short pause, when
 * a field loses focus, when the tab is hidden, and before leaving the page.
 * Saves go one at a time; each sends only the fields changed since the last.
 */
export function useMonitoringAutosave(
    report: MonitoringReport,
    revision: MonitoringRevision,
    enabled: boolean,
) {
    const [state, setState] = useState<DraftState>(() => initDraft(revision));
    const [status, setStatus] = useState<SaveStatus>('saved');
    const [message, setMessage] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState(report.updated_at);
    const [lockVersion, setLockVersion] = useState(report.lock_version);
    const http = useHttp<DraftPayload, SaveResult>({});
    // The latest state for the saving loop, which outlives renders.
    const current = useRef(state);
    const inFlight = useRef<Promise<boolean> | null>(null);
    const timer = useRef<number | undefined>(undefined);
    const retries = useRef(0);
    // Once the report is finalized or submitted elsewhere, saving stops until
    // the page reloads; the typed text stays on screen to copy.
    const locked = useRef(false);
    const leaveAnyway = useRef(false);
    const [leaving, setLeaving] = useState<string | null>(null);

    function update(next: (draft: DraftState) => DraftState) {
        current.current = next(current.current);
        setState(current.current);
    }

    function settle() {
        if (locked.current) {
            return;
        }

        setStatus(
            hasConflicts(current.current)
                ? 'conflict'
                : hasUnsaved(current.current)
                  ? 'pending'
                  : 'saved',
        );
    }

    function schedule(delay = PAUSE_MS) {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => void save(), delay);
    }

    function retryLater() {
        const delay = RETRY_MS[Math.min(retries.current, RETRY_MS.length - 1)];
        retries.current += 1;
        schedule(delay);
    }

    /** One save of everything waiting. Resolves false when it did not go through. */
    function save(): Promise<boolean> {
        window.clearTimeout(timer.current);

        if (inFlight.current) {
            // Chain after the save on its way, which may not include the newest edits.
            return inFlight.current.then(() => save());
        }

        if (locked.current) {
            return Promise.resolve(false);
        }

        const pending = enabled ? pendingPayload(current.current) : null;

        if (!pending) {
            settle();

            return Promise.resolve(!hasConflicts(current.current));
        }

        let outcome: SaveStatus | null = null;
        setStatus('saving');
        http.transform(() => pending.payload);
        inFlight.current = http
            .patch(MonitoringController.saveDraft.url(report.id), {
                onError: (errors) => {
                    const messages: Partial<Record<string, string>> = errors;
                    const lock = messages.report ?? messages.lock_version;
                    outcome = lock ? 'locked' : 'invalid';
                    setMessage(lock ?? Object.values(messages)[0] ?? null);
                },
                onHttpException: (response) => {
                    outcome =
                        response.status === 419 || response.status === 401
                            ? 'expired'
                            : response.status === 403
                              ? 'locked'
                              : 'error';

                    return false;
                },
                onNetworkError: () => {
                    outcome = 'offline';

                    return false;
                },
            })
            .then((result) => {
                if (!result) {
                    locked.current = outcome === 'locked';
                    setStatus(outcome ?? 'invalid');

                    return false;
                }

                retries.current = 0;
                setMessage(null);
                update((draft) =>
                    applySaveResult(draft, pending.sent, result.conflicts),
                );
                setLockVersion(result.lock_version);
                setSavedAt(result.saved_at);
                settle();

                if (pendingPayload(current.current)) {
                    schedule();
                }

                return true;
            })
            .catch(() => {
                locked.current = outcome === 'locked';
                setStatus(outcome ?? 'error');

                if (outcome === 'offline' || outcome === 'error') {
                    retryLater();
                }

                return false;
            })
            .finally(() => {
                inFlight.current = null;
            });

        return inFlight.current;
    }

    /** Save until nothing is waiting, as before finalizing. */
    async function flush(): Promise<boolean> {
        while (pendingPayload(current.current)) {
            if (!(await save())) {
                return false;
            }
        }

        await inFlight.current;

        return !hasConflicts(current.current) && !hasUnsaved(current.current);
    }

    function setField(field: string, value: string) {
        update((draft) => editField(draft, field, value));
        settle();
        schedule();
    }

    function resolve(field: string, choice: 'saved' | 'mine') {
        update((draft) => resolveConflict(draft, field, choice));
        settle();
        schedule(0);
    }

    // Fresh props, as after returning with Back, settle into the draft.
    useEffect(() => {
        update((draft) => mergeSnapshot(draft, revision));
        setLockVersion(report.lock_version);
        setSavedAt(report.updated_at);
        settle();
        // Only a new snapshot from the server should merge.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revision, report.lock_version]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const hide = () => {
            if (document.visibilityState === 'hidden') void save();
        };
        const online = () => void save();
        const leave = (event: BeforeUnloadEvent) => {
            if (hasUnsaved(current.current)) {
                void save();
                event.preventDefault();
            }
        };
        document.addEventListener('visibilitychange', hide);
        window.addEventListener('online', online);
        window.addEventListener('beforeunload', leave);

        return () => {
            document.removeEventListener('visibilitychange', hide);
            window.removeEventListener('online', online);
            window.removeEventListener('beforeunload', leave);
            window.clearTimeout(timer.current);
        };
        // save() reads the latest state through a ref.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    // Moving to another page first saves what is waiting. If that fails, the
    // page asks whether to leave anyway.
    useEffect(() => {
        if (!enabled) {
            return;
        }

        return router.on('before', (event) => {
            const visit = event.detail.visit;

            if (
                leaveAnyway.current ||
                visit.method !== 'get' ||
                !hasUnsaved(current.current)
            ) {
                return;
            }

            event.preventDefault();
            void flush().then((saved) => {
                if (saved) {
                    router.visit(visit.url.href);
                } else {
                    setLeaving(visit.url.href);
                }
            });
        });
        // flush() reads the latest state through a ref.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    return {
        value: (field: string) => valueOf(state, field),
        conflict: (field: string): string | undefined => state.conflicts[field],
        edited: (field: string) => field in state.edits,
        setField,
        resolve,
        save,
        flush,
        status,
        message,
        savedAt,
        lockVersion,
        unsaved: hasUnsaved(state),
        /** A page the person tried to open while their edits could not save. */
        leaving,
        stay: () => setLeaving(null),
        leave: () => {
            if (leaving) {
                leaveAnyway.current = true;
                router.visit(leaving);
            }
        },
    };
}
