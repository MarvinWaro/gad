import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import {
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    CatmullRomCurve3,
    Fog,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    PointsMaterial,
    Scene,
    SRGBColorSpace,
    Vector3,
    WebGLRenderer,
} from 'three';
import type { HerstoryEntry } from '@/data/herstory';
import {
    deviceTier,
    focusOf,
    viewFraming,
    weavingRoute,
    type DeviceTier,
} from '@/lib/scroll-scenes';

/** Path between one milestone's card and the next, in scene units. */
const SPACING = 6;
/** A card's size; its texture is drawn at the same 16:11. */
const CARD_WIDTH = 1.6;
const CARD_HEIGHT = 1.1;
/** The card in step grows by this much. */
const FOCUS_SCALE = 1.2;
/** At a stop the camera waits this far back along the route from its card, */
const CAMERA_BACK = 4;
/** and each card sits this far off the route, left and right in turn. */
const CARD_SIDE = 1.1;
/** The camera looks this far ahead along the route between stops. */
const LOOK_AHEAD = 2;
/** Fog from here to the end of sight; past it nothing is drawn. */
const FOG_NEAR = 5;
const FOG_FAR = 22;
/** The route's dots grow as they near, up to this many CSS pixels. */
const MAX_DOT = 10;
/** Slower than this on average (about 45 frames a second) steps down. */
const SLOW_FRAME = 1 / 45;
/** Between scrolls only the bob moves, drawn about 30 times a second. */
const IDLE_FRAME = 1000 / 30;

/** Texture width and pixel density by device. */
const budgets = {
    low: { texture: 512, maxPixelRatio: 1 },
    mid: { texture: 768, maxPixelRatio: 1.5 },
    high: { texture: 1024, maxPixelRatio: 2 },
} satisfies Record<DeviceTier, { texture: number; maxPixelRatio: number }>;

const kindLabels = {
    convention: 'Convention',
    law: 'Law',
    rules: 'Rules',
    office: 'Office',
    event: 'Event',
    award: 'Award',
} satisfies Record<HerstoryEntry['kind'], string>;

type Palette = {
    card: string;
    border: string;
    input: string;
    foreground: string;
    subtle: string;
    brand: string;
    brandSoft: string;
    background: string;
    font: string;
};

/** The theme's colours and font, read from the stage. */
function readPalette(element: HTMLElement): Palette {
    const style = getComputedStyle(element);
    const token = (name: string) => style.getPropertyValue(name).trim();

    return {
        card: token('--card'),
        border: token('--border'),
        input: token('--input'),
        foreground: token('--foreground'),
        subtle: token('--subtle-foreground'),
        brand: token('--brand'),
        brandSoft: token('--brand-soft'),
        background: token('--background'),
        font: style.fontFamily,
    };
}

function roundedRect(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) {
    g.beginPath();
    g.roundRect(x, y, width, height, radius);
}

/**
 * One milestone's card, drawn on a 320 × 220 grid scaled to the canvas:
 * its photo (or its year on a hatched panel, as in the still timeline),
 * the kind of milestone, then its date and title.
 */
function drawCard(
    canvas: HTMLCanvasElement,
    entry: HerstoryEntry,
    photo: HTMLImageElement | undefined,
    colors: Palette,
) {
    const g = canvas.getContext('2d');
    if (!g) return;
    const scale = canvas.width / 320;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.clearRect(0, 0, 320, 220);

    roundedRect(g, 1.5, 1.5, 317, 217, 18);
    g.fillStyle = colors.card;
    g.fill();
    g.lineWidth = 1.5;
    g.strokeStyle = colors.border;
    g.stroke();

    // The panel: 296 × 148, the photos' own 2:1.
    g.save();
    roundedRect(g, 12, 12, 296, 148, 12);
    g.clip();
    if (photo) {
        // The old site's photos carry a hairline frame at their edges.
        const insetX = photo.naturalWidth * 0.01;
        const insetY = photo.naturalHeight * 0.01;
        g.drawImage(
            photo,
            insetX,
            insetY,
            photo.naturalWidth - insetX * 2,
            photo.naturalHeight - insetY * 2,
            12,
            12,
            296,
            148,
        );
    } else {
        g.fillStyle = colors.card;
        g.fillRect(12, 12, 296, 148);
        g.strokeStyle = colors.border;
        g.lineWidth = 1;
        g.beginPath();
        for (let x = -148; x < 308; x += 10) {
            g.moveTo(12 + x, 160);
            g.lineTo(12 + x + 148, 12);
        }
        g.stroke();
        g.font = `500 60px ${colors.font}`;
        g.fillStyle = colors.subtle;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(entry.datetime.slice(0, 4), 160, 90);
    }
    g.restore();
    roundedRect(g, 12.5, 12.5, 295, 147, 12);
    g.strokeStyle = photo ? colors.border : colors.input;
    g.setLineDash(photo ? [] : [4, 3]);
    g.lineWidth = 1;
    g.stroke();
    g.setLineDash([]);

    // The kind, as a pill on the panel.
    const label = kindLabels[entry.kind];
    g.font = `600 11px ${colors.font}`;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    const pill = g.measureText(label).width + 20;
    roundedRect(g, 22, 22, pill, 22, 11);
    g.fillStyle = colors.brandSoft;
    g.fill();
    g.fillStyle = colors.brand;
    g.fillText(label, 32, 33.5);

    g.textBaseline = 'alphabetic';
    g.font = `600 11.5px ${colors.font}`;
    g.fillStyle = colors.brand;
    g.fillText(entry.date.toUpperCase(), 14, 183);
    g.font = `600 18px ${colors.font}`;
    g.fillStyle = colors.foreground;
    g.fillText(entry.title, 14, 206, 292);
}

/** A soft round glow, white on clear, tinted by its material. */
function glowCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const g = canvas.getContext('2d');
    if (g) {
        const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgb(255 255 255 / 0.6)');
        gradient.addColorStop(1, 'rgb(255 255 255 / 0)');
        g.fillStyle = gradient;
        g.fillRect(0, 0, 128, 128);
    }

    return canvas;
}

function dotCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const g = canvas.getContext('2d');
    if (g) {
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(32, 32, 28, 0, Math.PI * 2);
        g.fill();
    }

    return canvas;
}

/** Runs `task` when the browser is idle; returns how to cancel it. */
function whenIdle(task: () => void): () => void {
    if (typeof window.requestIdleCallback === 'function') {
        const id = requestIdleCallback(task, { timeout: 500 });
        return () => cancelIdleCallback(id);
    }
    const id = window.setTimeout(task, 60);
    return () => window.clearTimeout(id);
}

/**
 * The WebGL half of HerstoryFlight: draws the camera at `at` (0 to the last
 * stop) on a route past one card per milestone, framed on `art`.
 */
export default function HerstoryFlightCanvas({
    entries,
    at,
    stage,
    art,
    onUnavailable,
}: {
    entries: HerstoryEntry[];
    at: RefObject<number>;
    stage: RefObject<HTMLDivElement | null>;
    art: RefObject<HTMLDivElement | null>;
    onUnavailable: () => void;
}) {
    const host = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = host.current;
        const pinned = stage.current;
        if (!element || !pinned) return;

        const budget = budgets[deviceTier()];
        let renderer: WebGLRenderer;
        try {
            renderer = new WebGLRenderer({
                alpha: true,
                // Dense screens are sharp enough without it.
                antialias: window.devicePixelRatio <= 1.5,
                powerPreference: 'low-power',
            });
        } catch {
            onUnavailable();
            return;
        }
        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, budget.maxPixelRatio),
        );
        element.appendChild(renderer.domElement);

        let colors = readPalette(pinned);
        const scene = new Scene();
        const fog = new Fog(colors.background, FOG_NEAR, FOG_FAR);
        scene.fog = fog;
        const camera = new PerspectiveCamera(40, 1, 0.1, FOG_FAR);

        const stops = entries.length;
        const curve = new CatmullRomCurve3(
            weavingRoute(stops, {
                spacing: SPACING,
                swayX: 2.2,
                swayY: 0.35,
            }).map(([x, y, z]) => new Vector3(x, y, z)),
            false,
            'centripetal',
        );
        const length = curve.getLength();
        /** How far along the route milestone `index`'s card sits. */
        const cardAt = (index: number) => ((index + 1) * length) / (stops + 1);

        // The route, as dots a little below the camera's path.
        const route = curve.getSpacedPoints(stops * 14);
        const routeGeometry = new BufferGeometry();
        routeGeometry.setAttribute(
            'position',
            new BufferAttribute(
                new Float32Array(route.flatMap((p) => [p.x, p.y - 0.25, p.z])),
                3,
            ),
        );
        const dotTexture = new CanvasTexture(dotCanvas());
        const dots = new PointsMaterial({
            color: colors.brand,
            size: 0.07,
            map: dotTexture,
            alphaTest: 0.4,
        });
        // Dots passing just under the camera would swell into blobs; they
        // stop growing at a few pixels.
        const dotLimit = { value: 0 };
        dots.onBeforeCompile = (shader) => {
            shader.uniforms.maxSize = dotLimit;
            shader.vertexShader = shader.vertexShader
                .replace(
                    'void main() {',
                    'uniform float maxSize;\nvoid main() {',
                )
                .replace(
                    '#include <fog_vertex>',
                    '#include <fog_vertex>\ngl_PointSize = min(gl_PointSize, maxSize);',
                );
        };
        scene.add(new Points(routeGeometry, dots));

        const cardGeometry = new PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
        const glowGeometry = new PlaneGeometry(2.7, 2.1);
        const glowTexture = new CanvasTexture(glowCanvas());
        const glow = new MeshBasicMaterial({
            map: glowTexture,
            color: colors.brand,
            transparent: true,
            opacity: 0.35,
            depthWrite: false,
        });

        const point = new Vector3();
        const tangent = new Vector3();
        const side = new Vector3();
        const up = new Vector3(0, 1, 0);
        const eye = new Vector3();
        const ahead = new Vector3();
        const photos: (HTMLImageElement | undefined)[] = [];
        const cards = entries.map((entry, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = budget.texture;
            canvas.height = Math.round((budget.texture * 11) / 16);
            const texture = new CanvasTexture(canvas);
            texture.colorSpace = SRGBColorSpace;
            texture.anisotropy = Math.min(
                4,
                renderer.capabilities.getMaxAnisotropy(),
            );
            const material = new MeshBasicMaterial({
                map: texture,
                transparent: true,
                toneMapped: false,
            });
            const mesh = new Mesh(cardGeometry, material);

            const u = cardAt(index) / length;
            curve.getPointAt(u, point);
            curve.getTangentAt(u, tangent);
            side.crossVectors(tangent, up).normalize();
            const direction = index % 2 === 0 ? -1 : 1;
            mesh.position.set(
                point.x + side.x * direction * CARD_SIDE,
                point.y + 0.1,
                point.z + side.z * direction * CARD_SIDE,
            );
            // Face where the camera stops for it, turned a little toward
            // the route so it still reads as standing in space.
            curve.getPointAt((cardAt(index) - CAMERA_BACK) / length, eye);
            mesh.lookAt(eye.x, eye.y + 0.1, eye.z);
            mesh.rotateY(-direction * 0.12);
            const halo = new Mesh(glowGeometry, glow);
            halo.position.set(0.05, -0.12, -0.04);
            mesh.add(halo);
            scene.add(mesh);

            return {
                mesh,
                canvas,
                texture,
                material,
                home: mesh.position.clone(),
            };
        });

        // Upload textures in idle time, nearest first, so no card stutters
        // the first time it comes into view.
        let uploads: number[] = [];
        let cancelUpload: (() => void) | null = null;
        const uploadNext = () => {
            cancelUpload = null;
            const index = uploads.shift();
            if (index === undefined) return;
            renderer.initTexture(cards[index].texture);
            if (uploads.length > 0) cancelUpload = whenIdle(uploadNext);
        };
        const queueUploads = () => {
            const from = Math.round(at.current ?? 0);
            uploads = cards
                .map((_, index) => index)
                .sort((a, b) => Math.abs(a - from) - Math.abs(b - from));
            cancelUpload ??= whenIdle(uploadNext);
        };

        let disposed = false;
        let dirty = true;
        const paintCard = (index: number) => {
            drawCard(
                cards[index].canvas,
                entries[index],
                photos[index],
                colors,
            );
            cards[index].texture.needsUpdate = true;
            dirty = true;
        };
        const paintAll = () => {
            entries.forEach((_, index) => paintCard(index));
            queueUploads();
        };
        paintAll();

        // Again once the page's font is in, and as each photo arrives.
        void Promise.all(
            ['500 16px', '600 16px'].map((weight) =>
                document.fonts.load(`${weight} ${colors.font}`),
            ),
        ).then(
            () => !disposed && paintAll(),
            () => {},
        );
        entries.forEach((entry, index) => {
            if (!entry.image) return;
            const image = new Image();
            image.src = entry.image.src;
            void image.decode().then(
                () => {
                    if (disposed) return;
                    photos[index] = image;
                    paintCard(index);
                    renderer.initTexture(cards[index].texture);
                },
                () => {},
            );
        });

        // The theme's colours follow the appearance setting.
        const themeWatch = new MutationObserver(() => {
            colors = readPalette(pinned);
            fog.color.set(colors.background);
            dots.color.set(colors.brand);
            glow.color.set(colors.brand);
            paintAll();
        });
        themeWatch.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        // Frame the scene on the art box, on a screen of any shape.
        const resize = () => {
            const { clientWidth: width, clientHeight: height } = element;
            const box = art.current?.getBoundingClientRect();
            if (width === 0 || height === 0 || !box || box.width === 0) return;
            const stageBox = element.getBoundingClientRect();

            renderer.setSize(width, height, false);
            dotLimit.value = MAX_DOT * renderer.getPixelRatio();
            const frame = viewFraming(
                { width, height },
                {
                    left: box.left - stageBox.left,
                    top: box.top - stageBox.top,
                    width: box.width,
                    height: box.height,
                },
                {
                    width: CARD_WIDTH * FOCUS_SCALE,
                    height: CARD_HEIGHT * FOCUS_SCALE,
                    distance: Math.hypot(CAMERA_BACK, CARD_SIDE),
                },
                { width: 0.7, height: 0.42 },
            );
            camera.fov = frame.fov;
            camera.aspect = frame.fullWidth / frame.fullHeight;
            camera.setViewOffset(
                frame.fullWidth,
                frame.fullHeight,
                frame.offsetX,
                frame.offsetY,
                width,
                height,
            );
            camera.updateProjectionMatrix();
            dirty = true;
        };
        const sizeWatch = new ResizeObserver(resize);
        sizeWatch.observe(element);
        if (art.current) sizeWatch.observe(art.current);
        resize();

        // If frames still run slow, step down: plain pixel density, then
        // no bob, drawing only while the page scrolls.
        let level = 0;
        let paceKnown = false;
        let measured = 0;
        let measuredTime = 0;
        const watchPace = (dt: number) => {
            if (paceKnown) return;
            measured += 1;
            // The first frames after coming into view are often slow anyway.
            if (measured <= 10) return;
            measuredTime += dt;
            if (measured < 55) return;
            if (measuredTime / 45 <= SLOW_FRAME) {
                paceKnown = true;
                return;
            }
            level += 1;
            measured = 0;
            measuredTime = 0;
            paceKnown = level === 2;
            if (level === 1) {
                renderer.setPixelRatio(1);
                resize();
            }
        };

        let visible = false;
        let frame = 0;
        let last = performance.now();
        let drawnAt = -1;
        let drawnTime = 0;
        let shown = false;
        const tick = (now: number) => {
            frame = 0;
            if (!visible) return;
            frame = requestAnimationFrame(tick);
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;

            const position = at.current ?? 0;
            const moving = position !== drawnAt || dirty;
            // Settled: the bob alone, at a gentler rate; at the last step,
            // nothing until the next scroll.
            if (!moving && (level === 2 || now - drawnTime < IDLE_FRAME)) {
                return;
            }
            watchPace(dt);
            drawnAt = position;
            drawnTime = now;
            dirty = false;

            const distance = cardAt(position) - CAMERA_BACK;
            curve.getPointAt(Math.max(0, distance) / length, eye);
            curve.getPointAt(
                Math.min(1, (distance + LOOK_AHEAD) / length),
                ahead,
            );
            camera.position.set(eye.x, eye.y + 0.1, eye.z);

            // Between stops the camera looks along the route; at a stop it
            // turns to that milestone's card.
            const nearest = Math.round(position);
            ahead.y += 0.05;
            ahead.lerp(cards[nearest].home, focusOf(position, nearest));
            camera.lookAt(ahead);

            const bobbing = level < 2;
            cards.forEach((card, index) => {
                card.mesh.scale.setScalar(
                    1 + (FOCUS_SCALE - 1) * focusOf(position, index),
                );
                card.mesh.position.y = bobbing
                    ? card.home.y + Math.sin((now / 1000) * 1.2 + index) * 0.04
                    : card.home.y;
            });

            renderer.render(scene, camera);
            if (!shown) {
                shown = true;
                element.dataset.ready = '';
            }
        };

        // Draw only while the stage is on screen, once the shaders are
        // compiled (in parallel, so the first frame doesn't stall).
        let compiled = false;
        const start = () => {
            if (disposed || !visible || !compiled || frame) return;
            last = performance.now();
            frame = requestAnimationFrame(tick);
        };
        const viewWatch = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            start();
        });
        viewWatch.observe(element);
        const ready = () => {
            compiled = true;
            start();
        };
        void renderer.compileAsync(scene, camera).then(ready, ready);

        return () => {
            disposed = true;
            cancelAnimationFrame(frame);
            cancelUpload?.();
            viewWatch.disconnect();
            sizeWatch.disconnect();
            themeWatch.disconnect();
            for (const card of cards) {
                card.texture.dispose();
                card.material.dispose();
            }
            cardGeometry.dispose();
            glowGeometry.dispose();
            glowTexture.dispose();
            glow.dispose();
            routeGeometry.dispose();
            dotTexture.dispose();
            dots.dispose();
            renderer.dispose();
            // Let the browser have the context back now, not at collection.
            renderer.forceContextLoss();
            renderer.domElement.remove();
        };
    }, [entries, at, stage, art, onUnavailable]);

    return <div ref={host} className="flight-canvas" />;
}
