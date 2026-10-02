import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function logIn(page: Page) {
    await page.goto('/login');
    await page
        .getByLabel('Email address')
        .fill('browser-monitoring@example.test');
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
        name: 'Your institution and law surveys',
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

        // Left: the institution, then the four law surveys, stacked.
        const left = leftRail(page);
        await expect(
            left.getByRole('heading', { level: 1, name: 'Browser Test HEI' }),
        ).toBeVisible();
        await expect(
            left.getByRole('heading', { name: 'Law surveys' }),
        ).toBeVisible();
        await expect(left.getByRole('listitem')).toHaveCount(4);
        // Middle: only the posts. Right: events and links.
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

test('narrower, the home keeps the right rail beside the feed, then one column', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await logIn(page);
    await expect(leftRail(page)).toBeHidden();
    await expect(
        page.getByRole('heading', { level: 1, name: 'Browser Test HEI' }),
    ).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Law surveys' }),
    ).toBeVisible();
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
