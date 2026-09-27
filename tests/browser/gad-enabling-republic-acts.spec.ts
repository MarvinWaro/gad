import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const url = '/resources/gad-enabling-republic-acts';

// The old PHLGADIS list: "RA 7877 - Anti-Sexual Harassment Law" and so on.
const acts = [
    ['RA 7877', 'Anti-Sexual Harassment Law', '/assets/document/ra7877.pdf'],
    [
        'RA 9262',
        'VAWC',
        'https://lawphil.net/statutes/repacts/ra2004/ra_9262_2004.html',
    ],
    ['RA 9710', 'Magna Carta of Women', '/assets/document/ra9710.pdf'],
    ['RA 11313', 'Safe Spaces Act', '/assets/document/ra11313.pdf'],
];

for (const width of [375, 768, 1280]) {
    test(`GAD Enabling Republic Acts lists the four laws and fits at ${width}px`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(url);

        await expect(
            page.getByRole('heading', {
                level: 1,
                name: 'GAD Enabling Republic Acts',
            }),
        ).toBeVisible();
        expect(await page.locator('.public-theme').boundingBox()).toMatchObject(
            { x: 0, width },
        );

        const rows = page.locator('.resource-row');
        await expect(rows).toHaveCount(4);
        for (let index = 0; index < acts.length; index++) {
            const [number, name, href] = acts[index];
            const row = rows.nth(index);
            await expect(row.locator('.law-number')).toHaveText(number);
            await expect(row.getByRole('heading', { level: 2 })).toHaveText(
                name,
            );
            await expect(
                row.getByRole('link', { name: `Read the Act ${number}` }),
            ).toHaveAttribute('href', href);
        }
        await expect(rows.nth(0)).toContainText(
            'Anti-Sexual Harassment Act of 1995',
        );
        await expect(rows.nth(0).locator('time')).toHaveText(
            'February 14, 1995',
        );
        // Only RA 9262 has a brochure, and RA 7877 defines no glossary terms.
        await expect(
            page.getByRole('link', { name: /Information brochure/ }),
        ).toHaveCount(1);
        await expect(
            rows.nth(1).getByRole('link', { name: /Information brochure/ }),
        ).toHaveAttribute('href', '/assets/document/ra9262.pdf');
        await expect(
            page.getByRole('link', { name: /terms in Definition of Terms/ }),
        ).toHaveCount(3);
        await expect(rows.nth(0).locator('.resource-row-link')).toHaveCount(0);
        await expect(rows.nth(0).locator('.resource-row-source')).toHaveText(
            'PDF · 121 kB',
        );
        await expect(rows.nth(1).locator('.resource-row-source')).toHaveText(
            'lawphil.net',
        );

        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            ),
        ).toBe(false);
        await page.screenshot({
            path: testInfo.outputPath(`acts-${width}.png`),
            fullPage: true,
        });

        const accessibility = await new AxeBuilder({ page })
            .include('#main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(accessibility.violations).toEqual([]);
    });
}

test('each Act links to the terms it defines', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);

    await page
        .getByRole('link', { name: '11 terms in Definition of Terms' })
        .click();
    await expect(page).toHaveURL(/\/resources\/definition-of-terms#ra-9262$/);
    await expect(page.locator('#ra-9262')).toBeInViewport();
    await expect(page.locator('.glossary-entry')).toHaveCount(19);
});
