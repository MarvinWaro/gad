import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { scanSounds } from '@/lib/scan-sounds';
import type { ScanSound } from '@/lib/scan-sounds';

/** Remembered in this browser: a registration table keeps its choice. */
const STORAGE_KEY = 'scanner:sound';

type AudioContextConstructor = typeof AudioContext;

function savedChoice(): boolean {
    try {
        return window.localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
        return true;
    }
}

/**
 * The page's one audio context, made and woken on someone's touch: browsers
 * keep a page silent until then. Null where the browser has no Web Audio.
 */
function wake(audio: RefObject<AudioContext | null>): AudioContext | null {
    if (!audio.current) {
        const Context: AudioContextConstructor | undefined =
            window.AudioContext ??
            (window as { webkitAudioContext?: AudioContextConstructor })
                .webkitAudioContext;

        if (!Context) {
            return null;
        }

        audio.current = new Context();
    }

    if (audio.current.state === 'suspended') {
        audio.current.resume().catch(() => undefined);
    }

    return audio.current;
}

/** Plays a sound now: short tones, each faded in and out so none clicks. */
function play(context: AudioContext, name: ScanSound): void {
    const now = context.currentTime;

    for (const tone of scanSounds[name]) {
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        const start = now + tone.start;
        const end = start + tone.duration;
        oscillator.type = tone.wave;
        oscillator.frequency.value = tone.frequency;
        volume.gain.setValueAtTime(0.0001, start);
        volume.gain.exponentialRampToValueAtTime(tone.gain, start + 0.012);
        volume.gain.exponentialRampToValueAtTime(0.0001, end);
        oscillator.connect(volume).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(end + 0.02);
    }
}

/**
 * The scanner's sounds (lib/scan-sounds.ts), on unless turned off. Sound
 * wakes at the first tap, click or key on the page; a result before that
 * is silent.
 */
export function useScanSound() {
    const [enabled, setEnabled] = useState(savedChoice);
    const audio = useRef<AudioContext | null>(null);

    useEffect(() => {
        const unlock = () => void wake(audio);
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('keydown', unlock);

        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
            audio.current?.close().catch(() => undefined);
            audio.current = null;
        };
    }, []);

    function toggle() {
        const next = !enabled;
        setEnabled(next);

        try {
            window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
        } catch {
            // A private window may refuse; the choice lasts for this visit.
        }

        // Turned on, it chirps once, at the volume staff will hear.
        const context = next ? wake(audio) : null;
        context
            ?.resume()
            .then(() => play(context, 'checked_in'))
            .catch(() => undefined);
    }

    /** A result's sound, when sound is on and the page may make it. */
    function sound(name: ScanSound) {
        const context = audio.current;

        if (enabled && context?.state === 'running') {
            play(context, name);
        }
    }

    return { enabled, toggle, play: sound };
}
