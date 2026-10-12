import { useMemo } from 'react';
import {
    backgroundOf,
    backgroundSvg,
    paperColors,
    PAGE,
} from '@/lib/certificate-page';
import { cn } from '@/lib/utils';

/**
 * A certificate background, small: the same drawing the PDF prints, on
 * paper in both themes.
 */
export function BackgroundThumbnail({
    background,
    className,
}: {
    background: string;
    className?: string;
}) {
    const code = backgroundOf(background);
    const src = useMemo(
        () =>
            `data:image/svg+xml,${encodeURIComponent(backgroundSvg(code, paperColors()))}`,
        [code],
    );

    return (
        <img
            src={src}
            alt=""
            aria-hidden
            className={cn('block h-auto rounded-sm border', className)}
            style={{ aspectRatio: `${PAGE.width} / ${PAGE.height}` }}
        />
    );
}
