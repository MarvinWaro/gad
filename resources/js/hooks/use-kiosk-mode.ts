import { setLayoutProps } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function leaveFullscreen(): void {
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
    }
}

/**
 * Kiosk mode for a registration table: the page fills the screen, and the
 * app's sidebar and top bar step aside (AppLayout's `kiosk`). Leaving
 * fullscreen with Esc ends it, and so does leaving the page. Where the
 * browser refuses fullscreen, the page still fills the window.
 */
export function useKioskMode() {
    const [kiosk, setKiosk] = useState(false);

    // Merged into the layout's props; a visit to another page resets it.
    setLayoutProps({ kiosk });

    useEffect(() => {
        function onFullscreenChange() {
            if (!document.fullscreenElement) {
                setKiosk(false);
            }
        }

        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            document.removeEventListener(
                'fullscreenchange',
                onFullscreenChange,
            );
            leaveFullscreen();
        };
    }, []);

    function enter() {
        setKiosk(true);

        if ('requestFullscreen' in document.documentElement) {
            document.documentElement
                .requestFullscreen({ navigationUI: 'hide' })
                .catch(() => undefined);
        }
    }

    function exit() {
        setKiosk(false);
        leaveFullscreen();
    }

    return { kiosk, enter, exit };
}
