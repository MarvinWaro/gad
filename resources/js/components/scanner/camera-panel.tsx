import { Camera, CameraOff, SwitchCamera } from 'lucide-react';
import type { RefObject } from 'react';
import { IconAction } from '@/components/icon-action';
import { Button } from '@/components/ui/button';
import type { useQrScanner } from '@/hooks/use-qr-scanner';
import { cameraProblems } from '@/lib/scanner';
import { tones } from '@/lib/tones';
import { cn } from '@/lib/utils';
import type { ActivityTone } from '@/types/activity';

type CameraControls = ReturnType<typeof useQrScanner>;

/**
 * Where to hold the code: four corners around the middle of the picture,
 * white with a dark halo so they show on a dark room and a white card alike.
 */
function ScanFrame() {
    const corner = 'absolute size-8 border-white sm:size-10';

    return (
        <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 aspect-square h-[68%] -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_3px_rgb(0_0_0/0.7)]"
        >
            <span
                className={cn(
                    corner,
                    'top-0 left-0 rounded-tl-xl border-t-4 border-l-4',
                )}
            />
            <span
                className={cn(
                    corner,
                    'top-0 right-0 rounded-tr-xl border-t-4 border-r-4',
                )}
            />
            <span
                className={cn(
                    corner,
                    'bottom-0 left-0 rounded-bl-xl border-b-4 border-l-4',
                )}
            />
            <span
                className={cn(
                    corner,
                    'right-0 bottom-0 rounded-br-xl border-r-4 border-b-4',
                )}
            />
        </div>
    );
}

/**
 * The camera's picture with a frame to hold the Virtual ID in, its start
 * and stop, and a switch between a phone's cameras. After each scan its
 * outline takes the result's colour for a moment.
 */
export function CameraPanel({
    video,
    camera,
    checking,
    flash,
}: {
    video: RefObject<HTMLVideoElement | null>;
    camera: CameraControls;
    checking: boolean;
    flash: ActivityTone | null;
}) {
    const scanning = camera.status === 'scanning';

    return (
        <section aria-label="Camera" className="flex min-w-0 flex-col gap-3">
            <div
                className={cn(
                    'relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted motion-safe:transition-shadow motion-safe:duration-300',
                    flash && ['ring-4', tones[flash].ring],
                )}
            >
                {/* Always in the page, so it is there to show the stream. */}
                <video
                    ref={video}
                    muted
                    playsInline
                    autoPlay
                    aria-hidden
                    className={cn(
                        'size-full object-cover',
                        camera.mirrored && '-scale-x-100',
                        !scanning && 'invisible',
                    )}
                />
                {scanning ? (
                    <>
                        <ScanFrame />
                        <p className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-media-panel px-3 py-1 text-xs font-medium whitespace-nowrap text-white">
                            {checking ? 'Checking…' : 'Looking for a QR code…'}
                        </p>
                        {camera.canSwitch && (
                            <IconAction
                                label="Switch camera"
                                side="left"
                                onClick={camera.switchCamera}
                                className="absolute top-2 right-2 size-11 rounded-full bg-media-panel text-white hover:bg-media-panel hover:text-white"
                            >
                                <SwitchCamera className="size-5" />
                            </IconAction>
                        )}
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-background">
                            <Camera
                                aria-hidden
                                className="size-5 text-muted-foreground"
                            />
                        </span>
                        {camera.status === 'starting' ? (
                            <p className="text-sm text-muted-foreground">
                                Starting the camera…
                            </p>
                        ) : (
                            <>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    {camera.problem
                                        ? cameraProblems[camera.problem]
                                        : 'Allow the camera to scan Virtual IDs. You can also type a Participant ID.'}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={camera.start}
                                >
                                    <Camera />
                                    {camera.problem
                                        ? 'Try the camera again'
                                        : 'Start camera'}
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
            {scanning && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={camera.stop}
                    className="w-full"
                >
                    <CameraOff />
                    Stop camera
                </Button>
            )}
        </section>
    );
}
