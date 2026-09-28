import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const wcag = ['wcag2a', 'wcag2aa', 'wcag21aa'];

// Homepage order. GAD Herstory opens its timeline page, the other topics
// with content their /about tab; the organizational chart stays static
// until its source file is supplied.
const topics: { title: string; summary?: string; href?: string }[] = [
    {
        title: 'GAD Herstory',
        summary: '13 milestones',
        href: '/about/gad-herstory',
    },
    { title: 'Organizational Chart' },
    {
        title: 'What is PHLGADIS?',
        summary: 'Overview and logo',
        href: '/about#phlgadis',
    },
    {
        title: 'A.C.H.I.E.V.E. Agenda',
        summary: '4 thrusts, 3 enablers',
        href: '/about#achieve',
    },
    {
        title: 'Sustainable Development Goals',
        summary: '17 goals',
        href: '/about#goals',
    },
];

const tabs = [
    'What is PHLGADIS?',
    'The Logo',
    'A.C.H.I.E.V.E. Agenda',
    'Sustainable Development Goals',
];

// CHED's agenda, as ched.gov.ph/achieve-agenda lists it (data/achieve.ts).
const agenda = [
    ['A', 'thrust', 'Advanced and Accessible Lifelong Learning'],
    ['C', 'thrust', 'Centralized One-Nation Human Capital Development'],
    [
        'H',
        'thrust',
        'Harmonized SDG-Based Research, Development, and Innovation',
    ],
    ['I', 'thrust', 'Inclusive and Impact-driven Internationalization'],
    [
        'E',
        'enabler',
        'Expanded and Integrated Real-Time Data Collection and Analytics',
    ],
    ['V', 'enabler', 'Vitalized Policies, Internal Systems, and Governance'],
    ['E', 'enabler', 'Effective and Efficient Public Service'],
];

// The old PHLGADIS timeline's titles, in order (data/herstory.ts).
const milestones = [
    'CEDAW',
    'RA 7192',
    'RA 7722',
    'RA 7877',
    'Adopts CEDAW and BPFA',
    'RA 9262',
    'RA 9710',
    'Magna Carta of Women',
    'Violence against Women',
    'Creation of CHED GAD Focal',
    'Education Summit',
    'Gender Mainstreaming',
    'GADtimpala Award 2018',
];

test('the homepage About cards open the About page and the timeline', async ({
    page,
}) => {
    await page.goto('/');
    await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'About' })
        .click();
    await expect(page).toHaveURL(/\/#about$/);

    const cards = page.locator('#about .resource-card');
    await expect(cards).toHaveCount(topics.length);
    for (const [index, topic] of topics.entries()) {
        const card = cards.nth(index);
        await expect(card.getByRole('heading')).toHaveText(topic.title);
        if (topic.href) {
            await expect(card.getByRole('link')).toHaveAttribute(
                'href',
                topic.href,
            );
            await expect(card).toContainText(topic.summary!);
        } else {
            await expect(card.getByRole('link')).toHaveCount(0);
            await expect(card).toContainText('Content coming soon');
        }
    }

    // A card opens its tab.
    await cards.nth(4).getByRole('link').click();
    await expect(page).toHaveURL(/\/about#goals$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'About PHLGADIS',
    );
    const tablist = page.getByRole('tablist', {
        name: 'About PHLGADIS topics',
    });
    await expect(tablist.getByRole('tab')).toHaveText(tabs);
    await expect(
        tablist.getByRole('tab', { name: 'Sustainable Development Goals' }),
    ).toHaveAttribute('aria-selected', 'true');
    const goals = page.getByRole('tabpanel', {
        name: 'Sustainable Development Goals',
    });
    await expect(goals.locator('img')).toHaveCount(17);
    await expect(
        goals.getByRole('img', { name: 'Goal 5: Gender Equality' }),
    ).toBeVisible();

    // Each tile links to its goal's UN page, in a new tab, and says so on
    // hover.
    const tiles = goals.getByRole('link');
    await expect(tiles).toHaveCount(17);
    expect(
        await tiles.evaluateAll((links) =>
            links.map((link) => [
                link.getAttribute('href'),
                link.getAttribute('target'),
            ]),
        ),
    ).toEqual(
        [
            'poverty',
            'hunger',
            'health',
            'education',
            'gender-equality',
            'water-and-sanitation',
            'energy',
            'economic-growth',
            'infrastructure-industrialization',
            'inequality',
            'cities',
            'sustainable-consumption-production',
            'climate-change',
            'oceans',
            'biodiversity',
            'peace-justice',
            'globalpartnerships',
        ].map((slug) => [
            `https://www.un.org/sustainabledevelopment/${slug}/`,
            '_blank',
        ]),
    );
    const first = tiles.first();
    await expect(first).toHaveAccessibleName(
        'Goal 1: No Poverty (opens the UN page in a new tab)',
    );
    const more = first.locator('.goal-tile-more');
    await expect(more).toHaveCSS('opacity', '0');
    await first.hover();
    await expect(more).toHaveCSS('opacity', '1');
    await expect(more).toHaveText('Read more');

    // Tabs switch by pointer and by arrow keys, and the URL follows.
    await tablist.getByRole('tab', { name: 'What is PHLGADIS?' }).click();
    await expect(page).toHaveURL(/\/about#phlgadis$/);
    await expect(
        page.getByRole('tabpanel', { name: 'What is PHLGADIS?' }),
    ).toContainText(
        'Philippine Higher Education Gender and Development Information System',
    );
    await page.keyboard.press('ArrowRight');
    await expect(tablist.getByRole('tab', { name: 'The Logo' })).toBeFocused();
    await expect(page).toHaveURL(/\/about#logo$/);
    await expect(
        page
            .getByRole('tabpanel', { name: 'The Logo' })
            .getByRole('img', { name: /PHLGADIS — Philippine Higher/ }),
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Back to home' }),
    ).toHaveAttribute('href', '/#about');

    // The GAD Herstory timeline has a page of its own, linked at the end.
    await expect(page.locator('#herstory')).toHaveCount(0);
    const timelineLink = page.getByRole('region', { name: 'GAD Herstory' });
    await expect(timelineLink).toContainText('13 milestones, 1981 to 2019.');
    await timelineLink.getByRole('link', { name: 'View the timeline' }).click();
    await expect(page).toHaveURL(/\/about\/gad-herstory$/);
});

test('the GAD Herstory timeline lists the old milestones and fills as you scroll', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/about/gad-herstory');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'GAD Herstory',
    );
    const steps = page.locator('.timeline > li');
    await expect(steps.getByRole('heading', { level: 2 })).toHaveText(
        milestones,
    );
    await expect(steps.locator('time').first()).toHaveAttribute(
        'datetime',
        '1981-08',
    );
    await expect(steps.locator('img')).toHaveCount(5);
    // Steps alternate sides of the centre line.
    await expect(steps.nth(0)).toHaveAttribute('data-side', 'start');
    await expect(steps.nth(1)).toHaveAttribute('data-side', 'end');

    const progress = () =>
        page
            .locator('.timeline')
            .evaluate((element) =>
                Number(element.style.getPropertyValue('--scroll-progress')),
            );
    expect(await progress()).toBeLessThan(0.1);
    await page.evaluate(() =>
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'instant',
        }),
    );
    await expect.poll(progress).toBe(1);
});

test('the A.C.H.I.E.V.E. Agenda tab lists CHED’s thrusts and enablers', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/about#achieve');
    const panel = page.getByRole('tabpanel', {
        name: 'A.C.H.I.E.V.E. Agenda',
    });
    await expect(
        panel.getByRole('heading', { level: 2, name: 'A.C.H.I.E.V.E. Agenda' }),
    ).toBeVisible();
    await expect(
        panel.getByRole('img', { name: 'Commission on Higher Education' }),
    ).toBeVisible();
    await expect(
        panel.getByRole('img', { name: 'Bagong Pilipinas' }),
    ).toBeVisible();
    await expect(panel.getByRole('img', { name: 'ACHIEVE' })).toBeVisible();

    const items = panel.locator('.achieve-item');
    await expect(items).toHaveCount(agenda.length);
    for (const [index, [letter, role, title]] of agenda.entries()) {
        const item = items.nth(index);
        await expect(item.locator('.achieve-letter')).toHaveText(letter);
        await expect(item.locator('.achieve-tile')).toHaveAttribute(
            'data-role',
            role,
        );
        await expect(item.getByRole('heading', { level: 3 })).toHaveText(
            `${role === 'thrust' ? 'Thrust' : 'Enabler'}: ${title}`,
        );
    }
    await expect(
        panel.getByRole('link', {
            name: /Read the agenda on the CHED website/,
        }),
    ).toHaveAttribute('href', 'https://ched.gov.ph/achieve-agenda');
});

test('the PHLGADIS and Logo tabs carry the old site’s full text', async ({
    page,
}) => {
    await page.goto('/about#phlgadis');
    const about = page.getByRole('tabpanel', { name: 'What is PHLGADIS?' });
    await expect(about.locator('p')).toHaveCount(9);
    await expect(about.locator('p').first()).toHaveText(
        /^The Commission on Higher Education has a long history/,
    );
    await expect(about).not.toContainText('PHILGADIS');

    await page.getByRole('tab', { name: 'The Logo' }).click();
    const logo = page.getByRole('tabpanel', { name: 'The Logo' });
    await expect(logo.getByRole('heading', { level: 2 })).toHaveText([
        'The CHED logo',
        'The PHLGADIS logo',
    ]);
    await expect(logo.locator('p')).toHaveCount(8);
    // The old page's bold terms stay bold.
    await expect(logo.locator('strong')).toHaveText([
        'CHED LOGO',
        'pyramid',
        'human silhouette',
        'rising sun',
        'sun’s rays',
        'color triad: red, yellow',
        'blue',
        'year 1994',
        'PHLGADIS logo',
        '“PHL”',
        '“IS”',
        '“GAD”',
    ]);
    await expect(logo.getByRole('img')).toHaveCount(2);
});

test('the About tabs stay pinned under the header while you scroll', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto('/about#achieve');
    const bar = page.locator('.about-tabs');
    await page.evaluate(() => window.scrollTo(0, 600));
    await expect
        .poll(async () => Math.round((await bar.boundingBox())!.y))
        .toBe(88);

    // Switching tabs while pinned starts the new panel right under the bar.
    await page
        .getByRole('tab', { name: 'Sustainable Development Goals' })
        .click();
    const panel = page.getByRole('tabpanel', {
        name: 'Sustainable Development Goals',
    });
    await expect
        .poll(async () => {
            const barBox = (await bar.boundingBox())!;
            const panelBox = (await panel.boundingBox())!;
            return Math.abs(
                Math.round(panelBox.y - (barBox.y + barBox.height)),
            );
        })
        .toBe(0);
});

for (const [path, name] of [
    ['/about#logo', 'about'],
    ['/about#achieve', 'achieve'],
    ['/about/gad-herstory', 'herstory'],
] as const) {
    for (const colorScheme of ['light', 'dark'] as const) {
        for (const width of [375, 1280]) {
            test(`${path} fits ${width}px in ${colorScheme} mode`, async ({
                page,
            }, testInfo) => {
                await page.setViewportSize({ width, height: 900 });
                await page.emulateMedia({
                    colorScheme,
                    reducedMotion: 'reduce',
                });
                await page.goto(path);
                if (name === 'about') {
                    await expect(
                        page
                            .getByRole('tabpanel', { name: 'The Logo' })
                            .getByRole('img', {
                                name: /PHLGADIS — Philippine Higher Education/,
                            }),
                    ).toBeVisible();
                } else if (name === 'achieve') {
                    await expect(page.locator('.achieve-item')).toHaveCount(
                        agenda.length,
                    );
                    // The sideways-scrolling bar brings the chosen tab
                    // into view, even on a phone.
                    await expect(
                        page.getByRole('tab', { selected: true }),
                    ).toBeInViewport({ ratio: 1 });
                } else {
                    await expect(page.locator('.timeline > li')).toHaveCount(
                        milestones.length,
                    );
                }
                expect(
                    await page.evaluate(
                        () =>
                            document.documentElement.scrollWidth >
                            window.innerWidth,
                    ),
                ).toBe(false);
                await page.screenshot({
                    path: testInfo.outputPath(
                        `${name}-${colorScheme}-${width}.png`,
                    ),
                    fullPage: true,
                });
                const accessibility = await new AxeBuilder({ page })
                    .withTags(wcag)
                    .analyze();
                expect(accessibility.violations).toEqual([]);
            });
        }
    }
}
