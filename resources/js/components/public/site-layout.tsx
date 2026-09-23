import { Link } from '@inertiajs/react';
import { ArrowUpRight, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { dashboard, login, register } from '@/routes';

const navigation = [
    ['Home', '#home'],
    ['Resources', '#resources'],
    ['Surveys', '#surveys'],
    ['Data & statistics', '#statistics'],
    ['About', '#about'],
];

function resolvePublicHref(anchor: string, homeUrl?: string) {
    return homeUrl ? `${homeUrl}${anchor}` : anchor;
}

function Brand({ homeUrl }: { homeUrl?: string }) {
    return (
        <a
            href={resolvePublicHref('#home', homeUrl)}
            className="brand"
            aria-label="PHLGADIS home"
        >
            <img
                className="brand-logo"
                src="/assets/img/gadlogo2.png"
                width="471"
                height="150"
                decoding="async"
                alt="PHLGADIS"
            />
        </a>
    );
}

export function SiteHeader({
    authenticated,
    homeUrl,
}: {
    authenticated: boolean;
    homeUrl?: string;
}) {
    return (
        <header className="site-header">
            <div className="public-container header-inner">
                <Brand homeUrl={homeUrl} />
                <nav className="desktop-nav" aria-label="Main navigation">
                    {navigation.map(([label, href]) => (
                        <a key={href} href={resolvePublicHref(href, homeUrl)}>
                            {label}
                        </a>
                    ))}
                </nav>
                <div className="header-actions">
                    {authenticated ? (
                        <Button asChild variant="outline">
                            <Link href={dashboard()}>
                                Dashboard
                                <ArrowUpRight />
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button
                                asChild
                                variant="ghost"
                                className="login-link"
                            >
                                <Link href={login()}>Log in</Link>
                            </Button>
                            <Button asChild>
                                <Link href={register()}>
                                    Register
                                    <ArrowUpRight />
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="mobile-menu"
                            aria-label="Open navigation"
                        >
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="public-theme mobile-sheet">
                        <SheetHeader>
                            <SheetTitle>Explore PHLGADIS</SheetTitle>
                            <SheetDescription>
                                Gender-responsive higher education.
                            </SheetDescription>
                        </SheetHeader>
                        <nav aria-label="Mobile navigation">
                            {navigation.map(([label, href]) => (
                                <SheetClose key={href} asChild>
                                    <a href={resolvePublicHref(href, homeUrl)}>
                                        {label}
                                        <ArrowUpRight size={16} />
                                    </a>
                                </SheetClose>
                            ))}
                        </nav>
                        {!authenticated && (
                            <Button asChild variant="outline">
                                <Link href={login()}>
                                    Log in to your account
                                </Link>
                            </Button>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}

export function SiteFooter({ homeUrl }: { homeUrl?: string }) {
    return (
        <footer id="about" className="site-footer">
            <div className="public-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <a
                            href={resolvePublicHref('#home', homeUrl)}
                            className="footer-logo"
                            aria-label="PHLGADIS home"
                        >
                            <img
                                src="/assets/img/gadlogo.png"
                                width="1053"
                                height="345"
                                loading="lazy"
                                decoding="async"
                                alt="PHLGADIS — Philippine Higher Education Gender and Development Information System"
                            />
                        </a>
                        <p>
                            Philippine Higher Education Gender and Development
                            Information System
                        </p>
                    </div>
                    <div
                        className="footer-partners"
                        aria-label="Institutional partners"
                    >
                        <img
                            src="/assets/img/ched_logo.png"
                            width="1920"
                            height="1915"
                            loading="lazy"
                            decoding="async"
                            alt="Commission on Higher Education"
                        />
                        <img
                            src="/assets/img/bagong_pilipinas.png"
                            width="2263"
                            height="2263"
                            loading="lazy"
                            decoding="async"
                            alt="Bagong Pilipinas"
                        />
                        <img
                            src="/assets/img/freedom_information.png"
                            width="2299"
                            height="2266"
                            loading="lazy"
                            decoding="async"
                            alt="Freedom of Information Philippines"
                        />
                        <img
                            src="/assets/img/transparency_seal.png"
                            width="2263"
                            height="2263"
                            loading="lazy"
                            decoding="async"
                            alt="Transparency Seal"
                        />
                    </div>
                    <div className="footer-contact">
                        <h3>Contact</h3>
                        <p>Hotline:</p>
                        <a href="tel:+639366167199">+63 936 616 7199</a>
                        <p>Email:</p>
                        <a href="mailto:chedro12@ched.gov.ph">
                            chedro12@ched.gov.ph
                        </a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>
                        © {new Date().getFullYear()} Powered by CHEDRO XII. All
                        rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
