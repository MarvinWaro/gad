import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('About topics open within the landing page without navigation', async ({
    page,
}) => {
    await page.goto('/');
    await page
        .getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: 'About' })
        .click();
    await expect(page).toHaveURL(/\/#about$/);

    const about = page.locator('#about');
    const topics = about.getByRole('group', { name: 'About us topics' });
    const content = about.getByRole('region', { name: 'GAD Herstory' });
    await expect(topics.getByRole('button')).toHaveCount(5);
    await expect(content.locator('figure')).toHaveCount(3);

    for (const [label, text] of [
        [
            'Organizational Chart',
            'The organizational chart from the previous site is not available',
        ],
        [
            'What is PHLGADIS?',
            'Philippine Higher Education Gender and Development Information System',
        ],
        [
            'The Logo',
            'Philippine Higher Education Gender and Development Information System',
        ],
        ['Sustainable Development Goals', 'Sustainable Development Goals'],
    ]) {
        const button = topics.getByRole('button', { name: label });
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(about.getByRole('region', { name: label })).toContainText(
            text,
        );
        await expect(page).toHaveURL(/\/#about$/);
    }
    await expect(about.locator('.about-goals img')).toHaveCount(17);
    await expect(
        about.getByRole('img', { name: 'Goal 5: Gender Equality' }),
    ).toBeVisible();
});

test('About module remains usable on mobile and in the public light theme', async ({
    page,
}, testInfo) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page
        .getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: 'About' })
        .click();
    await expect(page).toHaveURL(/\/#about$/);
    const about = page.locator('#about');
    await about.getByRole('button', { name: 'The Logo' }).click();
    await expect(
        about.getByRole('img', {
            name: /PHLGADIS — Philippine Higher Education/,
        }),
    ).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth,
        ),
    ).toBe(false);
    await about.screenshot({ path: testInfo.outputPath('about-mobile.png') });
    const accessibility = await new AxeBuilder({ page })
        .include('#about')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
    expect(accessibility.violations).toEqual([]);
});
