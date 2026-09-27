import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('appearance and navigation choices persist without losing app navigation', async ({
    page,
}) => {
    await page.goto('/login');
    await page.getByLabel('Email address').fill('browser-admin@example.test');
    await page.getByLabel('Password', { exact: true }).fill('browser-password');
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);

    await page.goto('/settings/appearance');
    const light = page.getByRole('button', { name: /^Light / });
    const dark = page.getByRole('button', { name: /^Dark / });
    const system = page.getByRole('button', { name: /^System / });
    const sidebar = page.getByRole('button', {
        name: /^Sidebar Navigation /,
    });
    const header = page.getByRole('button', { name: /^Header Navigation / });

    await dark.click();
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await light.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await system.click();
    await expect(system).toHaveAttribute('aria-pressed', 'true');

    await header.click();
    await expect(header).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('link', { name: 'Carousel' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Surveys' })).toBeVisible();
    await page.reload();
    await expect(header).toHaveAttribute('aria-pressed', 'true');
    await expect(system).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('link', { name: 'Carousel' }).click();
    await expect(page).toHaveURL(/admin\/carousels/);

    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto('/settings/appearance');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.getByRole('link', { name: 'Surveys' }).click();
    await expect(page).toHaveURL(/admin\/surveys/);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await page.goto('/settings/appearance');
    await sidebar.click();
    await expect(sidebar).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await expect(sidebar).toHaveAttribute('aria-pressed', 'true');

    for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.locator('body')).toHaveJSProperty(
            'scrollWidth',
            await page.locator('body').evaluate((body) => body.clientWidth),
        );
    }

    const accessibility = await new AxeBuilder({ page })
        .include('main')
        .analyze();
    expect(accessibility.violations).toEqual([]);
});
