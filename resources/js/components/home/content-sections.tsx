import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    FileText,
    Scale,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    MediaPanel,
    PreviewDialog,
    SectionHeading,
} from '@/components/public/shared';
import type {
    ContentRecord,
    LawRecord,
    ResourceRecord,
} from '@/data/phlgadis-demo';

export function Rights({
    laws,
    openSurveys = [],
}: {
    laws: LawRecord[];
    openSurveys?: string[];
}) {
    return (
        <section id="rights" className="public-container public-section">
            <div className="section-heading rights-heading">
                <div>
                    <h2>Know Your Rights</h2>
                    <p className="section-description">
                        This survey on the four GAD enabling laws gathers
                        information about experiences involving sexual
                        harassment, violence, and discrimination. Select a law
                        below to proceed directly to its survey.
                    </p>
                    <p className="rights-note">
                        (This survey does not require personal information)
                    </p>
                </div>
            </div>
            <div id="surveys" className="laws-grid">
                {laws.map((law) => {
                    const isOpen = openSurveys.includes(law.slug);

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
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="text-action"
                                >
                                    <Link href={`/surveys/${law.slug}`}>
                                        {isOpen
                                            ? 'Take the Survey'
                                            : 'Opening soon'}
                                        <ArrowUpRight />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    );
                })}
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
