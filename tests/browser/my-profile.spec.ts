import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function logIn(page: import('@playwright/test').Page, email: string) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
}

test('My Profile preview works for staff and keeps account settings available', async ({
    page,
}) => {
    await logIn(page, 'browser-admin@example.test');
    await page.locator('[data-test="sidebar-menu-button"]').click();
    await page.getByRole('menuitem', { name: 'My Profile' }).click();

    await expect(page).toHaveURL(/settings\/profile\?view=my-profile/);
    await expect(page.locator('h1#profile-name')).toBeVisible();
    await expect(
        page.getByRole('heading', { name: 'Your activity space' }),
    ).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Follow · coming soon' }),
    ).toBeDisabled();

    await page.getByRole('tab', { name: 'About' }).click();
    await expect(
        page.getByRole('heading', { name: 'Profile details' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Manage account details' }).click();
    await expect(page).toHaveURL(/settings\/profile$/);
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();

    await page.goto('/settings/profile?view=my-profile');
    for (const width of [375, 768, 1280, 1536]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('body')).toHaveJSProperty(
            'scrollWidth',
            await page.locator('body').evaluate((body) => body.clientWidth),
        );
        const cover = await page
            .locator('[data-test="profile-cover"]')
            .boundingBox();
        const main = await page.locator('main').boundingBox();
        const appBar = await page.locator('main > header').boundingBox();
        expect(cover).not.toBeNull();
        expect(main).not.toBeNull();
        expect(appBar).not.toBeNull();
        const leftGutter = cover!.x - main!.x;
        const rightGutter = main!.x + main!.width - (cover!.x + cover!.width);
        if (width >= 1280) {
            expect(leftGutter).toBeGreaterThan(0);
        } else {
            expect(leftGutter).toBeCloseTo(0, 0);
        }
        expect(rightGutter).toBeCloseTo(leftGutter, 0);
        expect(cover!.y).toBeCloseTo(appBar!.y + appBar!.height, 0);
        const notice = await page
            .locator('[data-test="profile-notice"]')
            .boundingBox();
        expect(notice).not.toBeNull();
        expect(notice!.x).toBeGreaterThan(cover!.x);
        expect(notice!.x + notice!.width).toBeLessThan(cover!.x + cover!.width);
    }
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const accessibility = await new AxeBuilder({ page })
        .include('main')
        .analyze();
    expect(accessibility.violations).toEqual([]);
});

test('HEI profile preview uses the institution attached to the account', async ({
    page,
}) => {
    await logIn(page, 'browser-monitoring@example.test');
    await page.goto('/settings/profile?view=my-profile');
    await expect(
        page.getByRole('heading', { name: 'Fictional Monitoring Member' }),
    ).toBeVisible();
    await expect(page.getByText('Browser Test HEI').first()).toBeVisible();
    await expect(page.getByText('HEI Focal').first()).toBeVisible();
});
