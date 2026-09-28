import { Link } from '@inertiajs/react';
import { ArrowUpRight, Menu } from 'lucide-react';
import { PhlgadisLogo } from '@/components/public/phlgadis-logo';
import { ThemeToggle } from '@/components/theme-toggle';
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
import { chedContact } from '@/data/contact';
import { dashboard, login, register } from '@/routes';
import { faq } from '@/routes/help';

// In the order the sections appear on the homepage.
const navigation = [
    ['Home', '#home'],
    ['Surveys', '#surveys'],
    ['Data & statistics', '#statistics'],
    ['Resources', '#resources'],
    ['About', '#about'],
];

// After the sections comes the FAQ, a page of its own. The old site put it
// in a one-item help menu; a plain link does the same job.
const faqHref = faq.url();

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
                    <Link href={faqHref}>FAQ</Link>
                </nav>
                <div className="header-actions">
                    <ThemeToggle className="theme-toggle" />
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
                            <SheetClose asChild>
                                <Link href={faqHref}>
                                    FAQ
                                    <ArrowUpRight size={16} />
                                </Link>
                            </SheetClose>
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
        <footer className="site-footer">
            <div className="public-container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <a
                            href={resolvePublicHref('#home', homeUrl)}
                            className="footer-logo"
                            aria-label="PHLGADIS home"
                        >
                            <PhlgadisLogo />
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
                        <a href={chedContact.hotline.href}>
                            {chedContact.hotline.label}
                        </a>
                        <p>Email:</p>
                        <a href={`mailto:${chedContact.email}`}>
                            {chedContact.email}
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
