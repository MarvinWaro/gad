import type { HeiSummary } from '@/types';

/** "Good morning", "Good afternoon" or "Good evening", by the hour. */
export function greeting(hour: number = new Date().getHours()): string {
    if (hour < 12) {
        return 'Good morning';
    }

    return hour < 18 ? 'Good afternoon' : 'Good evening';
}

/** The first word of a person's name, for greeting them. */
export function firstName(name: string): string {
    return name.trim().split(/\s+/u)[0] ?? name;
}

/**
 * The institution leads, set like a nameplate on plain canvas. DESIGN.md keeps
 * heroes calm: no gradient, no card, weight 400 at display size. Below 1280px
 * only; wider, the left rail's first row names the institution instead.
 */
export function WelcomeBand({
    hei,
    userName,
}: {
    hei: HeiSummary | null;
    userName: string;
}) {
    return (
        <section className="pt-8 pb-8 sm:pt-12">
            <h1 className="max-w-4xl text-[1.75rem] leading-[1.15] font-normal text-balance sm:text-[2rem]">
                {hei?.display_name ?? userName}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
                {greeting()}, {firstName(userName)}
                {hei?.cluster && (
                    <>
                        <span aria-hidden> · </span>
                        {hei.cluster} cluster, CHED Regional Office XII
                    </>
                )}
            </p>
        </section>
    );
}
