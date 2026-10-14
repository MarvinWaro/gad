import { router } from '@inertiajs/react';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import { useState } from 'react';
import { ConfirmPopover } from '@/components/confirm-popover';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/admin/events/registration';
import type { EventDetail } from '@/types/events';

/**
 * Closing an event's registration now, or reopening it until the event ends
 * (docs/event-registration.md). Closing asks first; reopening doesn't.
 */
export function RegistrationControls({ event }: { event: EventDetail }) {
    const [reopening, setReopening] = useState(false);

    if (event.ended || event.category === 'deadline') {
        return null;
    }

    if (event.registration_open) {
        return (
            <ConfirmPopover
                title="Close registration now?"
                description="No one else can join, and those who did can no longer leave. You can reopen it until the event ends."
                confirmLabel="Close registration"
                onConfirm={(visit) =>
                    router.put(
                        update.url(event.id),
                        { open: false },
                        { preserveScroll: true, ...visit },
                    )
                }
            >
                <Button variant="outline">
                    <LockKeyhole />
                    Close registration
                </Button>
            </ConfirmPopover>
        );
    }

    return (
        <Button
            type="button"
            variant="outline"
            disabled={reopening}
            onClick={() =>
                router.put(
                    update.url(event.id),
                    { open: true },
                    {
                        preserveScroll: true,
                        onStart: () => setReopening(true),
                        onFinish: () => setReopening(false),
                    },
                )
            }
        >
            {reopening ? <Spinner /> : <LockKeyholeOpen />}
            Reopen registration
        </Button>
    );
}
