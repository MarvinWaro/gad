import { useState } from 'react';
import { SectionHeading } from '@/components/public/shared';

const topics = [
    { id: 'herstory', label: 'GAD Herstory' },
    { id: 'organization', label: 'Organizational Chart' },
    { id: 'phlgadis', label: 'What is PHLGADIS?' },
    { id: 'logo', label: 'The Logo' },
    { id: 'goals', label: 'Sustainable Development Goals' },
] as const;

type Topic = (typeof topics)[number]['id'];

const milestones = [
    {
        title: 'CEDAW',
        description:
            'The Convention on the Elimination of All Forms of Discrimination Against Women.',
        image: '/assets/img/cedaw.png',
        alt: 'CEDAW emblem from the earlier GAD collection',
    },
    {
        title: 'Beijing, 1995',
        description: 'The Fourth World Conference on Women.',
        image: '/assets/img/beijing.png',
        alt: 'Photograph of the Fourth World Conference on Women in Beijing',
    },
    {
        title: 'Magna Carta of Women',
        description: 'A Philippine milestone for women’s rights.',
        image: '/assets/img/aug.png',
        alt: 'Magna Carta of Women tenth anniversary event photograph',
    },
];

const goalNames = [
    'No Poverty',
    'Zero Hunger',
    'Good Health and Well-Being',
    'Quality Education',
    'Gender Equality',
    'Clean Water and Sanitation',
    'Affordable and Clean Energy',
    'Decent Work and Economic Growth',
    'Industry, Innovation and Infrastructure',
    'Reduced Inequalities',
    'Sustainable Cities and Communities',
    'Responsible Consumption and Production',
    'Climate Action',
    'Life Below Water',
    'Life on Land',
    'Peace, Justice and Strong Institutions',
    'Partnerships for the Goals',
];

function TopicContent({ topic }: { topic: Topic }) {
    switch (topic) {
        case 'herstory':
            return (
                <div className="about-milestones">
                    {milestones.map((milestone) => (
                        <figure key={milestone.title}>
                            <img
                                src={milestone.image}
                                alt={milestone.alt}
                                loading="lazy"
                                decoding="async"
                            />
                            <figcaption>
                                <strong>{milestone.title}</strong>
                                <span>{milestone.description}</span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            );
        case 'organization':
            return (
                <div className="about-unavailable">
                    <p>
                        The organizational chart from the previous site is not
                        available in this project yet.
                    </p>
                    <p>
                        This space is ready for the approved chart when its
                        source file is provided.
                    </p>
                </div>
            );
        case 'phlgadis':
            return (
                <div className="about-prose">
                    <p>
                        PHLGADIS is the Philippine Higher Education Gender and
                        Development Information System of the Commission on
                        Higher Education Regional Office XII.
                    </p>
                    <p>
                        The platform brings together GAD information for higher
                        education institutions, public information on four GAD
                        laws, and anonymous law surveys. Its members can share
                        campus activities and follow regional GAD events.
                    </p>
                </div>
            );
        case 'logo':
            return (
                <div className="about-logo">
                    <img
                        src="/assets/img/gadlogo.png"
                        width="1053"
                        height="345"
                        alt="PHLGADIS — Philippine Higher Education Gender and Development Information System"
                        loading="lazy"
                        decoding="async"
                    />
                    <p>
                        Philippine Higher Education Gender and Development
                        Information System
                    </p>
                </div>
            );
        case 'goals':
            return (
                <div className="about-goals">
                    {goalNames.map((name, index) => (
                        <figure key={name}>
                            <img
                                src={`/assets/sdg/sdg-${String(index + 1).padStart(2, '0')}.png`}
                                width="1500"
                                height="1500"
                                alt={`Goal ${index + 1}: ${name}`}
                                loading="lazy"
                                decoding="async"
                            />
                            <figcaption className="sr-only">
                                Goal {index + 1}: {name}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            );
    }
}

export function About() {
    const [selected, setSelected] = useState<Topic>('herstory');
    const title = topics.find((topic) => topic.id === selected)!.label;

    return (
        <section id="about" className="public-container public-section">
            <SectionHeading
                label="About us"
                title="Get to know PHLGADIS."
                description="Explore the topics featured in the earlier site."
            />
            <div className="about-module">
                <div
                    className="about-topics"
                    role="group"
                    aria-label="About us topics"
                >
                    {topics.map((topic) => (
                        <button
                            key={topic.id}
                            type="button"
                            aria-pressed={selected === topic.id}
                            aria-controls="about-topic-content"
                            onClick={() => setSelected(topic.id)}
                        >
                            {topic.label}
                        </button>
                    ))}
                </div>
                <div
                    id="about-topic-content"
                    className="about-content"
                    aria-labelledby="about-topic-title"
                    role="region"
                >
                    <h3 id="about-topic-title">{title}</h3>
                    <TopicContent topic={selected} />
                </div>
            </div>
        </section>
    );
}
