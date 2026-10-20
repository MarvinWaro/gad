import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * The HEI home's guided tour: once by itself for a new HEI account, fitted
 * to its role and screen, then again only when asked for. The fixture's two
 * tour accounts have never seen it; every other account has.
 */

test.describe.configure({ mode: 'serial' });

async function logIn(page: Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

const tourOf = (page: Page) => page.locator('.driver-popover.hei-tour');

/** Walks the tour with Next to its end, returning each step's title. */
async function walk(page: Page, testInfo: TestInfo, name: string) {
    const tour = tourOf(page);
    const titles: string[] = [];

    for (let step = 1; step <= 12; step++) {
        await expect(tour).toBeVisible();
        titles.push(
            (await tour.locator('.driver-popover-title').textContent()) ?? '',
        );
        // Past the fade and the move to the step.
        await page.waitForTimeout(500);
        await page.screenshot({
            path: testInfo.outputPath(`${name}-${step}.png`),
        });
        const done = tour.getByRole('button', { name: 'Done' });
        if (await done.isVisible()) {
            await done.click();
            break;
        }
        await tour.getByRole('button', { name: 'Next' }).click();
    }

    return titles;
}

test('a new HEI Focal is shown around their home once, Monitoring and Quick links included', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, 'browser-tour-focal@example.test');

    const tour = tourOf(page);
    await expect(tour).toBeVisible({ timeout: 10_000 });
    await expect(tour.locator('.driver-popover-progress-text')).toHaveText(
        '1 of 10',
    );
    const seen = page.waitForResponse(
        (response) =>
            response.url().endsWith('/tour/seen') && response.status() === 204,
    );
    expect(await walk(page, testInfo, 'focal-1440')).toEqual([
        'Welcome to PHLGADIS, Fictional',
        'Share a GAD activity',
        'Your feed',
        'Law surveys',
        'Events',
        'GAD Quest',
        'Monitoring',
        'Quick links',
        'Notifications',
        'You',
    ]);
    await seen;
    await expect(tour).toHaveCount(0);

    // Not again on the next visit.
    await page.reload();
    await page.waitForTimeout(1_500);
    await expect(tour).toHaveCount(0);
});

test('on a phone, an HEI User is shown the bottom bar, without Monitoring; Esc ends it for good', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await logIn(page, 'browser-tour@example.test');

    const tour = tourOf(page);
    await expect(tour).toBeVisible({ timeout: 10_000 });
    await expect(tour.locator('.driver-popover-progress-text')).toHaveText(
        '1 of 8',
    );

    // Events points at the bar along the bottom of the screen.
    for (let step = 1; step < 5; step++) {
        await tour.getByRole('button', { name: 'Next' }).click();
    }
    await expect(tour.locator('.driver-popover-title')).toHaveText('Events');
    // The bar's Events tab is lit; the header's tabs are hidden on phones.
    const highlighted = page.locator(
        '[data-tour="events"].driver-active-element',
    );
    await expect(highlighted).toBeVisible();
    // Enter presses Next, where the tour puts the focus.
    await expect(tour.getByRole('button', { name: 'Next' })).toBeFocused();
    await page.waitForTimeout(500);
    const box = await highlighted.boundingBox();
    expect(box!.y).toBeGreaterThan(844 / 2);
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('member-390-events.png'),
    });

    const seen = page.waitForResponse((response) =>
        response.url().endsWith('/tour/seen'),
    );
    await page.keyboard.press('Escape');
    await seen;
    await expect(tour).toHaveCount(0);
    await page.reload();
    await page.waitForTimeout(1_500);
    await expect(tour).toHaveCount(0);
});

test('"Take the tour" in the account menu and the help links shows it again', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await logIn(page, 'browser-tour@example.test');
    const tour = tourOf(page);

    // From another page, the account menu brings them home for it.
    await page.goto('/events');
    await page.getByRole('button', { name: /^Account menu/ }).click();
    await page.getByRole('menuitem', { name: 'Take the tour' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(tour).toBeVisible({ timeout: 10_000 });
    await tour.getByRole('button', { name: 'Close' }).click();
    await expect(tour).toHaveCount(0);

    // The left column's help links offer it too.
    await page
        .getByRole('navigation', { name: 'About PHLGADIS' })
        .getByRole('link', { name: 'Take the tour' })
        .click();
    await expect(tour).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard$/);
});

for (const theme of ['light', 'dark'] as const) {
    test(`the tour is readable and accessible in ${theme} mode`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.emulateMedia({ colorScheme: theme });
        await logIn(page, 'browser-tour@example.test');
        await page.goto('/dashboard?tour=1');
        const tour = tourOf(page);
        await expect(tour).toBeVisible({ timeout: 10_000 });
        await tour.getByRole('button', { name: 'Next' }).click();
        await expect(tour.locator('.driver-popover-title')).toHaveText(
            'Share a GAD activity',
        );
        await page.waitForTimeout(500);
        await page.screenshot({
            path: testInfo.outputPath(`tour-${theme}.png`),
        });

        const scan = await new AxeBuilder({ page })
            .include('.driver-popover')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(scan.violations).toEqual([]);
    });
}
