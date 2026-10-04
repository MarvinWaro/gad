import {
    Award,
    BadgeCheck,
    Camera,
    Compass,
    Globe,
    Medal as MedalIcon,
    Sparkles,
    Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MedalKind } from '@/types/badges';

type Tone = { ring: string; ribbon: string; disc: string; icon: string };

/**
 * Three tones, from plain to gold, all from the design tokens so they turn
 * with dark mode: plain for finishing a quest, violet for every other badge,
 * gold for a perfect score.
 */
const tones = {
    plain: {
        ring: 'fill-muted-foreground/35',
        ribbon: 'fill-muted-foreground/25',
        disc: 'fill-muted',
        icon: 'text-muted-foreground',
    },
    violet: {
        ring: 'fill-brand',
        ribbon: 'fill-brand/60',
        disc: 'fill-brand-soft',
        icon: 'text-brand',
    },
    gold: {
        ring: 'fill-signature-mustard',
        ribbon: 'fill-signature-mustard/60',
        disc: 'fill-accent',
        icon: 'text-signature-violet dark:text-signature-mustard',
    },
} satisfies Record<string, Tone>;

const medals: Record<MedalKind, { icon: LucideIcon; tone: Tone }> = {
    participant: { icon: BadgeCheck, tone: tones.plain },
    advocate: { icon: MedalIcon, tone: tones.violet },
    champion: { icon: Trophy, tone: tones.gold },
    'community-spark': { icon: Sparkles, tone: tones.violet },
    'visual-storyteller': { icon: Camera, tone: tones.violet },
    // A plain globe: the UN's SDG colour wheel and icons are not for badges.
    'sdg-connector': { icon: Globe, tone: tones.violet },
    'agenda-builder': { icon: Compass, tone: tones.violet },
    custom: { icon: Award, tone: tones.violet },
};

/**
 * Every badge's medal, one flat style: two ribbon tails under a ring, a
 * disc and the badge's icon. A badge with an uploaded picture shows the
 * picture instead, in the same box. Decorative: the badge's name is always
 * written beside it.
 */
export function Medal({
    kind,
    image = null,
    className,
}: {
    kind: MedalKind;
    image?: string | null;
    className?: string;
}) {
    const { icon: Icon, tone } = medals[kind] ?? medals.custom;

    return (
        <span
            aria-hidden
            className={cn('inline-flex size-12 shrink-0', className)}
        >
            {image ? (
                <img
                    src={image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-contain"
                />
            ) : (
                <svg viewBox="0 0 64 72" className="size-full">
                    <path
                        className={tone.ribbon}
                        d="M18 44 L10 66 L18 62 L22 70 L30 50 Z M46 44 L54 66 L46 62 L42 70 L34 50 Z"
                    />
                    <circle className={tone.ring} cx="32" cy="29" r="27" />
                    <circle
                        className={cn(tone.disc, 'stroke-card')}
                        strokeWidth="2"
                        cx="32"
                        cy="29"
                        r="21"
                    />
                    <Icon
                        x={20}
                        y={17}
                        width={24}
                        height={24}
                        strokeWidth={1.75}
                        className={tone.icon}
                    />
                </svg>
            )}
        </span>
    );
}
