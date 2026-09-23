import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(
    props: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'>,
) {
    return (
        <img
            {...props}
            src="/assets/img/gadicon.png"
            alt=""
            width="249"
            height="266"
        />
    );
}
