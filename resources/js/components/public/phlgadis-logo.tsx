import { cn } from '@/lib/utils';

const alt =
    'PHLGADIS — Philippine Higher Education Gender and Development Information System';

// The PHLGADIS lockup: gadlogo.png on the light theme, and in dark mode the
// compact gadlogo2.png on the same white plate as the header. CSS picks the
// one to show; both load lazily, so the hidden one is never fetched.
export function PhlgadisLogo({ className }: { className?: string }) {
    return (
        <span className={cn('phlgadis-logo', className)}>
            <img
                className="phlgadis-logo-light"
                src="/assets/img/gadlogo.png"
                width="1053"
                height="345"
                loading="lazy"
                decoding="async"
                alt={alt}
            />
            <span className="phlgadis-logo-dark lockup-plate">
                <img
                    src="/assets/img/gadlogo2.png"
                    width="471"
                    height="150"
                    loading="lazy"
                    decoding="async"
                    alt={alt}
                />
            </span>
        </span>
    );
}
