// Shared by the scroll-driven 3D scenes: the homepage objectives
// (components/home/logo-gather*.tsx) and the GAD Herstory flight
// (components/public/herstory-flight*.tsx). Nothing here imports, so the
// numbers test in node.

let animates: boolean | undefined;

/**
 * Whether to run a 3D scene: not under reduced motion, and not where the
 * browser would draw WebGL in software (no graphics chip, or hardware
 * acceleration off). Probed once a visit.
 */
export function canAnimate3d(): boolean {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }
    if (animates !== undefined) return animates;

    const probe = document.createElement('canvas');
    const options: WebGLContextAttributes = {
        failIfMajorPerformanceCaveat: true,
    };
    const gl: WebGLRenderingContext | WebGL2RenderingContext | null =
        probe.getContext('webgl2', options) ??
        probe.getContext('webgl', options);
    if (gl === null) return (animates = false);

    // Not every browser raises that flag, so known software drivers are
    // caught by name as well.
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const driver = info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return (animates =
        !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(driver));
}

export type DeviceTier = 'low' | 'mid' | 'high';

/**
 * How much a scene should draw, from what the device says about itself:
 * weak or low-memory devices first, then phones and small tablets.
 */
export function deviceTier(): DeviceTier {
    const memory =
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency || 8;

    if (memory <= 4 || cores <= 4) return 'low';
    if (window.matchMedia('(max-width: 900px)').matches) return 'mid';

    return 'high';
}

export const smoothstep = (from: number, to: number, value: number) => {
    const x = Math.min(1, Math.max(0, (value - from) / (to - from)));
    return x * x * (3 - 2 * x);
};

export type Vec3 = [number, number, number];

/**
 * A route of `stops` points, `spacing` apart, running away from the viewer
 * along −z and weaving gently, with one more point at each end so a camera
 * on it never sits on the curve's last stretch.
 */
export function weavingRoute(
    stops: number,
    {
        spacing,
        swayX,
        swayY,
    }: { spacing: number; swayX: number; swayY: number },
): Vec3[] {
    return Array.from({ length: stops + 2 }, (_, index) => [
        Math.sin(index * 1.9) * swayX,
        Math.sin(index * 1.3 + 0.6) * swayY,
        -index * spacing,
    ]);
}

/**
 * Which stop a scene is at, from 0 to stops − 1, for how far the reader
 * has scrolled, 0 to 1. Around each stop it holds for a stretch of scroll,
 * so what is shown there can be read.
 */
export function stopAt(progress: number, stops: number): number {
    if (stops < 2) return 0;
    const travelled = Math.min(1, Math.max(0, progress)) * (stops - 1);
    const whole = Math.min(Math.floor(travelled), stops - 2);

    return whole + smoothstep(0.2, 0.8, travelled - whole);
}

/**
 * How much stop `index` is in step at `at`: 1 at the stop, 0 half a stop
 * away, where the next one takes over from 0.
 */
export function focusOf(at: number, index: number): number {
    return 1 - smoothstep(0.1, 0.5, Math.abs(at - index));
}

type Box = { left: number; top: number; width: number; height: number };

/**
 * Frames a 3D scene drawn over the whole `stage` so that the camera's
 * centre of view lands on the middle of the `art` box inside it, and a
 * `subject` (in scene units) `distance` away fills at most `fill` of that
 * box each way. Returns the arguments for PerspectiveCamera.setViewOffset
 * and the vertical field of view, in degrees, of the full view they imply.
 */
export function viewFraming(
    stage: { width: number; height: number },
    art: Box,
    subject: { width: number; height: number; distance: number },
    fill: { width: number; height: number },
) {
    const centreX = art.left + art.width / 2;
    const centreY = art.top + art.height / 2;
    const fullWidth = 2 * Math.max(centreX, stage.width - centreX);
    const fullHeight = 2 * Math.max(centreY, stage.height - centreY);
    // Half the art box's height in scene units at the subject's distance,
    // over that distance: whichever of its height or width needs more.
    const tangent = Math.max(
        subject.height / (2 * subject.distance * fill.height),
        (subject.width * art.height) /
            (2 * subject.distance * fill.width * art.width),
    );

    return {
        fullWidth,
        fullHeight,
        offsetX: fullWidth / 2 - centreX,
        offsetY: fullHeight / 2 - centreY,
        fov:
            (2 * Math.atan((tangent * fullHeight) / art.height) * 180) /
            Math.PI,
    };
}
