import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, History } from 'lucide-react';
import { PhlgadisLogo } from '@/components/public/phlgadis-logo';
import { OrganizationalChart } from '@/components/public/organizational-chart';
import { PublicPage } from '@/components/public/public-page';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { sustainableGoals } from '@/data/sdgs';
import {
    chedLogo,
    phlgadisLogo,
    whatIsPhlgadis,
    type RichText,
} from '@/data/about-content';
import { achieveAgenda, achieveSource } from '@/data/achieve';
import { herstory, herstorySpan } from '@/data/herstory';
import '../../css/public.css';

const tabs = [
    { id: 'phlgadis', label: 'What is PHLGADIS?' },
    { id: 'logo', label: 'The Logo' },
    { id: 'organization', label: 'Organizational Chart' },
    { id: 'achieve', label: 'A.C.H.I.E.V.E. Agenda' },
    { id: 'goals', label: 'Sustainable Development Goals' },
] as const;

type Tab = (typeof tabs)[number]['id'];

const isTab = (value: string): value is Tab =>
    tabs.some((tab) => tab.id === value);

// The tab the URL names (a homepage card opens /about#achieve), or the first.
function tabFromHash(): Tab {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    return isTab(hash) ? hash : tabs[0].id;
}

export default function About() {
    const [tab, setTab] = useState<Tab>(tabFromHash);
    const anchorRef = useRef<HTMLDivElement>(null);

    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onHashChange = () => setTab(tabFromHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    // On a phone the tab bar scrolls sideways; keep the chosen tab in view.
    useEffect(() => {
        const list = listRef.current;
        const active = list?.querySelector<HTMLElement>(
            '[data-state="active"]',
        );
        if (!list || !active) return;
        list.scrollLeft =
            active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    }, [tab]);

    const selectTab = (value: string) => {
        if (!isTab(value)) return;
        setTab(value);
        // Keep the tab in the URL for sharing, and Inertia's history state.
        window.history.replaceState(window.history.state, '', `#${value}`);
        // Once the bar is pinned under the header, start the new panel right
        // under it. The anchor's scroll margin is the header's height.
        const anchor = anchorRef.current;
        if (!anchor) return;
        const pinnedAt = parseFloat(getComputedStyle(anchor).scrollMarginTop);
        if (anchor.getBoundingClientRect().top < pinnedAt) {
            anchor.scrollIntoView({ block: 'start' });
        }
    };

    return (
        <PublicPage
            title="About PHLGADIS"
            eyebrow="About us"
            back={{ href: '/#about', label: 'Back to home' }}
            metaDescription="What PHLGADIS is, its logo, organizational chart, CHED's A.C.H.I.E.V.E. Agenda, the Sustainable Development Goals, and a link to the GAD Herstory timeline."
        >
            <div className="public-container about-page">
                <Tabs
                    value={tab}
                    onValueChange={selectTab}
                    className="about-tabs-root"
                >
                    <div ref={anchorRef} className="about-tabs-anchor" />
                    <div className="about-tabs">
                        <TabsList
                            ref={listRef}
                            className="about-tab-list"
                            aria-label="About PHLGADIS topics"
                        >
                            {tabs.map((item) => (
                                <TabsTrigger key={item.id} value={item.id}>
                                    {item.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>
                    <TabsContent value="phlgadis" className="about-panel">
                        <div className="about-prose">
                            {whatIsPhlgadis.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="logo" className="about-panel">
                        <div className="logo-story">
                            <section
                                className="logo-block"
                                aria-labelledby="ched-logo-title"
                            >
                                <img
                                    className="logo-figure"
                                    src="/assets/img/ched_logo.png"
                                    width="1920"
                                    height="1915"
                                    alt="The CHED logo: a rising sun over a pyramid with a human silhouette, ringed by “Commission on Higher Education” and “1994”"
                                    decoding="async"
                                />
                                <div className="logo-copy">
                                    <h2 id="ched-logo-title">The CHED logo</h2>
                                    {chedLogo.map((paragraph, index) => (
                                        <Rich key={index} text={paragraph} />
                                    ))}
                                </div>
                            </section>
                            <section
                                className="logo-block"
                                aria-labelledby="phlgadis-logo-title"
                            >
                                <PhlgadisLogo className="logo-figure" />
                                <div className="logo-copy">
                                    <h2 id="phlgadis-logo-title">
                                        The PHLGADIS logo
                                    </h2>
                                    <Rich text={phlgadisLogo} />
                                </div>
                            </section>
                        </div>
                    </TabsContent>
                    <TabsContent value="organization" className="about-panel">
                        <OrganizationalChart />
                    </TabsContent>
                    <TabsContent value="achieve" className="about-panel">
                        <AchieveAgenda />
                    </TabsContent>
                    <TabsContent value="goals" className="about-panel">
                        {/* Each goal opens its page on the UN's site; hover
                            or focus shows a "Read more" over the tile. */}
                        <ul className="about-goals">
                            {sustainableGoals.map((goal) => (
                                <li key={goal.number}>
                                    <a
                                        className="goal-tile"
                                        href={goal.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img
                                            src={goal.image}
                                            width="320"
                                            height="320"
                                            alt={`Goal ${goal.number}: ${goal.name}`}
                                            decoding="async"
                                        />
                                        <span className="sr-only">
                                            {' '}
                                            (opens the UN page in a new tab)
                                        </span>
                                        <span
                                            className="goal-tile-more"
                                            aria-hidden="true"
                                        >
                                            <span>
                                                Read more
                                                <ArrowUpRight />
                                            </span>
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </TabsContent>
                </Tabs>
                <section
                    className="notice-panel about-timeline-link"
                    aria-labelledby="about-timeline-title"
                >
                    <History aria-hidden="true" />
                    <div>
                        <h2 id="about-timeline-title">GAD Herstory</h2>
                        <p>
                            {herstory.length} milestones, {herstorySpan}.
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/about/gad-herstory">
                            View the timeline
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </Button>
                </section>
            </div>
        </PublicPage>
    );
}

// CHED's agenda as its site lays it out: a lettered tile per item, blue for
// the thrusts and red for the enablers, beside its title and aim.
function AchieveAgenda() {
    return (
        <>
            <div className="achieve-header">
                <div className="achieve-seals">
                    <img
                        src="/assets/img/ched_logo.png"
                        width="1920"
                        height="1915"
                        alt="Commission on Higher Education"
                        decoding="async"
                    />
                    <img
                        src="/assets/img/bagong_pilipinas.png"
                        width="2263"
                        height="2263"
                        alt="Bagong Pilipinas"
                        decoding="async"
                    />
                    {/* achieve.png as supplied, trimmed of its empty margin
                        and resized for the web (achieve-mark.png). */}
                    <img
                        className="achieve-mark"
                        src="/assets/img/achieve-mark.png"
                        width="480"
                        height="389"
                        alt="ACHIEVE"
                        decoding="async"
                    />
                </div>
                <div>
                    <h2>A.C.H.I.E.V.E. Agenda</h2>
                    <p>
                        The Commission on Higher Education’s four thrusts and
                        three enablers.
                    </p>
                </div>
            </div>
            <ol className="achieve-list">
                {achieveAgenda.map((item) => (
                    <li key={item.title} className="achieve-item">
                        <span
                            className="achieve-tile"
                            data-role={item.role}
                            aria-hidden="true"
                        >
                            <span className="achieve-letter">
                                {item.letter}
                            </span>
                            <span className="achieve-role">{item.role}</span>
                        </span>
                        <div>
                            <h3>
                                <span className="sr-only">
                                    {item.role === 'thrust'
                                        ? 'Thrust: '
                                        : 'Enabler: '}
                                </span>
                                {item.title}
                            </h3>
                            <p>{item.description}</p>
                        </div>
                    </li>
                ))}
            </ol>
            <Button asChild variant="outline" className="achieve-source">
                <a
                    href={achieveSource}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Read the agenda on the CHED website
                    <span className="sr-only"> (opens in a new tab)</span>
                    <ArrowUpRight aria-hidden="true" />
                </a>
            </Button>
        </>
    );
}

// A paragraph with its bold terms, as the old page set them.
function Rich({ text }: { text: RichText }) {
    return (
        <p>
            {text.map((part, index) =>
                typeof part === 'string' ? (
                    part
                ) : (
                    <strong key={index}>{part.strong}</strong>
                ),
            )}
        </p>
    );
}
