import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the HEI directory filters as soon as a filter changes', async ({
    page,
}, testInfo) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/settings/heis');

    const filters = page.getByRole('group', { name: 'Filter HEIs' });
    const rows = page.getByRole('table').locator('tbody tr');
    await filters.getByLabel('Search').fill('Browser Test');
    await expect(page).toHaveURL(/search=Browser/);
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Browser Test HEI');

    await filters.getByRole('combobox', { name: 'Region' }).click();
    await page.getByRole('option', { name: 'Regional Office XII' }).click();
    await expect(page).toHaveURL(/region=\d+/);
    // The fixture's institutions sit in one cluster, so there is none to pick.
    await expect(
        filters.getByRole('combobox', { name: 'Cluster' }),
    ).toHaveCount(0);
    await expect(rows).toHaveCount(1);

    for (const theme of ['light', 'dark'] as const) {
        await page.evaluate(
            (dark) => document.documentElement.classList.toggle('dark', dark),
            theme === 'dark',
        );
        await page.waitForTimeout(300);
        await page.screenshot({
            path: testInfo.outputPath(`heis-filtered-${theme}.png`),
        });
        expect(
            (
                await new AxeBuilder({ page })
                    .include('main')
                    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
                    .analyze()
            ).violations,
        ).toEqual([]);
    }
    await page.evaluate(() =>
        document.documentElement.classList.remove('dark'),
    );

    await filters.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Inactive', exact: true }).click();
    await expect(page.getByText('No HEIs match these filters')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).toHaveURL(/\/settings\/heis$/);
    await expect(rows.first()).toBeVisible();

    await page.setViewportSize({ width: 375, height: 800 });
    expect(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    ).toBe(true);
    await page.screenshot({
        path: testInfo.outputPath('heis-375.png'),
        fullPage: true,
    });
});
