import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { faqIntro } from '@/data/faq';
import { cn } from '@/lib/utils';

// Three.js comes in its own chunk, only when the section is near.
const LogoGatherCanvas = lazy(() => import('./logo-gather-canvas'));

/** The old site's first four objectives, word for word (data/faq.ts). */
const steps = faqIntro.objectives.slice(0, 4);

function canAnimate(): boolean {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }
    // A browser that would draw WebGL in software (no graphics chip, or
    // hardware acceleration off) gets the still version too.
    const probe = document.createElement('canvas');
    const options: WebGLContextAttributes = {
        failIfMajorPerformanceCaveat: true,
    };
    const gl: WebGLRenderingContext | WebGL2RenderingContext | null =
        probe.getContext('webgl2', options) ??
        probe.getContext('webgl', options);
    if (gl === null) return false;

    // Not every browser raises that flag, so known software drivers are
    // caught by name as well.
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const driver = info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(driver);
}

/**
 * Points scattered like data from many schools gather, as the page
 * scrolls, into the PHLGADIS logo, while the objectives step through
 * beside it. The points take their shape and colours from the official
 * gadicon.png and stay points, in 3D (Marvin's call, 2026-10-15: the one
 * place the mark is shown other than as the file). Reduced motion or no
 * WebGL gets the real PNG and the objectives, still.
 */
export function LogoGather() {
    const [live, setLive] = useState<boolean | null>(null);

    useEffect(() => setLive(canAnimate()), []);

    if (live === false) return <StillObjectives />;

    return <GatherScene />;
}

function GatherScene() {
    const section = useRef<HTMLElement>(null);
    const progress = useRef(0);
    const art = useRef<HTMLDivElement>(null);
    const [near, setNear] = useState(false);
    const [step, setStep] = useState(0);

    // Mount the canvas a screen before the section arrives.
    useEffect(() => {
        const element = section.current;
        if (!element) return;
        const observer = new IntersectionObserver(
            ([entry]) => entry.isIntersecting && setNear(true),
            { rootMargin: '100% 0px' },
        );
        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    // How far the sticky stage has travelled through the section, 0 to 1.
    useEffect(() => {
        const element = section.current;
        if (!element) return;
        let frame = 0;

        const update = () => {
            frame = 0;
            const box = element.getBoundingClientRect();
            const travel = box.height - window.innerHeight;
            const value = Math.min(1, Math.max(0, -box.top / travel));
            progress.current = value;
            setStep(
                Math.min(steps.length - 1, Math.floor(value * steps.length)),
            );
        };
        const schedule = () => {
            frame ||= requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', schedule, { passive: true });
        window.addEventListener('resize', schedule);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', schedule);
            window.removeEventListener('resize', schedule);
        };
    }, []);

    return (
        <section ref={section} id="objectives" className="gather">
            <div className="gather-stage">
                {/* The canvas spans the whole stage; the logo forms over `art`. */}
                {near && (
                    <Suspense fallback={null}>
                        <LogoGatherCanvas progress={progress} anchor={art} />
                    </Suspense>
                )}
                <div className="gather-inner">
                    <div className="gather-copy">
                        <h2 className="gather-label">
                            <span aria-hidden="true" />
                            {faqIntro.objectivesLead}
                        </h2>
                        <p className="gather-count" aria-hidden="true">
                            {String(step + 1).padStart(2, '0')} /{' '}
                            {String(steps.length).padStart(2, '0')}
                        </p>
                        <ol className="gather-steps">
                            {steps.map((objective, index) => (
                                <li
                                    key={objective}
                                    className={cn(
                                        index === step && 'is-active',
                                    )}
                                >
                                    {objective}
                                </li>
                            ))}
                        </ol>
                    </div>
                    <div ref={art} className="gather-art" aria-hidden="true" />
                </div>
            </div>
        </section>
    );
}

function StillObjectives() {
    return (
        <section id="objectives" className="public-container public-section">
            <div className="gather-still">
                <AppLogoIcon className="gather-still-logo" />
                <div>
                    <h2 className="gather-label">
                        <span aria-hidden="true" />
                        {faqIntro.objectivesLead}
                    </h2>
                    <ol className="gather-still-list">
                        {steps.map((objective) => (
                            <li key={objective}>{objective}</li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}
