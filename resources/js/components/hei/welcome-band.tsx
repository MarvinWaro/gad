import type { HeiSummary } from '@/types';

function greeting(hour: number): string {
    if (hour < 12) {
        return 'Good morning';
    }

    return hour < 18 ? 'Good afternoon' : 'Good evening';
}

/**
 * The institution leads, set like a nameplate on plain canvas. DESIGN.md keeps
 * heroes calm: no gradient, no card, weight 400 at display size.
 */
export function WelcomeBand({
    hei,
    userName,
}: {
    hei: HeiSummary | null;
    userName: string;
}) {
    const firstName = userName.trim().split(/\s+/u)[0] ?? userName;

    return (
        <section className="pt-8 pb-8 sm:pt-12">
            <h1 className="max-w-4xl text-[1.75rem] leading-[1.15] font-normal text-balance sm:text-[2rem]">
                {hei?.display_name ?? userName}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
                {greeting(new Date().getHours())}, {firstName}
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
