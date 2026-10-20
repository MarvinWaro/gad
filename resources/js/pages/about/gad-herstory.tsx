import { Fragment, useCallback, useLayoutEffect, useState } from 'react';
import {
    Award,
    FileText,
    Globe,
    Presentation,
    Scale,
    Users,
} from 'lucide-react';
import { HerstoryFlight } from '@/components/public/herstory-flight';
import { PublicPage } from '@/components/public/public-page';
import { herstory, herstorySpan, type HerstoryEntry } from '@/data/herstory';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
import { canAnimate3d } from '@/lib/scroll-scenes';
import '../../../css/public.css';

const kindIcons = {
    convention: Globe,
    law: Scale,
    rules: FileText,
    office: Users,
    event: Presentation,
    award: Award,
} satisfies Record<HerstoryEntry['kind'], typeof Globe>;

export default function GadHerstory() {
    // The flight where the device can run it; the still timeline under
    // reduced motion, without WebGL, or where it would draw in software.
    // Decided before the first paint, so the page never swaps in view.
    const [live, setLive] = useState<boolean | null>(null);
    useLayoutEffect(() => setLive(canAnimate3d()), []);
    const showStill = useCallback(() => setLive(false), []);

    return (
        <PublicPage
            title="GAD Herstory"
            eyebrow="About us"
            back={{ href: '/#about', label: 'Back to home' }}
            description={`Milestones in gender and development, from ${herstorySpan}.`}
            summary={`${herstory.length} milestones`}
            metaDescription={`A timeline of gender and development milestones in the Philippines and at CHED, from ${herstorySpan}.`}
        >
            {live === false ? (
                <StillTimeline />
            ) : (
                <HerstoryFlight
                    entries={herstory}
                    animate={live === true}
                    onUnavailable={showStill}
                />
            )}
        </PublicPage>
    );
}

function StillTimeline() {
    // The centre line fills in as the reader moves down the timeline.
    const timeline = useScrollProgress<HTMLOListElement>();

    return (
        <div className="public-container timeline-frame">
            <ol ref={timeline} className="timeline">
                {herstory.map((entry, index) => (
                    <TimelineStep
                        key={entry.id}
                        entry={entry}
                        side={index % 2 === 0 ? 'start' : 'end'}
                    />
                ))}
            </ol>
        </div>
    );
}

// Text on one side of the axis and its photo on the other, alternating.
// An entry without a photo shows its year in the frame instead, so the
// zig-zag keeps its rhythm.
function TimelineStep({
    entry,
    side,
}: {
    entry: HerstoryEntry;
    side: 'start' | 'end';
}) {
    const Icon = kindIcons[entry.kind];

    return (
        <li className="timeline-step" data-side={side}>
            <div className="timeline-text">
                <time dateTime={entry.datetime}>{entry.date}</time>
                <h2>{entry.title}</h2>
                <p>
                    {entry.lines.map((line, index) => (
                        <Fragment key={index}>
                            {index > 0 && <br />}
                            {line}
                        </Fragment>
                    ))}
                </p>
            </div>
            <span className="timeline-badge" aria-hidden="true">
                <span>
                    <Icon />
                </span>
            </span>
            {entry.image ? (
                <div className="timeline-media">
                    <img
                        src={entry.image.src}
                        alt={entry.image.alt}
                        width="600"
                        height="400"
                        loading="lazy"
                        decoding="async"
                    />
                </div>
            ) : (
                <div
                    className="timeline-media"
                    data-empty=""
                    aria-hidden="true"
                >
                    <span>{entry.datetime.slice(0, 4)}</span>
                </div>
            )}
        </li>
    );
}
