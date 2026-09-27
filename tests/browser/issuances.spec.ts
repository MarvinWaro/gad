import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const url = '/resources/issuances';

// The old PHLGADIS list, word for word.
const issuances = [
    {
        number: 'CMO No. 01 S. 2015',
        title: 'Establishing the Policies and Guidelines on Gender and Development in CHED and HEIs',
        href: '/assets/document/cmo_no._01_s._2015.pdf',
        source: 'PDF · 6.7 MB',
        laws: ['RA 7877', 'RA 9262', 'RA 9710'],
    },
    {
        number: 'CMO No. 3 S. 2022',
        title: 'Guidelines on Gender-Based Sexual Harassment in Higher Education Institutions',
        href: '/assets/document/cmo_no._3_s._2022.pdf',
        source: 'PDF · 12.8 MB',
        laws: ['RA 11313'],
    },
];

for (const width of [375, 768, 1280]) {
    test(`Issuances lists the CHED memorandum orders and fits at ${width}px`, async ({
        page,
    }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(url);

        await expect(
            page.getByRole('heading', { level: 1, name: 'Issuances' }),
        ).toBeVisible();
        expect(await page.locator('.public-theme').boundingBox()).toMatchObject(
            { x: 0, width },
        );

        const rows = page.locator('.resource-row');
        await expect(rows).toHaveCount(issuances.length);
        for (let index = 0; index < issuances.length; index++) {
            const { number, title, href, source, laws } = issuances[index];
            const row = rows.nth(index);
            await expect(row.locator('.law-number')).toHaveText(number);
            await expect(row.getByRole('heading', { level: 2 })).toHaveText(
                title,
            );
            await expect(
                row.getByRole('link', { name: `Read the CMO ${number}` }),
            ).toHaveAttribute('href', href);
            await expect(row.locator('.resource-row-source')).toHaveText(
                source,
            );
            // Each chip shows the RA number; screen readers also hear its
            // short title.
            await expect(row.locator('.resource-row-laws a')).toContainText(
                laws,
            );
        }
        await expect(rows.nth(0).locator('time')).toHaveText(
            'January 26, 2015',
        );
        // CMO No. 3 s. 2022 states no issue date, so none is shown.
        await expect(rows.nth(1).locator('time')).toHaveCount(0);

        expect(
            await page.evaluate(
                () => document.documentElement.scrollWidth > window.innerWidth,
            ),
        ).toBe(false);
        await page.screenshot({
            path: testInfo.outputPath(`issuances-${width}.png`),
            fullPage: true,
        });

        const accessibility = await new AxeBuilder({ page })
            .include('#main')
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            .analyze();
        expect(accessibility.violations).toEqual([]);
    });
}

test('an issuance links to the laws it names', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url);

    await page
        .locator('.resource-row-laws')
        .getByRole('link', { name: /RA 11313/ })
        .click();
    await expect(page).toHaveURL(
        /\/resources\/gad-enabling-republic-acts#ra-11313$/,
    );
    await expect(page.locator('#ra-11313')).toBeInViewport();
});
