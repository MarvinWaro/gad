import { expect, test } from '@playwright/test';

const linkTargets = (page: import('@playwright/test').Page, name: string) =>
    page
        .getByRole('navigation', { name })
        .getByRole('link')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')));

test('public navigation follows the order of the homepage sections', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    const desktop = await linkTargets(page, 'Main navigation');
    expect(desktop).toEqual([
        '#home',
        '#surveys',
        '#statistics',
        '#resources',
        '#about',
    ]);
    const positions = await page.evaluate(
        (hrefs) =>
            hrefs.map(
                (href) =>
                    document
                        .getElementById(String(href).slice(1))!
                        .getBoundingClientRect().top + window.scrollY,
            ),
        desktop,
    );
    expect(positions).toEqual([...positions].sort((a, b) => a - b));

    await page.setViewportSize({ width: 375, height: 800 });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    expect(await linkTargets(page, 'Mobile navigation')).toEqual(desktop);
});
