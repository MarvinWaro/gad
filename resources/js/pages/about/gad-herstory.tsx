import { Fragment } from 'react';
import {
    Award,
    FileText,
    Globe,
    Presentation,
    Scale,
    Users,
} from 'lucide-react';
import { PublicPage } from '@/components/public/public-page';
import { herstory, herstorySpan, type HerstoryEntry } from '@/data/herstory';
import { useScrollProgress } from '@/hooks/use-scroll-progress';
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
    // The centre line fills in as the reader moves down the timeline.
    const timeline = useScrollProgress<HTMLOListElement>();

    return (
        <PublicPage
            title="GAD Herstory"
            eyebrow="About us"
            back={{ href: '/#about', label: 'Back to home' }}
            description={`Milestones in gender and development, from ${herstorySpan}.`}
            summary={`${herstory.length} milestones`}
            metaDescription={`A timeline of gender and development milestones in the Philippines and at CHED, from ${herstorySpan}.`}
        >
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
        </PublicPage>
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
