import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { ThemeToggle } from '@/components/theme-toggle';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    partners = false,
}: AuthLayoutProps) {
    return (
        // The dots need a plain block surface; the centred column sits inside.
        <div className="dot-backdrop relative bg-background">
            {/* Light or dark, as in the site's headers. */}
            <ThemeToggle className="absolute top-4 right-4 md:top-6 md:right-6" />
            <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            {partners ? (
                                <PartnerMarks />
                            ) : (
                                <Link
                                    href={home()}
                                    className="flex flex-col items-center gap-2 font-medium"
                                >
                                    <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                        <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
                                    </div>
                                    <span className="sr-only">{title}</span>
                                </Link>
                            )}

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * CHED, Bagong Pilipinas and the A.C.H.I.E.V.E. agenda, then PHLGADIS
 * itself, as CHED's other systems open: the official files as supplied
 * (the CHED seal scaled down for this 48px row). The ACHIEVE lettering is
 * dark and see-through, so dark mode sets it on a white plate. The whole
 * row leads home, whichever mark is clicked.
 */
function PartnerMarks() {
    return (
        <Link
            href={home()}
            aria-label="PHLGADIS home"
            className="flex items-center justify-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:gap-4"
        >
            <img
                src="/assets/img/ched_logo-240.png"
                width="240"
                height="239"
                alt="Commission on Higher Education"
                className="size-12 object-contain"
            />
            <img
                src="/assets/img/bagong_pilipinas-240.png"
                width="240"
                height="240"
                alt="Bagong Pilipinas"
                className="size-12 object-contain"
            />
            <img
                src="/assets/img/achieve-mark.png"
                width="480"
                height="389"
                alt="ACHIEVE"
                className="h-12 w-auto object-contain dark:rounded-md dark:bg-white dark:px-1.5 dark:py-1"
            />
            <span aria-hidden className="h-9 w-px bg-border" />
            <AppLogoIcon className="size-12 object-contain" />
        </Link>
    );
}
