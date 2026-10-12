import type { ScannerEvent } from '@/types/scanner';

/**
 * The participant code as a Virtual ID's QR holds it
 * (`App\Support\ParticipantCode`): "GAD-" and two groups of four from
 * Crockford's base32, which leaves out I, L, O and U.
 */
export const PARTICIPANT_CODE =
    /^GAD-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

/** A QR's text as a participant code, or null when it holds something else. */
export function readParticipantCode(text: string): string | null {
    const code = text.trim().toUpperCase();

    return PARTICIPANT_CODE.test(code) ? code : null;
}

/**
 * What the eight boxes keep of what is typed, read as the server reads it:
 * capitals, I and L as 1, O as 0, and nothing outside the alphabet.
 */
export function typedCode(value: string): string {
    return value
        .toUpperCase()
        .replace(/[IL]/g, '1')
        .replace(/O/g, '0')
        .replace(/[^0-9A-HJKMNP-TV-Z]/g, '');
}

/**
 * A pasted code's eight characters, with or without its "GAD-" and dashes.
 * The prefix goes only when a whole code follows it, since a code's own
 * characters may begin with G, A and D.
 */
export function pastedCode(text: string): string {
    const characters = text.replace(/[\s-]+/g, '').toUpperCase();
    const code =
        characters.length === 11 && characters.startsWith('GAD')
            ? characters.slice(3)
            : characters;

    return typedCode(code).slice(0, 8);
}

/** A code read again within this long is the same person still in view. */
export const COOLDOWN_MS = 4000;

export type LastRead = { code: string; at: number } | null;

/** Whether `code` was just handled, so holding it in view checks in once. */
export function isCoolingDown(
    code: string,
    last: LastRead,
    now: number,
): boolean {
    return last !== null && last.code === code && now - last.at < COOLDOWN_MS;
}

export type EventStatus = 'ongoing' | 'later' | 'ended';

/**
 * Where one of today's events stands at `now`, a Philippine wall-clock time
 * ("2026-10-15T09:00", as `manilaInputNow` gives it). An event without an
 * end time runs to the end of its day, as check-in does.
 */
export function eventStatus(
    event: Pick<ScannerEvent, 'starts_at' | 'ends_at'>,
    now: string,
): EventStatus {
    const start = event.starts_at.slice(0, 16);
    const end = (
        event.ends_at ?? `${event.starts_at.slice(0, 10)}T23:59`
    ).slice(0, 16);

    if (now < start) {
        return 'later';
    }

    return now <= end ? 'ongoing' : 'ended';
}

export type CameraProblem =
    | 'blocked'
    | 'missing'
    | 'busy'
    | 'insecure'
    | 'reader'
    | 'failed';

/** Why the camera didn't start, from the error the browser gave. */
export function cameraProblem(error: unknown): CameraProblem {
    const name =
        typeof error === 'object' && error !== null && 'name' in error
            ? String(error.name)
            : '';

    switch (name) {
        case 'NotAllowedError':
        case 'SecurityError':
            return 'blocked';
        case 'NotFoundError':
        case 'OverconstrainedError':
            return 'missing';
        case 'NotReadableError':
        case 'AbortError':
            return 'busy';
        default:
            return 'failed';
    }
}

/** Each camera problem in plain words, with the way round it. */
export const cameraProblems: Record<CameraProblem, string> = {
    blocked:
        'The camera is blocked. Allow it from the camera icon in the address bar, or type the Participant ID.',
    missing:
        'No camera was found. Connect one, or type the Participant ID instead.',
    busy: 'Another app is using the camera. Close it and try again, or type the Participant ID.',
    insecure:
        'The camera needs a secure (https) address. Type the Participant ID instead.',
    reader: "The QR reader didn't load. Check the connection and try again, or type the Participant ID.",
    failed: "The camera didn't start. Try again, or type the Participant ID instead.",
};

/** What a refused check-in says, by the HTTP status it came back with. */
export function checkInProblem(status: number): string {
    switch (status) {
        case 401:
        case 419:
            return 'Your session has ended. Reload the page to sign in again.';
        case 403:
            return "You can't check people in to this event.";
        case 404:
            return 'This event no longer exists. Pick another.';
        case 429:
            return 'Too many check-ins at once. Wait a moment, then try again.';
        default:
            return "That didn't go through. Try again.";
    }
}
