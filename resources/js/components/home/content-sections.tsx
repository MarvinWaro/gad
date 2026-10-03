import { Link } from '@inertiajs/react';
import { ArrowRight, ArrowUpRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PostImages } from '@/components/hei/post-images';
import { LinkCards } from '@/components/public/link-cards';
import {
    MediaPanel,
    PreviewDialog,
    SectionHeading,
} from '@/components/public/shared';
import { achieveAgenda } from '@/data/achieve';
import type { LawRecord, ResourceRecord } from '@/data/phlgadis-demo';
import { localDay } from '@/lib/manila-time';
import { resourceIcons } from '@/lib/resource-icons';
import { create as feedback } from '@/routes/feedback';
import type { HomepageStory } from '@/types';

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
export function Stories({
    stories,
    signedIn,
}: {
    stories: HomepageStory[];
    /** Signed-in visitors open the post; guests log in first. */
    signedIn: boolean;
}) {
    return (
        <section id="stories" className="public-container public-section">
            <SectionHeading
                label="People & progress"
                title="Gender mainstreaming in action."
                description="A look at the ideas, communities, and efforts moving us forward."
            />
            {stories.length === 0 ? (
                <p className="stories-empty">
                    GAD activities that HEIs share with photos appear here as
                    the network reacts to them.
                </p>
            ) : (
                <div className="stories-grid">
                    {stories.map((story, index) => (
                        <article
                            key={story.id}
                            className={`story-card ${index === 0 ? 'story-featured' : ''}`}
                        >
                            <MediaPanel media={storyMedia(story)} />
                            <div className="story-copy">
                                <p className="story-category">
                                    {story.source}
                                    {story.posted_at && (
                                        <span>{localDay(story.posted_at)}</span>
                                    )}
                                </p>
                                <h3>{story.title}</h3>
                                {index === 0 &&
                                    story.excerpt !== story.title && (
                                        <p className="story-description">
                                            {story.excerpt}
                                        </p>
                                    )}
                                <p className="story-reactions">
                                    <Heart aria-hidden="true" />
                                    {reactionsLabel(story.reactions)}
                                </p>
                                <PreviewDialog
                                    label="Gender Mainstreaming"
                                    title={story.title}
                                    description={`Shared by ${story.source}${story.posted_at ? ` on ${localDay(story.posted_at)}` : ''}.`}
                                    content={
                                        <StoryPreview
                                            story={story}
                                            signedIn={signedIn}
                                        />
                                    }
                                >
                                    <Button
                                        variant="ghost"
                                        className="text-action"
                                    >
                                        Read story
                                        <ArrowUpRight />
                                    </Button>
                                </PreviewDialog>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function storyMedia(story: HomepageStory) {
    return {
        src: story.images[0]?.url,
        alt: `Photo from ${story.source}`,
        variant: 'campus' as const,
    };
}

function reactionsLabel(count: number): string {
    return count === 1
        ? '1 reaction'
        : `${count.toLocaleString('en-PH')} reactions`;
}

/** The whole post, as far as a visitor without an account may see it. */
function StoryPreview({
    story,
    signedIn,
}: {
    story: HomepageStory;
    signedIn: boolean;
}) {
    const goals = [
        ...story.sdgs.map((number) => `SDG ${number}`),
        ...achieveAgenda
            .filter((item) => story.achieve.includes(item.code))
            .map((item) => item.title),
    ];
    return (
        <div className="story-preview">
            {/* The feed's own mosaic: a lone photo whole in its shape, more
                as a grid with "+N", each opening the photo viewer. */}
            <div className="story-preview-photos">
                <PostImages images={story.images} sharedBy={story.source} />
            </div>
            {/* A one-line post is already its title. */}
            {story.body !== '' && story.body !== story.title && (
                <p className="story-preview-body">{story.body}</p>
            )}
            {goals.length > 0 && <p>Supports {goals.join(', ')}.</p>}
            <p>
                {reactionsLabel(story.reactions)} ·{' '}
                {story.comments === 1
                    ? '1 comment'
                    : `${story.comments.toLocaleString('en-PH')} comments`}
            </p>
            <Button asChild className="story-preview-action">
                <Link href={story.url}>
                    {signedIn ? 'Open the post' : 'Log in to react and comment'}
                    <ArrowUpRight />
                </Link>
            </Button>
        </div>
    );
}

export function Resources({ resources }: { resources: ResourceRecord[] }) {
    return (
        <section id="resources" className="public-container public-section">
            <SectionHeading
                label="Tools for change"
                title="Learn more. Do more."
                description="Explore five resource areas. Materials will be added as they become available."
            />
            <LinkCards
                cards={resources.map((resource) => ({
                    ...resource,
                    icon: resourceIcons[resource.id],
                }))}
            />
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
                <Button asChild size="lg">
                    <Link href={feedback.url()}>
                        Share feedback
                        <ArrowRight />
                    </Link>
                </Button>
            </div>
        </section>
    );
}
