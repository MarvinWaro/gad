import { Head, usePage } from '@inertiajs/react';
import { Hero, QuickAccess } from '@/components/home/hero';
import {
    Campaign,
    Feedback,
    Resources,
    Rights,
    Stories,
} from '@/components/home/content-sections';
import { Statistics } from '@/components/home/statistics';
import { SiteFooter, SiteHeader } from '@/components/public/site-layout';
import {
    datasets,
    heroSlides,
    laws,
    resources,
    stories,
} from '@/data/phlgadis-demo';
import '../../css/public.css';

export default function Welcome() {
    const { auth } = usePage().props;
    return (
        <div className="public-theme">
            <Head>
                <title>PHLGADIS | Gender-responsive higher education</title>
                <link
                    rel="icon"
                    type="image/svg+xml"
                    href="/phlgadis-placeholder.svg"
                />
                <meta
                    name="description"
                    content="Explore gender and development in Philippine higher education. Discover GAD resources, know your rights, and explore the PHLGADIS data preview."
                />
            </Head>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <SiteHeader authenticated={Boolean(auth.user)} />
            <main id="main">
                <Hero slides={heroSlides} />
                <QuickAccess />
                <Rights laws={laws} />
                <Statistics datasets={datasets} />
                <Stories stories={stories} />
                <Campaign />
                <Resources resources={resources} />
                <Feedback />
            </main>
            <SiteFooter />
        </div>
    );
}
