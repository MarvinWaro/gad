import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** An HEI Focal by default; `browser-member` is a plain HEI user. */
async function logIn(page: Page, email = 'browser-monitoring@example.test') {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

async function fitsWidth(page: Page) {
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
}

const leftRail = (page: Page) =>
    page.getByRole('complementary', {
        name: 'Your institution, law surveys and resources',
    });
const rightRail = (page: Page) =>
    page.getByRole('complementary', { name: 'Events and links' });
const feed = (page: Page) =>
    page.getByRole('region', { name: 'HEI Gender Mainstreaming Efforts' });

for (const width of [1440, 1280]) {
    test(`the HEI home has three columns at ${width}px, like Facebook`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await logIn(page);

        // Left, as on Facebook: you (with the institution as the page's
        // heading), then the places to go, Community first and current.
        const left = leftRail(page);
        await expect(
            left.getByRole('heading', { level: 1, name: 'Browser Test HEI' }),
        ).toBeVisible();
        await expect(
            left.getByRole('link', { name: /Browser Test HEI/ }),
        ).toHaveAttribute('href', /\/profile$/);
        const menu = left.getByRole('navigation', { name: 'Your PHLGADIS' });
        await expect(
            menu.getByRole('link', { name: 'Community' }),
        ).toHaveAttribute('aria-current', 'page');
        // Only what the top bar and Quick links do not already offer.
        await expect(menu.getByRole('listitem')).toHaveCount(2);
        await expect(menu.getByText('GAD Quest')).toBeVisible();
        // The four law surveys, open, with nothing painted behind them.
        const surveys = left.getByRole('button', { name: 'Law surveys' });
        await expect(surveys).toHaveAttribute('aria-expanded', 'true');
        await expect(
            left.getByRole('button', { name: 'Copy link for RA 7877' }),
        ).toBeVisible();
        await expect(left.getByText('RA 11313', { exact: true })).toBeVisible();
        // The GAD Quest card (Beta) offers the newest open quest: the
        // fixture from tests/browser/server.php, or one gad-quest.spec.ts
        // opened. The footer closes the column.
        const quest = left.getByRole('region', { name: 'GAD Quest' });
        await expect(quest).toContainText('Beta');
        await expect(
            quest.getByRole('link', { name: /^Play: / }),
        ).toHaveAttribute('href', /\/quests\/[0-9A-Z]{26}$/i);
        const footer = left.getByRole('navigation', { name: 'About PHLGADIS' });
        await expect(footer.getByRole('link', { name: 'FAQ' })).toHaveAttribute(
            'href',
            '/help/faq',
        );
        await expect(
            footer.getByRole('link', { name: 'Feedback' }),
        ).toHaveAttribute('href', '/feedback');
        // Middle: the feed's banner over its illustration, then the posts.
        await expect(
            feed(page).getByRole('heading', {
                name: 'HEI Gender Mainstreaming Efforts',
            }),
        ).toBeVisible();
        await expect(
            feed(page).locator('img[src*="hei-banner"]'),
        ).toHaveAttribute('alt', '');
        // Right: events and links.
        await expect(
            feed(page).getByRole('button', { name: /Share a GAD activity/ }),
        ).toBeVisible();
        await expect(
            rightRail(page).getByRole('link', { name: 'Monitoring Report' }),
        ).toBeVisible();

        const [l, m, r] = await Promise.all(
            [left, feed(page), rightRail(page)].map(
                async (part) => (await part.boundingBox())!,
            ),
        );
        expect(l.x + l.width).toBeLessThan(m.x);
        expect(m.x + m.width).toBeLessThan(r.x);
        // The rails sit at the screen's edges, the feed in the middle.
        expect(l.x).toBeLessThan(24);
        expect(width - (r.x + r.width)).toBeLessThan(24);
        expect(m.width).toBeLessThanOrEqual(672);
        await fitsWidth(page);
        await page.screenshot({
            path: testInfo.outputPath(`hei-home-${width}.png`),
        });

        // Scrolling the feed keeps both rails in view: a rail taller than
        // the screen scrolls until its end shows, then holds.
        await page.mouse.wheel(0, 1600);
        for (const rail of [left, rightRail(page)]) {
            await expect
                .poll(async () => {
                    const box = (await rail.boundingBox())!;
                    return (
                        Math.min(box.y + box.height, 900) - Math.max(box.y, 0)
                    );
                })
                .toBeGreaterThan(300);
        }
    });
}

test('the left menu folds its groups and remembers them', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page);
    const left = leftRail(page);
    // Both groups start open, so the column reads full.
    const resources = left.getByRole('button', { name: 'Resources' });
    await expect(resources).toHaveAttribute('aria-expanded', 'true');
    await expect(
        left.getByRole('button', { name: 'Law surveys' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(
        left.getByRole('link', { name: /Definition of Terms/ }),
    ).toHaveAttribute('href', '/resources/definition-of-terms');
    await expect(left.getByRole('link', { name: /Manuals/ })).toBeVisible();
    // GAD Videos has no page yet, so it is not a link.
    await expect(left.getByText('GAD Videos')).toBeVisible();
    await expect(left.getByRole('link', { name: /GAD Videos/ })).toHaveCount(0);

    // Folding Law surveys and reloading keeps both as they were left.
    await left.getByRole('button', { name: 'Law surveys' }).click();
    await page.reload();
    await expect(
        leftRail(page).getByRole('button', { name: 'Resources' }),
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(
        leftRail(page).getByRole('button', { name: 'Law surveys' }),
    ).toHaveAttribute('aria-expanded', 'false');
});

test('the footer rests at the bottom of the screen until the groups outgrow it', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page);
    const left = leftRail(page);
    // The whole footer: its links and the copyright line under them.
    const footer = left.locator('footer');
    const quest = left.getByRole('region', { name: 'GAD Quest' });

    // Both groups folded: the footer sits 24px above the screen's bottom,
    // the GAD Quest card well above it.
    await left.getByRole('button', { name: 'Law surveys' }).click();
    await left.getByRole('button', { name: 'Resources' }).click();
    await expect
        .poll(async () => {
            const box = (await footer.boundingBox())!;
            return Math.round(900 - (box.y + box.height));
        })
        .toBeLessThanOrEqual(32);
    // The links wrap inside the column rather than running past it.
    const column = (await left.boundingBox())!;
    const links = (await footer.boundingBox())!;
    expect(links.x + links.width).toBeLessThanOrEqual(column.x + column.width);
    const card = (await quest.boundingBox())!;
    expect(
        (await footer.boundingBox())!.y - (card.y + card.height),
    ).toBeGreaterThan(48);

    // Both open: the footer follows the Resources list, never under it.
    await left.getByRole('button', { name: 'Law surveys' }).click();
    await left.getByRole('button', { name: 'Resources' }).click();
    const manuals = (await left
        .getByRole('link', { name: /Manuals/ })
        .boundingBox())!;
    expect((await footer.boundingBox())!.y).toBeGreaterThan(
        manuals.y + manuals.height,
    );
});

test('plain HEI users get people to ask and help, without Quick links', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await logIn(page, 'browser-member@example.test');
    const right = rightRail(page);
    await expect(
        right.getByRole('region', { name: 'Quick links' }),
    ).toHaveCount(0);

    const people = right.getByRole('region', {
        name: 'People at your institution',
    });
    // The real accounts: the institution's GAD Focal Person first, the
    // viewer left out of the list.
    await expect(people.getByRole('listitem').first()).toContainText(
        'Fictional Monitoring Member',
    );
    await expect(people.getByRole('listitem').first()).toContainText(
        'GAD Focal Person',
    );
    await expect(people).not.toContainText('Browser Test Member');
    await expect(people).not.toContainText('Preview');

    const help = right.getByRole('region', { name: 'Need help?' });
    await expect(help.getByRole('link', { name: 'FAQ' })).toHaveAttribute(
        'href',
        '/help/faq',
    );
    await expect(
        help.getByRole('link', { name: 'Send feedback' }),
    ).toHaveAttribute('href', '/feedback');
    await right.screenshot({
        path: testInfo.outputPath('hei-home-member-rail.png'),
    });

    // "Rate PHLGADIS" opens the homepage's rating card.
    await help.getByRole('link', { name: 'Rate PHLGADIS' }).click();
    await expect(
        page.getByRole('dialog', { name: 'How would you rate PHLGADIS?' }),
    ).toBeVisible();
});

test('HEI Focals get the same cards under their Quick links', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page);
    const right = rightRail(page);
    const cards = right.getByRole('region');
    await expect(cards.getByRole('heading', { level: 2 })).toContainText([
        'Quick links',
        'People at your institution',
        'Need help?',
    ]);
});

test('narrower, the home keeps the right rail beside the feed, then one column', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await logIn(page);
    await expect(leftRail(page)).toBeHidden();
    await expect(
        page.getByRole('heading', { level: 1, name: 'Browser Test HEI' }),
    ).toBeVisible();
    // The law surveys are a plain card, without the old pink gradient.
    const lawSurveys = page.getByRole('region', { name: 'Law surveys' });
    await expect(lawSurveys).toBeVisible();
    expect(
        await lawSurveys.evaluate(
            (element) => getComputedStyle(element).backgroundImage,
        ),
    ).toBe('none');
    await expect(rightRail(page)).toBeVisible();
    await fitsWidth(page);
    await page.screenshot({ path: testInfo.outputPath('hei-home-1024.png') });

    await page.setViewportSize({ width: 375, height: 800 });
    await expect(rightRail(page)).toBeHidden();
    await expect(
        page.getByRole('heading', { name: 'Law surveys' }),
    ).toBeVisible();
    await fitsWidth(page);
    await page.screenshot({ path: testInfo.outputPath('hei-home-375.png') });
});

for (const colorScheme of ['light', 'dark'] as const) {
    test(`the HEI home meets WCAG AA in ${colorScheme} mode`, async ({
        page,
    }, testInfo) => {
        await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
        await page.setViewportSize({ width: 1440, height: 900 });
        await logIn(page);
        await page.evaluate(
            (dark) => document.documentElement.classList.toggle('dark', dark),
            colorScheme === 'dark',
        );
        await expect(feed(page).getByRole('article').first()).toBeVisible();
        await page.waitForTimeout(300);
        await page.screenshot({
            path: testInfo.outputPath(`hei-home-${colorScheme}-1440.png`),
        });
        const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(
            result.violations.map(({ id, nodes }) => ({
                id,
                nodes: nodes.map((node) => node.target),
            })),
        ).toEqual([]);
    });
}
