import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the activity log lists sign-ins and changes, filters them and shows what changed', async ({
    page,
}) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);

    // A change to log: the admin's own mobile number.
    await page.goto('/settings/profile');
    await page.getByLabel(/Mobile number/).fill('09171234567');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Profile updated.').first()).toBeVisible();

    await page.goto('/settings');
    await page
        .getByRole('navigation', { name: 'Settings' })
        .getByRole('link', { name: 'Activity logs' })
        .click();
    await expect(page).toHaveURL(/settings\/activity-logs/);
    await expect(
        page.getByRole('heading', { name: 'Activity logs' }),
    ).toBeVisible();

    const list = page.getByRole('list', { name: 'Activity, newest first' });
    const update = list
        .getByRole('article')
        .filter({ hasText: 'My account' })
        .first();
    await expect(update).toContainText('Updated their own account');
    await update.getByText(/View changes/).click();
    await expect(
        update.getByRole('row', { name: /Mobile number/ }),
    ).toContainText('09171234567');

    await page.getByLabel('Action').click();
    await page.getByRole('option', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL(/action=login/);
    await expect(list.getByRole('article').first()).toContainText('Logged in');
    await expect(
        list.getByRole('article').filter({ hasText: 'My account' }),
    ).toHaveCount(0);

    for (const width of [375, 768, 1280, 1536]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('body')).toHaveJSProperty(
            'scrollWidth',
            await page.locator('body').evaluate((body) => body.clientWidth),
        );
    }

    const light = await new AxeBuilder({ page }).include('main').analyze();
    expect(light.violations).toEqual([]);
    await page.getByRole('button', { name: 'Toggle dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    const dark = await new AxeBuilder({ page }).include('main').analyze();
    expect(dark.violations).toEqual([]);
});
