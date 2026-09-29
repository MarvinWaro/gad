import type {
    DetailKey,
    MonitoringReport,
    MonitoringRevision,
    MonitoringStage,
    MonitoringTemplate,
} from '../types/monitoring';

/**
 * The monitoring form's editing state, kept apart from React so it can be
 * tested. Every field is saved only if it still holds the value its editor
 * started from; a colleague's change in between becomes a conflict for the
 * person to settle, and nothing typed is ever thrown away.
 *
 * Fields are keyed "details.address" or "answers.gfps-membership".
 */

export const DETAIL_KEYS: DetailKey[] = [
    'address',
    'accomplished_on',
    'president_name',
    'focal_person_name',
];

export type DraftState = {
    /** Each field's value on the server, as far as this page knows. */
    saved: Record<string, string>;
    /** What the person typed that is not saved yet. */
    edits: Record<string, string>;
    /** Fields a colleague changed first, with the colleague's value. */
    conflicts: Record<string, string>;
};

export type FieldChange = { base: string; value: string };

export type DraftPayload = {
    details?: Partial<Record<DetailKey, FieldChange>>;
    answers?: Record<string, FieldChange>;
};

export type SaveResult = {
    lock_version: number;
    saved_at: string;
    conflicts: {
        details: Partial<Record<DetailKey, string>>;
        answers: Record<string, string>;
    };
};

export function detailField(key: DetailKey): string {
    return `details.${key}`;
}

export function answerField(key: string): string {
    return `answers.${key}`;
}

/** A revision's fields, flattened into one map. */
export function fieldsOf(revision: MonitoringRevision): Record<string, string> {
    const fields: Record<string, string> = {};

    for (const key of DETAIL_KEYS) {
        fields[detailField(key)] = revision.details[key] ?? '';
    }

    for (const [key, answer] of Object.entries(revision.answers ?? {})) {
        fields[answerField(key)] = answer ?? '';
    }

    return fields;
}

export function initDraft(revision: MonitoringRevision): DraftState {
    return { saved: fieldsOf(revision), edits: {}, conflicts: {} };
}

/** What the field shows: the person's edit, else the saved value. */
export function valueOf(state: DraftState, field: string): string {
    return state.edits[field] ?? state.saved[field] ?? '';
}

export function editField(
    state: DraftState,
    field: string,
    value: string,
): DraftState {
    const edits = { ...state.edits };

    // Typing back to the saved value leaves nothing to save.
    if (value === (state.saved[field] ?? '') && !(field in state.conflicts)) {
        delete edits[field];
    } else {
        edits[field] = value;
    }

    return { ...state, edits };
}

export function hasUnsaved(state: DraftState): boolean {
    return Object.keys(state.edits).length > 0;
}

export function hasConflicts(state: DraftState): boolean {
    return Object.keys(state.conflicts).length > 0;
}

/**
 * The edits ready to send, each with the value it started from. Fields in
 * conflict wait until the person settles them.
 */
export function pendingPayload(
    state: DraftState,
): { payload: DraftPayload; sent: Record<string, string> } | null {
    const payload: DraftPayload = {};
    const sent: Record<string, string> = {};

    for (const [field, value] of Object.entries(state.edits)) {
        if (field in state.conflicts) {
            continue;
        }

        const change = { base: state.saved[field] ?? '', value };
        const [group, key] = splitField(field);

        if (group === 'details') {
            payload.details = { ...payload.details, [key]: change };
        } else {
            payload.answers = { ...payload.answers, [key]: change };
        }

        sent[field] = value;
    }

    return Object.keys(sent).length > 0 ? { payload, sent } : null;
}

/** Take in the server's answer to a save of `sent`. */
export function applySaveResult(
    state: DraftState,
    sent: Record<string, string>,
    conflicts: SaveResult['conflicts'],
): DraftState {
    const saved = { ...state.saved };
    const edits = { ...state.edits };
    const conflicted = { ...state.conflicts };
    const refused: Record<string, string> = {};

    for (const [key, value] of Object.entries(conflicts.details)) {
        refused[detailField(key as DetailKey)] = value ?? '';
    }

    for (const [key, value] of Object.entries(conflicts.answers)) {
        refused[answerField(key)] = value;
    }

    for (const [field, value] of Object.entries(sent)) {
        if (field in refused) {
            saved[field] = refused[field];
            conflicted[field] = refused[field];

            continue;
        }

        saved[field] = value;

        // Anything typed while the save was on its way still waits.
        if (edits[field] === value) {
            delete edits[field];
        }
    }

    return { saved, edits, conflicts: conflicted };
}

/**
 * Settle a conflict: take the colleague's saved value, or keep your own,
 * which then saves over theirs.
 */
export function resolveConflict(
    state: DraftState,
    field: string,
    choice: 'saved' | 'mine',
): DraftState {
    const edits = { ...state.edits };
    const conflicts = { ...state.conflicts };
    delete conflicts[field];

    if (choice === 'saved' || edits[field] === state.saved[field]) {
        delete edits[field];
    }

    return { ...state, edits, conflicts };
}

/**
 * Take in fresh values from the server, such as after returning to the page.
 * Unedited fields follow the server; an edited field whose saved value moved
 * underneath it becomes a conflict.
 */
export function mergeSnapshot(
    state: DraftState,
    revision: MonitoringRevision,
): DraftState {
    const incoming = fieldsOf(revision);
    const edits = { ...state.edits };
    const conflicts = { ...state.conflicts };

    for (const [field, value] of Object.entries(edits)) {
        const before = state.saved[field] ?? '';
        const after = incoming[field] ?? '';

        if (value === after) {
            delete edits[field];
            delete conflicts[field];
        } else if (before !== after) {
            conflicts[field] = after;
        }
    }

    return { saved: incoming, edits, conflicts };
}

/** Where the report stands for the people working on it. */
export function stageOf(report: MonitoringReport): MonitoringStage {
    if (report.status === 'submitted' || report.status === 'reviewed') {
        return report.status;
    }

    if (report.current?.finalized_at) {
        return 'ready';
    }

    return report.status;
}

export function isBlank(text: string | undefined): boolean {
    return (text ?? '').trim() === '';
}

export type BlankItem = { field: string; label: string };

/** Requirements still blank, labelled as the form numbers them. */
export function blankAnswers(
    template: MonitoringTemplate,
    values: (field: string) => string,
): BlankItem[] {
    return template.sections.flatMap((section) =>
        section.items
            .filter((item) => isBlank(values(answerField(item.key))))
            .map((item) => ({
                field: answerField(item.key),
                label:
                    section.items.length === 1 && section.layout !== 'rows'
                        ? `${section.number} ${section.title}`
                        : `${section.number} ${letterOf(section.items.indexOf(item))} ${item.label}`,
            })),
    );
}

export function letterOf(index: number): string {
    return `${String.fromCharCode(97 + index)}.`;
}

function splitField(field: string): ['details' | 'answers', string] {
    const dot = field.indexOf('.');

    return [
        field.slice(0, dot) === 'details' ? 'details' : 'answers',
        field.slice(dot + 1),
    ];
}
