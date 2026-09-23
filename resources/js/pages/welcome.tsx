import { useEffect, useRef, type MouseEvent } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Hero, QuickAccess } from '@/components/home/hero';
import {
    Feedback,
    Resources,
    Rights,
    Stories,
} from '@/components/home/content-sections';
import { Statistics } from '@/components/home/statistics';
import { SiteFooter, SiteHeader } from '@/components/public/site-layout';
import {
    datasets,
    heroSlides,
    laws,
    resources,
    stories,
} from '@/data/phlgadis-demo';
import type { HeroSlideRecord } from '@/data/phlgadis-demo';
import '../../css/public.css';

export default function Welcome({
    carouselSlides = [],
    openSurveys = [],
}: {
    carouselSlides?: HeroSlideRecord[];
    openSurveys?: string[];
}) {
    const { auth } = usePage().props;
    const mainRef = useRef<HTMLElement>(null);

    const handleSectionLink = (event: MouseEvent<HTMLDivElement>) => {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        )
            return;
        const anchor = (event.target as Element).closest('a[href^="#"]');
        const hash = anchor?.getAttribute('href');
        if (!hash || hash === '#' || anchor?.classList.contains('skip-link'))
            return;
        const target = document.getElementById(hash.slice(1));
        if (!target) return;

        event.preventDefault();
        if (window.location.hash !== hash) {
            window.history.pushState(window.history.state, '', hash);
        }
        target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'instant'
                : 'smooth',
            block: 'start',
        });
    };

    useEffect(() => {
        const main = mainRef.current;
        if (!main || !('IntersectionObserver' in window)) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;

        const sections = main.querySelectorAll<HTMLElement>(
            ':scope > section:not(.hero), :scope > nav.quick-access',
        );
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.classList.add('is-revealed');
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.08, rootMargin: '0px 0px -32px 0px' },
        );

        for (const section of sections) {
            if (section.getBoundingClientRect().top < window.innerHeight - 32) {
                continue;
            }
            section.classList.add('reveal-pending');
            observer.observe(section);
        }

        return () => {
            observer.disconnect();
            sections.forEach((section) =>
                section.classList.remove('reveal-pending'),
            );
        };
    }, []);
    const slides = carouselSlides.length > 0 ? carouselSlides : heroSlides;
    return (
        <div className="public-theme landing-page" onClick={handleSectionLink}>
            <Head>
                <title>PHLGADIS | Gender-responsive higher education</title>
                <link
                    rel="icon"
                    type="image/svg+xml"
                    href="/phlgadis-placeholder.svg"
                />
                <meta
                    name="description"
                    content="Explore gender and development in Philippine higher education. Discover GAD resources, know your rights, and explore the PHLGADIS data preview."
                />
            </Head>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <SiteHeader authenticated={Boolean(auth.user)} />
            <main id="main" ref={mainRef}>
                <Hero slides={slides} />
                <QuickAccess />
                <Rights laws={laws} openSurveys={openSurveys} />
                <Statistics datasets={datasets} />
                <Stories stories={stories} />
                <Resources resources={resources} />
                <Feedback />
            </main>
            <SiteFooter />
        </div>
    );
}
