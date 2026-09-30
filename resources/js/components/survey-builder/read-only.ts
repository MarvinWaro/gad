import { createContext, useContext } from 'react';

/**
 * True when the viewer may read the draft but not change it (no
 * `surveys.update`): fields turn read-only and the editing buttons go away.
 */
export const ReadOnlyContext = createContext(false);

export function useReadOnly(): boolean {
    return useContext(ReadOnlyContext);
}

/**
 * A control the viewer can read but not change: a soft fill with the text at
 * full strength, so it still reads well and can be selected and copied.
 */
export const readOnlyControlClass =
    'bg-muted cursor-default disabled:cursor-default disabled:opacity-100';
