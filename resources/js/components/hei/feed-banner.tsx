/**
 * The feed's heading on the HEI home, set on a calm campus illustration
 * (hills, the sun and a school building at the right). The picture is a
 * backdrop only, so it is hidden from assistive technology; the words keep
 * to the open sky on its left, and in dark mode it fades back so it never
 * glares. The title and line are the old PHLGADIS HEI page's, word for word.
 */
export function FeedBanner({ titleId }: { titleId: string }) {
    return (
        <header className="relative isolate overflow-hidden rounded-xl border bg-card px-5 py-6 sm:px-6 sm:py-7">
            <img
                src="/assets/img/hei-banner-1440.webp"
                srcSet="/assets/img/hei-banner-720.webp 720w, /assets/img/hei-banner-1440.webp 1440w"
                sizes="(min-width: 1280px) 42rem, (min-width: 1024px) 60vw, 100vw"
                alt=""
                aria-hidden
                width="1440"
                height="480"
                decoding="async"
                className="absolute inset-0 -z-10 size-full object-cover object-[right_72%] dark:opacity-[0.16]"
            />
            <h2
                id={titleId}
                className="max-w-[70%] text-xl font-medium text-balance sm:max-w-md sm:text-2xl"
            >
                HEI Gender Mainstreaming Efforts
            </h2>
            <p className="mt-1 max-w-[60%] text-sm text-muted-foreground sm:max-w-md">
                Promoting gender equality and inclusivity in our school
                community
            </p>
        </header>
    );
}
