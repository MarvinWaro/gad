import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

export type LinkCard = {
    id: string;
    title: string;
    icon: LucideIcon;
    // Set once the card has a page; cards without one stay static.
    href?: string;
    summary?: string;
};

// The homepage's row of area cards (Resources, About). A card with a page
// links there, its title link stretched over the whole card.
export function LinkCards({ cards }: { cards: LinkCard[] }) {
    return (
        <ul className="resources-grid">
            {cards.map(({ id, title, icon: Icon, href, summary }) =>
                href ? (
                    <li className="resource-card resource-card-linked" key={id}>
                        <Icon aria-hidden="true" strokeWidth={1.5} />
                        <h3>
                            <Link className="resource-link" href={href}>
                                {title}
                            </Link>
                        </h3>
                        <span className="resource-summary">
                            {summary}
                            <ArrowUpRight aria-hidden="true" />
                        </span>
                    </li>
                ) : (
                    <li className="resource-card" key={id}>
                        <Icon aria-hidden="true" strokeWidth={1.5} />
                        <h3>{title}</h3>
                        <span>Content coming soon</span>
                    </li>
                ),
            )}
        </ul>
    );
}
