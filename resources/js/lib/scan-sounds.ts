/**
 * The QR scanner's sounds (docs/event-check-in.md), so staff at a busy
 * table hear each result without looking: a bright rising chirp for
 * checked in, one soft tone for already checked in today, and a low double
 * buzz when it didn't go through. Short tones made by the browser itself,
 * with no sound files to load. Pure, so it can be tested without one;
 * hooks/use-scan-sound.ts plays them.
 */

export type ScanSound = 'checked_in' | 'already_checked_in' | 'problem';

export type Tone = {
    /** In hertz. */
    frequency: number;
    /** Seconds after the sound starts. */
    start: number;
    /** In seconds. */
    duration: number;
    wave: 'sine' | 'triangle' | 'square';
    /** Its loudness, from 0 to 1: kept low, as staff hear it all day. */
    gain: number;
};

export const scanSounds: Record<ScanSound, Tone[]> = {
    checked_in: [
        { frequency: 880, start: 0, duration: 0.09, wave: 'sine', gain: 0.22 },
        {
            frequency: 1320,
            start: 0.09,
            duration: 0.16,
            wave: 'sine',
            gain: 0.22,
        },
    ],
    already_checked_in: [
        {
            frequency: 660,
            start: 0,
            duration: 0.2,
            wave: 'triangle',
            gain: 0.2,
        },
    ],
    problem: [
        {
            frequency: 220,
            start: 0,
            duration: 0.12,
            wave: 'square',
            gain: 0.08,
        },
        {
            frequency: 165,
            start: 0.16,
            duration: 0.2,
            wave: 'square',
            gain: 0.08,
        },
    ],
};

/** The sound for a scan result; none while waiting or checking. */
export function soundFor(kind: string): ScanSound | null {
    return kind === 'checked_in' ||
        kind === 'already_checked_in' ||
        kind === 'problem'
        ? kind
        : null;
}

/** How long a sound lasts, in seconds. */
export function soundLength(sound: ScanSound): number {
    return Math.max(
        ...scanSounds[sound].map((tone) => tone.start + tone.duration),
    );
}
