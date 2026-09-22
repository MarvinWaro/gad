import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowDown,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    ClipboardList,
    Pause,
    Play,
    Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaPanel } from '@/components/public/shared';
import type { HeroSlideRecord } from '@/data/phlgadis-demo';
import { cn } from '@/lib/utils';

const carouselInterval = 6000;

export function Hero({ slides }: { slides: HeroSlideRecord[] }) {
    const carouselRef = useRef<HTMLElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isInteracting, setIsInteracting] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const activeSlide = slides[activeIndex];
    const previewSlides = useMemo(
        () => slides.filter((_, index) => index !== activeIndex),
        [activeIndex, slides],
    );
    const autoplayEnabled =
        slides.length > 1 &&
        isPlaying &&
        !isInteracting &&
        !prefersReducedMotion &&
        isVisible;

    const showSlide = useCallback(
        (slideId: string) => {
            const nextIndex = slides.findIndex((slide) => slide.id === slideId);
            if (nextIndex < 0) return;
            setActiveIndex(nextIndex);
            setIsPlaying(false);
        },
        [slides],
    );

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        );
        const updateMotionPreference = () =>
            setPrefersReducedMotion(mediaQuery.matches);
        updateMotionPreference();
        mediaQuery.addEventListener('change', updateMotionPreference);

        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.15 },
        );
        if (carouselRef.current) observer.observe(carouselRef.current);

        return () => {
            mediaQuery.removeEventListener('change', updateMotionPreference);
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!autoplayEnabled) return;
        const timer = window.setInterval(() => {
            if (document.hidden) return;
            setActiveIndex((current) => (current + 1) % slides.length);
        }, carouselInterval);
        return () => window.clearInterval(timer);
    }, [autoplayEnabled, slides.length]);

    if (!activeSlide) return null;

    return (
        <section
            ref={carouselRef}
            id="home"
            className="public-container hero"
            role="region"
            aria-roledescription="carousel"
            aria-label="Featured PHLGADIS visuals"
            data-autoplay={autoplayEnabled}
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => setIsInteracting(false)}
            onFocusCapture={() => setIsInteracting(true)}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsInteracting(false);
                }
            }}
        >
            <div className="hero-intro">
                <div className="hero-copy">
                    <p className="hero-eyebrow">
                        <span />
                        Knowledge for a more inclusive future
                    </p>
                    <h1 id="hero-title">
                        Advancing gender-responsive higher education through
                        data.
                    </h1>
                    <p className="hero-description">
                        Better understanding. Informed action. Explore the data,
                        rights, and initiatives shaping a more equitable higher
                        education.
                    </p>
                </div>
                <div
                    className="hero-satellites"
                    role="group"
                    aria-label="Choose a featured visual"
                >
                    {previewSlides.map((slide) => (
                        <button
                            key={slide.id}
                            type="button"
                            className="hero-thumbnail"
                            onClick={() => showSlide(slide.id)}
                            aria-label={`Show ${slide.label} visual`}
                            aria-controls="hero-carousel-stage"
                        >
                            <MediaPanel
                                media={slide.media}
                                label={slide.label}
                            />
                        </button>
                    ))}
                    <div className="hero-carousel-meta">
                        <p>{activeSlide.supportingText}</p>
                        <button
                            type="button"
                            className="hero-playback"
                            onClick={() => setIsPlaying((current) => !current)}
                            aria-label={
                                isPlaying
                                    ? 'Pause hero carousel'
                                    : 'Play hero carousel'
                            }
                        >
                            {isPlaying ? (
                                <Pause aria-hidden="true" />
                            ) : (
                                <Play aria-hidden="true" />
                            )}
                            <span>
                                {activeIndex + 1} / {slides.length}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="hero-visual">
                <div
                    id="hero-carousel-stage"
                    className="hero-carousel-stage"
                    aria-live={isPlaying ? 'off' : 'polite'}
                >
                    {slides.map((slide, index) => (
                        <div
                            key={slide.id}
                            className={cn(
                                'hero-carousel-slide',
                                index === activeIndex && 'is-active',
                            )}
                            aria-hidden={index !== activeIndex}
                        >
                            <MediaPanel
                                media={slide.media}
                                label={`${slide.label} image placeholder`}
                            />
                        </div>
                    ))}
                    {slides.map((slide, index) => (
                        <div
                            key={`${slide.id}-caption`}
                            className={cn(
                                'hero-image-caption',
                                index === activeIndex && 'is-active',
                            )}
                            aria-hidden={index !== activeIndex}
                        >
                            <span className="caption-dot" />
                            <div>
                                {slide.caption}
                                <br />
                                <strong>{slide.captionEmphasis}</strong>
                            </div>
                        </div>
                    ))}
                    <span className="sr-only">
                        Slide {activeIndex + 1} of {slides.length}:{' '}
                        {activeSlide.label}
                    </span>
                </div>
                <div className="hero-actions">
                    <Button asChild size="lg">
                        <a href="#statistics">
                            Explore GAD data
                            <ArrowUpRight />
                        </a>
                    </Button>
                    <Button asChild size="lg" variant="ghost">
                        <a href="#surveys">
                            Take a survey
                            <ArrowUpRight />
                        </a>
                    </Button>
                </div>
            </div>
            <div className="hero-bottom">
                <p>
                    Philippine Higher Education Gender and Development
                    Information System
                </p>
                <a href="#quick-access">
                    Discover PHLGADIS
                    <ArrowDown size={14} />
                </a>
            </div>
        </section>
    );
}

const quickLinks = [
    {
        icon: Scale,
        title: 'Know your rights',
        description: 'Knowledge is a starting point.',
        href: '#rights',
    },
    {
        icon: ClipboardList,
        title: 'Make your voice count',
        description: 'Discover our GAD surveys.',
        href: '#surveys',
    },
    {
        icon: BarChart3,
        title: 'See the bigger picture',
        description: 'Explore higher education data.',
        href: '#statistics',
    },
    {
        icon: BookOpen,
        title: 'Keep learning',
        description: 'Find resources for informed action.',
        href: '#resources',
    },
];
export function QuickAccess() {
    return (
        <nav
            id="quick-access"
            className="public-container quick-access"
            aria-label="Quick access"
        >
            {quickLinks.map(({ icon: Icon, title, description, href }) => (
                <a key={href} href={href}>
                    <Icon className="quick-icon" strokeWidth={1.5} />
                    <div>
                        <h2>{title}</h2>
                        <p>{description}</p>
                    </div>
                    <ArrowUpRight className="quick-arrow" size={17} />
                </a>
            ))}
        </nav>
    );
}
