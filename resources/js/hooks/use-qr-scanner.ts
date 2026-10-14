import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { qrDecoder } from '@/lib/qr-decoder';
import type { QrDecoder } from '@/lib/qr-decoder';
import { cameraProblem } from '@/lib/scanner';
import type { CameraProblem } from '@/lib/scanner';

export type CameraStatus = 'off' | 'starting' | 'scanning' | 'problem';

/** At most this often, in milliseconds, one frame at a time. */
const READ_EVERY_MS = 150;

function stopTracks(stream: MediaStream): void {
    stream.getTracks().forEach((track) => track.stop());
}

/**
 * The scanner's camera: it opens on Start (or at once when the browser
 * already allows it), shows in `video`, and passes every QR it reads to
 * `onRead`. Phones start on the back camera. Stop, a camera switch, leaving
 * the page and React's double effects in development all close the stream.
 */
export function useQrScanner(
    video: RefObject<HTMLVideoElement | null>,
    onRead: (text: string) => void,
) {
    const [active, setActive] = useState(false);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [status, setStatus] = useState<CameraStatus>('off');
    const [problem, setProblem] = useState<CameraProblem | null>(null);
    const [cameras, setCameras] = useState<string[]>([]);
    const [current, setCurrent] = useState<string | null>(null);
    const [mirrored, setMirrored] = useState(false);
    const read = useRef(onRead);

    useEffect(() => {
        read.current = onRead;
    }, [onRead]);

    function start() {
        // Browsers offer the camera to secure (https) pages only.
        if (!window.isSecureContext || !('mediaDevices' in navigator)) {
            setProblem('insecure');
            setStatus('problem');

            return;
        }

        setProblem(null);
        setStatus('starting');
        setActive(true);
    }

    function stop() {
        setActive(false);
        setStatus('off');
    }

    /** The next camera along: front and back on a phone. */
    function switchCamera() {
        const next =
            cameras[(cameras.indexOf(current ?? '') + 1) % cameras.length];

        if (next && next !== current) {
            setStatus('starting');
            setDeviceId(next);
        }
    }

    // A camera the browser already allows starts with the page.
    useEffect(() => {
        if (!('permissions' in navigator)) {
            return;
        }

        let mounted = true;
        navigator.permissions
            .query({ name: 'camera' })
            .then((permission) => {
                if (mounted && permission.state === 'granted') {
                    start();
                }
            })
            .catch(() => undefined);

        return () => {
            mounted = false;
        };
        // Once, on arrival.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // The stream, open while the camera is on.
    useEffect(() => {
        const element = video.current;

        if (!active || !element) {
            return;
        }

        let stream: MediaStream | null = null;
        let cancelled = false;

        navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: deviceId
                    ? { deviceId: { exact: deviceId } }
                    : {
                          facingMode: { ideal: 'environment' },
                          width: { ideal: 1280 },
                          height: { ideal: 720 },
                      },
            })
            .then(async (opened) => {
                if (cancelled) {
                    stopTracks(opened);

                    return;
                }

                stream = opened;
                element.srcObject = opened;
                await element.play().catch(() => undefined);
                const settings = opened.getVideoTracks()[0]?.getSettings();
                // A laptop's camera, or a phone's front one, shows as in a
                // mirror; the frames read stay as the camera sees them.
                setMirrored(settings?.facingMode !== 'environment');
                setCurrent(settings?.deviceId ?? null);
                setStatus('scanning');
                const devices = await navigator.mediaDevices
                    .enumerateDevices()
                    .catch(() => []);

                if (!cancelled) {
                    setCameras(
                        devices
                            .filter((device) => device.kind === 'videoinput')
                            .map((device) => device.deviceId)
                            .filter(Boolean),
                    );
                }
            })
            .catch((error: unknown) => {
                if (!cancelled) {
                    setProblem(cameraProblem(error));
                    setStatus('problem');
                    setActive(false);
                    // A camera unplugged since: the next start asks afresh.
                    setDeviceId(null);
                }
            });

        return () => {
            cancelled = true;

            if (stream) {
                stopTracks(stream);
            }

            element.srcObject = null;
        };
    }, [active, deviceId, video]);

    // Reading: a frame at a time while the camera shows and the tab is in view.
    useEffect(() => {
        const element = video.current;

        if (status !== 'scanning' || !element) {
            return;
        }

        let stopped = false;
        let reader: QrDecoder | null = null;
        let busy = false;
        let readAt = 0;
        let frame = 0;
        let timer: number | undefined;

        qrDecoder()
            .then((loaded) => {
                reader = loaded;
            })
            .catch(() => {
                if (!stopped) {
                    setProblem('reader');
                    setStatus('problem');
                    setActive(false);
                }
            });

        function next() {
            if (stopped || !element) {
                return;
            }

            if ('requestVideoFrameCallback' in element) {
                frame = element.requestVideoFrameCallback(tick);
            } else {
                timer = window.setTimeout(tick, READ_EVERY_MS);
            }
        }

        function tick() {
            next();
            const now = performance.now();

            if (
                !reader ||
                !element ||
                busy ||
                document.hidden ||
                element.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
                now - readAt < READ_EVERY_MS
            ) {
                return;
            }

            busy = true;
            readAt = now;
            reader
                .read(element)
                .then((text) => {
                    if (text && !stopped) {
                        read.current(text);
                    }
                })
                .catch(() => undefined)
                .finally(() => {
                    busy = false;
                });
        }

        next();

        return () => {
            stopped = true;

            if ('cancelVideoFrameCallback' in element) {
                element.cancelVideoFrameCallback(frame);
            }

            window.clearTimeout(timer);
        };
    }, [status, video]);

    return {
        status,
        problem,
        /** More than one camera, so a switch button helps. */
        canSwitch: cameras.length > 1,
        mirrored,
        start,
        stop,
        switchCamera,
    };
}
