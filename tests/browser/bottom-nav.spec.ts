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

const bar = (page: Page) => page.getByRole('navigation', { name: 'Main' });

test('on a phone, HEI accounts move around with a bottom bar', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await logIn(page);

    // Home, Events, Quest, Monitoring (an HEI Focal), Menu; Home current.
    const nav = bar(page);
    await expect(
        nav.getByRole('listitem').filter({ visible: true }),
    ).toHaveText(['Home', 'Events', 'Quest', 'Monitoring', 'Menu']);
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'aria-current',
        'page',
    );
    // It sits at the very bottom, and the side menu button is gone.
    const box = await nav.boundingBox();
    expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(844);
    await expect(
        page.getByRole('button', { name: 'Open navigation menu' }),
    ).toHaveCount(0);

    // A tab goes there and turns current; a Monitoring page lights Monitoring.
    await nav.getByRole('link', { name: 'Events' }).click();
    await expect(page).toHaveURL(/\/events$/);
    await expect(nav.getByRole('link', { name: 'Events' })).toHaveAttribute(
        'aria-current',
        'page',
    );
    await page.goto('/records/training');
    await expect(
        bar(page).getByRole('link', { name: 'Monitoring' }),
    ).toHaveAttribute('aria-current', 'page');

    // Menu opens every page from the bottom.
    await bar(page).getByRole('button', { name: 'Menu', exact: true }).click();
    const sheet = page.getByRole('dialog', { name: 'Menu' });
    await expect(
        sheet.getByRole('link', { name: 'Compliance Survey' }),
    ).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: testInfo.outputPath('bottom-nav-menu.png') });
    await sheet.getByRole('link', { name: 'Compliance Survey' }).click();
    await expect(page).toHaveURL(/\/records\/compliance$/);
    await expect(sheet).toHaveCount(0);

    // The page keeps room for the bar, so its end is never hidden under it.
    await page.goto('/dashboard');
    const room = await page
        .getByRole('main')
        .evaluate((main) => parseFloat(getComputedStyle(main).paddingBottom));
    const barBox = await bar(page).boundingBox();
    expect(room).toBeGreaterThanOrEqual(Math.floor(barBox?.height ?? 0));
    await page.screenshot({ path: testInfo.outputPath('bottom-nav-feed.png') });

    for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        // Let the tabs' colour fade finish before measuring contrast.
        await page.waitForTimeout(400);
        const result = await new AxeBuilder({ page })
            .include('nav[aria-label="Main"]')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
        expect(result.violations).toEqual([]);
    }
});

test('a plain HEI account has no Monitoring tab, and computers keep the top tabs', async ({
    page,
}) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await logIn(page, 'browser-member@example.test');
    await expect(
        bar(page).getByRole('listitem').filter({ visible: true }),
    ).toHaveText(['Home', 'Events', 'Quest', 'Menu']);

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(
        page.getByRole('button', { name: 'Menu', exact: true }),
    ).toBeHidden();
    await expect(
        bar(page).getByRole('link', { name: 'Community' }),
    ).toBeVisible();
});

test('the bar steps aside while typing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await logIn(page);
    await page.getByRole('button', { name: 'Search PHLGADIS' }).click();
    await expect(bar(page)).not.toBeInViewport();
    await page.keyboard.press('Escape');
    await page.locator('body').click({ position: { x: 10, y: 400 } });
    await expect(bar(page)).toBeInViewport();
});
