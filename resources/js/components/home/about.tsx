import { Globe, History, Info, Network, Target } from 'lucide-react';
import { LinkCards } from '@/components/public/link-cards';
import { SectionHeading } from '@/components/public/shared';
import { aboutTopics, type AboutTopic } from '@/data/about';

const topicIcons = {
    herstory: History,
    organization: Network,
    phlgadis: Info,
    achieve: Target,
    goals: Globe,
} satisfies Record<AboutTopic['id'], typeof History>;

export function About() {
    return (
        <section id="about" className="public-container public-section">
            <SectionHeading
                label="About us"
                title="Get to know PHLGADIS."
                description="Explore the topics featured in the earlier site."
            />
            <LinkCards
                cards={aboutTopics.map((topic) => ({
                    ...topic,
                    icon: topicIcons[topic.id],
                }))}
            />
        </section>
    );
}
