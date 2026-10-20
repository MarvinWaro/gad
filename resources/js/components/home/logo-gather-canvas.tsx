import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import {
    BufferAttribute,
    BufferGeometry,
    Color,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    WebGLRenderer,
} from 'three';
import { deviceTier, smoothstep, type DeviceTier } from '@/lib/scroll-scenes';

const LOGO = '/assets/img/gadicon.png';
/** The logo's height in the scene. */
const LOGO_HEIGHT = 4;
const FOV = 40;
const CAMERA_Z = 9;
/** The logo's width over its height (gadicon.png is 247 × 266). */
const LOGO_ASPECT = 247 / 266;
/** At most this share of the canvas height, and of its width. */
const FILL_HEIGHT = 0.61;
const FILL_WIDTH = 0.8;

const vertexShader = /* glsl */ `
    uniform float uP;
    uniform float uTime;
    uniform float uSize;
    uniform float uScale;
    attribute vec3 aStart;
    attribute vec3 aColor;
    attribute float aRand;
    varying vec3 vColor;
    varying float vT;
    varying float vRand;
    varying float vEdge;

    float smootherstep01(float x) {
        return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
    }

    void main() {
        // Each point sets off on its own delay.
        float t = smootherstep01(clamp(uP * 1.45 - aRand * 0.45, 0.0, 1.0));
        vec3 p = mix(aStart, position, t);

        // A swirl around y that settles as the point lands.
        float angle = (1.0 - t) * (1.6 + aRand * 1.4 + uTime * 0.06);
        float c = cos(angle);
        float s = sin(angle);
        p.xz = mat2(c, -s, s, c) * p.xz;

        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Scattered points thin out towards the canvas edge; landed ones
        // never do, so the whole mark always shows.
        vec2 ndc = gl_Position.xy / gl_Position.w;
        vEdge = mix(1.0 - smoothstep(0.6, 1.0, max(abs(ndc.x), abs(ndc.y))), 1.0, t);
        // Points passing close to the camera stop growing past a dot.
        gl_PointSize = uSize * uScale / max(-mvPosition.z, 5.0) * (0.7 + aRand * 0.6);

        vColor = aColor;
        vT = t;
        vRand = aRand;
    }
`;

const fragmentShader = /* glsl */ `
    uniform vec3 uPale;
    varying vec3 vColor;
    varying float vT;
    varying float vRand;
    varying float vEdge;

    void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;

        float edge = smoothstep(0.5, 0.22, d);
        vec3 color = mix(uPale, vColor, clamp(vT * 1.15 + vRand * 0.15 - 0.1, 0.0, 1.0));
        gl_FragColor = vec4(color, edge * mix(0.35, 1.0, vT) * vEdge);

        #include <colorspace_fragment>
    }
`;

/**
 * Points on the logo's shape, each in the colour of the pixel it came from,
 * with a little depth so the mark turns as a solid; and a scattered start
 * for each, inside a flattened ball.
 */
async function sampleLogo(count: number) {
    const image = new Image();
    image.src = LOGO;
    await image.decode();

    const { naturalWidth: width, naturalHeight: height } = image;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('No 2D canvas');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, width, height).data;

    const opaque: number[] = [];
    for (let index = 0; index < width * height; index++) {
        if (pixels[index * 4 + 3] > 128) opaque.push(index);
    }

    const target = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    const color = new Color();
    const unit = LOGO_HEIGHT / height;

    for (let i = 0; i < count; i++) {
        const pixel = opaque[Math.floor(Math.random() * opaque.length)];
        const x = (pixel % width) + Math.random();
        const y = Math.floor(pixel / width) + Math.random();
        target[i * 3] = (x - width / 2) * unit;
        target[i * 3 + 1] = (height / 2 - y) * unit;
        // A slab half a unit deep, so the mark has a body when it turns.
        target[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

        color.setRGB(
            pixels[pixel * 4] / 255,
            pixels[pixel * 4 + 1] / 255,
            pixels[pixel * 4 + 2] / 255,
            SRGBColorSpace,
        );
        color.toArray(colors, i * 3);

        const radius = 2.5 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        // Wider than tall, to fill a wide screen.
        start[i * 3] = radius * Math.sin(phi) * Math.cos(theta) * 1.6;
        start[i * 3 + 1] = radius * Math.cos(phi) * 0.45;
        start[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        rand[i] = Math.random();
    }

    return { target, start, colors, rand };
}

/**
 * How much to draw, by device: weak or low-memory devices get fewer points
 * and fewer pixels from the start.
 */
const budgets = {
    low: { count: 6000, maxPixelRatio: 1 },
    mid: { count: 8000, maxPixelRatio: 1.5 },
    high: { count: 20000, maxPixelRatio: 2 },
} satisfies Record<DeviceTier, { count: number; maxPixelRatio: number }>;

/** Slower than this on average (about 45 frames a second) steps down. */
const SLOW_FRAME = 1 / 45;

/**
 * The WebGL half of LogoGather: follows `progress`, from 0 (scattered)
 * to 1 (the logo, in points). The canvas fills the stage; the logo forms
 * centred on `anchor` and sized to fit it.
 */
export default function LogoGatherCanvas({
    progress,
    anchor,
}: {
    progress: RefObject<number>;
    anchor: RefObject<HTMLDivElement | null>;
}) {
    const host = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = host.current;
        if (!element) return;

        const budget = budgets[deviceTier()];
        const renderer = new WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: 'low-power',
        });
        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, budget.maxPixelRatio),
        );
        element.appendChild(renderer.domElement);

        const scene = new Scene();
        const camera = new PerspectiveCamera(FOV, 1, 0.1, 100);
        camera.position.z = CAMERA_Z;

        const geometry = new BufferGeometry();
        const material = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
            uniforms: {
                uP: { value: 0 },
                uTime: { value: 0 },
                uSize: { value: 0.034 },
                uScale: { value: 1 },
                uPale: { value: new Color() },
            },
        });
        const points = new Points(geometry, material);
        scene.add(points);

        // The scattered points' tint follows the theme's muted ink.
        const readPale = () => {
            const ink = getComputedStyle(element)
                .getPropertyValue('--subtle-foreground')
                .trim();
            if (ink) material.uniforms.uPale.value.set(ink);
        };
        readPale();
        const themeWatch = new MutationObserver(readPale);
        themeWatch.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        const resize = () => {
            const { clientWidth: width, clientHeight: height } = element;
            const box = anchor.current?.getBoundingClientRect();
            if (width === 0 || height === 0 || !box || box.height === 0) return;
            const stage = element.getBoundingClientRect();

            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            const halfTan = Math.tan(((FOV / 2) * Math.PI) / 180);
            // Back far enough that the logo fits its area both ways.
            camera.position.z = Math.max(
                (LOGO_HEIGHT * height) /
                    (2 * halfTan * FILL_HEIGHT * box.height),
                (LOGO_HEIGHT * LOGO_ASPECT * height) /
                    (2 * halfTan * FILL_WIDTH * box.width),
            );
            camera.updateProjectionMatrix();

            // Move the logo from the canvas's centre to its area's.
            const unit = (2 * camera.position.z * halfTan) / height;
            points.position.x =
                (box.left + box.width / 2 - (stage.left + width / 2)) * unit;
            points.position.y =
                (stage.top + height / 2 - (box.top + box.height / 2)) * unit;

            material.uniforms.uScale.value =
                (height * renderer.getPixelRatio()) / (2 * halfTan);
        };
        const sizeWatch = new ResizeObserver(resize);
        sizeWatch.observe(element);
        if (anchor.current) sizeWatch.observe(anchor.current);
        resize();

        let disposed = false;
        const count = budget.count;
        void sampleLogo(count).then(({ target, start, colors, rand }) => {
            if (disposed) return;
            geometry.setAttribute('position', new BufferAttribute(target, 3));
            geometry.setAttribute('aStart', new BufferAttribute(start, 3));
            geometry.setAttribute('aColor', new BufferAttribute(colors, 3));
            geometry.setAttribute('aRand', new BufferAttribute(rand, 1));
        });

        // If frames still run slow, step down: half the points at plain
        // pixel density, then a quarter, then draw only while scrolling.
        let level = 0;
        let paceKnown = false;
        let measured = 0;
        let measuredTime = 0;
        const stepDown = () => {
            level += 1;
            measured = 0;
            measuredTime = 0;
            paceKnown = level === 3;
            if (level <= 2) {
                geometry.setDrawRange(0, Math.round(count / 2 ** level));
                // Bigger points keep the fewer ones reading as a whole.
                material.uniforms.uSize.value *= 1.3;
                renderer.setPixelRatio(1);
                resize();
            }
        };
        const watchPace = (dt: number) => {
            if (paceKnown) return;
            measured += 1;
            // The first frames after coming into view are often slow anyway.
            if (measured <= 10) return;
            measuredTime += dt;
            if (measured === 55) {
                if (measuredTime / 45 > SLOW_FRAME) stepDown();
                else paceKnown = true;
            }
        };

        let visible = false;
        let frame = 0;
        let last = performance.now();
        let shown = 0;
        let drawn = -1;
        const tick = (now: number) => {
            frame = 0;
            if (!visible) return;
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;
            frame = requestAnimationFrame(tick);

            // Smoothed toward the scroll, so a flick still flows.
            shown +=
                ((progress.current ?? 0) - shown) * (1 - Math.exp(-dt * 6));

            // At the last step the scene holds still between scrolls.
            const still = level === 3;
            if (still && Math.abs(shown - drawn) < 0.0005) return;
            drawn = shown;
            watchPace(dt);

            material.uniforms.uP.value = shown;
            material.uniforms.uTime.value = now / 1000;
            // A slow sway that calms, but never stops, as the logo forms,
            // so the finished mark still shows its depth.
            const settled = smoothstep(0.6, 0.9, shown);
            const sway = still ? 0 : 1;
            points.rotation.y =
                Math.sin(now / 2600) * (0.55 - settled * 0.3) * sway;
            points.rotation.x = Math.sin(now / 3400) * 0.08 * settled * sway;

            renderer.render(scene, camera);
        };

        // Draw only while the section is on screen.
        const viewWatch = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !frame) {
                last = performance.now();
                frame = requestAnimationFrame(tick);
            }
        });
        viewWatch.observe(element);

        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            viewWatch.disconnect();
            sizeWatch.disconnect();
            themeWatch.disconnect();
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, [progress, anchor]);

    return <div ref={host} className="gather-canvas" />;
}
