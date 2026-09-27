import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast as sonner } from 'sonner';
import type { ExternalToast } from 'sonner';

const stamp = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

/** Every toast says when it happened, under any description of its own. */
function withTime(options?: ExternalToast): ExternalToast {
    const now = new Date();
    const own =
        typeof options?.description === 'function'
            ? options.description()
            : options?.description;

    return {
        ...options,
        description: (
            <>
                {own && <span className="block">{own}</span>}
                <time
                    dateTime={now.toISOString()}
                    className="block tabular-nums opacity-80"
                >
                    {stamp.format(now)}
                </time>
            </>
        ),
    };
}

/**
 * The app's toasts: green when something went through, red when it failed or
 * something was deleted, each stamped with the date and time. Use this rather
 * than importing `toast` from sonner directly.
 */
export const toast = {
    success: (message: ReactNode, options?: ExternalToast) =>
        sonner.success(message, withTime(options)),
    error: (message: ReactNode, options?: ExternalToast) =>
        sonner.error(message, withTime(options)),
    info: (message: ReactNode, options?: ExternalToast) =>
        sonner.info(message, withTime(options)),
    warning: (message: ReactNode, options?: ExternalToast) =>
        sonner.warning(message, withTime(options)),
    /** A deletion that went through: red like an error, with a bin for the cross. */
    deleted: (message: ReactNode, options?: ExternalToast) =>
        sonner.error(
            message,
            withTime({ icon: <Trash2 size={18} aria-hidden />, ...options }),
        ),
};
