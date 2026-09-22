import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    FileText,
    MessageSquare,
    Scale,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    AvailabilityButton,
    MediaPanel,
    PreviewDialog,
    SectionHeading,
} from '@/components/public/shared';
import type {
    ContentRecord,
    LawRecord,
    ResourceRecord,
} from '@/data/phlgadis-demo';

export function Rights({ laws }: { laws: LawRecord[] }) {
    return (
        <section id="rights" className="public-container public-section">
            <SectionHeading
                label="Knowledge empowers"
                title="Your rights. A stronger foundation."
                description="Get to know the four GAD enabling laws and the conversations they make possible."
            />
            <div className="laws-grid">
                {laws.map((law) => {
                    return (
                        <Card className="law-card" key={law.number}>
                            <div className="law-art">
                                <img
                                    src={law.image.src}
                                    width="285"
                                    height="160"
                                    loading="lazy"
                                    decoding="async"
                                    alt={law.image.alt}
                                />
                            </div>
                            <div className="law-body">
                                <span className="law-number">{law.number}</span>
                                <h3>{law.title}</h3>
                                <PreviewDialog
                                    title={`${law.number} · ${law.title}`}
                                    description={law.description}
                                    content={
                                        <p className="availability-note">
                                            Verified law texts, learning
                                            materials, and related survey links
                                            will be added here. This preview
                                            does not provide legal guidance.
                                        </p>
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        className="text-action"
                                    >
                                        Explore this law
                                        <ArrowUpRight />
                                    </Button>
                                </PreviewDialog>
                            </div>
                        </Card>
                    );
                })}
            </div>
            <div id="surveys" className="survey-strip">
                <div className="survey-message">
                    <span className="survey-icon">
                        <MessageSquare size={21} strokeWidth={1.5} />
                    </span>
                    <div>
                        <h3>Your experience can inform change.</h3>
                        <p>
                            GAD surveys are coming to this space. Participation
                            is unavailable in this preview.
                        </p>
                    </div>
                </div>
                <AvailabilityButton
                    title="GAD surveys"
                    className="survey-button"
                >
                    Explore surveys
                </AvailabilityButton>
            </div>
        </section>
    );
}

export function Stories({ stories }: { stories: ContentRecord[] }) {
    return (
        <section id="stories" className="public-container public-section">
            <SectionHeading
                label="People & progress"
                title="Gender mainstreaming in action."
                description="A look at the ideas, communities, and efforts moving us forward."
            >
                <span className="demo-badge">Sample stories</span>
            </SectionHeading>
            <div className="stories-grid">
                {stories.map((story, index) => (
                    <article
                        key={story.id}
                        className={`story-card ${index === 0 ? 'story-featured' : ''}`}
                    >
                        <MediaPanel media={story.media} />
                        <div className="story-copy">
                            <p className="story-category">
                                {story.category}
                                <span>Preview</span>
                            </p>
                            <h3>{story.title}</h3>
                            {index === 0 && (
                                <p className="story-description">
                                    {story.description}
                                </p>
                            )}
                            <PreviewDialog
                                title={story.title}
                                description="Illustrative story — not a published institutional report."
                                content={
                                    <div className="story-preview">
                                        <MediaPanel media={story.media} />
                                        <p>{story.description}</p>
                                        <p>
                                            Verified stories, dates, and
                                            institutional attribution will
                                            replace this sample.
                                        </p>
                                    </div>
                                }
                            >
                                <Button variant="ghost" className="text-action">
                                    Read preview
                                    <ArrowUpRight />
                                </Button>
                            </PreviewDialog>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

export function Campaign() {
    return (
        <section
            className="public-container campaign-section"
            aria-labelledby="campaign-title"
        >
            <div className="campaign">
                <div>
                    <p className="section-label">
                        <span />
                        Awareness into action
                        <span className="campaign-sample">Sample campaign</span>
                    </p>
                    <h2 id="campaign-title">
                        A future free
                        <br />
                        from violence.
                    </h2>
                    <p className="campaign-name">
                        18-Day Campaign to End Violence Against Women
                    </p>
                    <p className="campaign-description">
                        Make space for awareness, solidarity, and a shared
                        commitment to safer communities.
                    </p>
                    <PreviewDialog
                        title="18-Day Campaign to End Violence Against Women"
                        description="Sample campaign feature. Official dates, activities, and campaign materials will be added when verified."
                    >
                        <Button variant="outline">
                            Explore the campaign
                            <ArrowUpRight />
                        </Button>
                    </PreviewDialog>
                </div>
                <div
                    className="campaign-art"
                    role="img"
                    aria-label="Campaign artwork placeholder"
                >
                    <span className="campaign-ring" />
                    <span className="campaign-big-number">
                        18<span>days of action</span>
                    </span>
                    <span className="campaign-art-label">
                        Campaign artwork placeholder
                    </span>
                </div>
            </div>
        </section>
    );
}

const resourceIcons = [FileText, BookOpen, Scale, Sparkles];
export function Resources({ resources }: { resources: ResourceRecord[] }) {
    return (
        <section id="resources" className="public-container public-section">
            <SectionHeading
                label="Tools for change"
                title="Learn more. Do more."
                description="A growing collection of knowledge for gender-responsive higher education."
            />
            <div className="resources-grid">
                {resources.map((resource, index) => {
                    const Icon = resourceIcons[index % resourceIcons.length];
                    return (
                        <PreviewDialog
                            key={resource.title}
                            title={resource.title}
                            description="Downloads are not yet available. Verified resources will be connected here."
                        >
                            <button className="resource-card">
                                <Icon strokeWidth={1.5} />
                                <h3>{resource.title}</h3>
                                <p>{resource.description}</p>
                                <span>
                                    Coming soon
                                    <ArrowUpRight size={17} />
                                </span>
                            </button>
                        </PreviewDialog>
                    );
                })}
            </div>
        </section>
    );
}

export function Feedback() {
    return (
        <section id="feedback" className="feedback-section">
            <div className="public-container feedback-inner">
                <div>
                    <p className="section-label">
                        <span />
                        Built around you
                    </p>
                    <h2>Help shape a better PHLGADIS.</h2>
                    <p>
                        Your perspective helps us improve the information and
                        services available through the platform.
                    </p>
                </div>
                <PreviewDialog
                    title="Share your feedback"
                    description="Feedback collection is not connected in this design preview. No responses are saved or sent."
                >
                    <Button size="lg">
                        Share feedback
                        <ArrowRight />
                    </Button>
                </PreviewDialog>
            </div>
        </section>
    );
}
